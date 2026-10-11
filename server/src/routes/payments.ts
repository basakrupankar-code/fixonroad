import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { z } from 'zod';

const router = Router();

// Helper to create Razorpay Order via REST API (Basic Auth using test credentials from .env)
const createRazorpayOrder = async (amountPaise: number, receiptId: string, notes?: Record<string, string>) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured in environment (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)');
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId.slice(0, 40),
      notes: notes || {}
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.description || `Razorpay API error: ${response.statusText} (${response.status})`);
  }

  return response.json();
};

// Helper to verify Razorpay HMAC-SHA256 signature
const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string): boolean => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

// Helper to verify Razorpay Webhook HMAC-SHA256 signature
const verifyWebhookSignature = (rawBody: string | Buffer, signature: string): boolean => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const generated = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return generated === signature;
};

// Public config endpoint so frontend can fetch active test key
router.get('/config', (req, res) => {
  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TmgnRVOfgBgCJV',
    currency: 'INR',
    mode: 'test'
  });
});

const createOrderSchema = z.object({
  serviceType: z.string().optional().default('flat-tire'),
  basePrice: z.number().optional().default(150),
  location: z.object({
    lat: z.number().optional().default(0),
    lng: z.number().optional().default(0),
    address: z.string().optional().default('Kalyani, West Bengal')
  }).optional().default({ lat: 0, lng: 0, address: 'Kalyani, West Bengal' }),
  paymentMethod: z.enum(['cod', 'razorpay', 'upi', 'card', 'netbanking']).optional().default('cod'),
  bookingId: z.string().optional()
});

router.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const parsed = createOrderSchema.parse(req.body);
    
    const basePrice = parsed.basePrice;
    const serviceGst = Math.round(basePrice * 0.18);
    const platformFee = 10;
    const platformGst = Math.round(platformFee * 0.18);
    const totalAmount = basePrice + serviceGst + platformFee + platformGst;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let order;
    if (parsed.bookingId) {
      order = await Order.findById(parsed.bookingId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      order.paymentMethod = parsed.paymentMethod;
      order.expiresAt = expiresAt;
      await order.save();
    } else {
      let effectiveUserId = req.user?.userId || req.user?._id;
      if (!effectiveUserId) {
        let guestUser = await User.findOne({ email: 'guest@fixonroad.com' });
        if (!guestUser) {
          guestUser = await User.create({
            name: 'Guest Customer',
            email: 'guest@fixonroad.com',
            phone: '+919999999999',
            role: 'customer'
          });
        }
        effectiveUserId = guestUser._id;
      }

      order = await Order.create({
        userId: effectiveUserId,
        serviceDetails: {
          serviceType: parsed.serviceType,
          basePrice: basePrice,
          gst: serviceGst,
          platformFee: platformFee + platformGst,
          totalAmount: totalAmount
        },
        location: parsed.location,
        paymentMethod: parsed.paymentMethod,
        status: 'PENDING',
        expiresAt
      });

      if (req.user?.userId) {
        await User.findByIdAndUpdate(req.user.userId, { activeOrderId: order._id });
      }
    }

    // Cash on Delivery
    if (parsed.paymentMethod === 'cod') {
      return res.json({
        success: true,
        data: {
          ...order.toObject(),
          orderId: order._id.toString()
        }
      });
    }

    // Online payment via Razorpay test mode
    const amountPaise = Math.round(totalAmount * 100);
    const rzpOrder = await createRazorpayOrder(amountPaise, `rcpt_${order._id}`, {
      bookingOrderId: order._id.toString(),
      serviceType: parsed.serviceType,
      environment: 'test'
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    return res.json({
      success: true,
      data: {
        ...order.toObject(),
        orderId: order._id.toString(),
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount, // amount in paise
        amountPaise: rzpOrder.amount,
        currency: rzpOrder.currency || 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TmgnRVOfgBgCJV'
      }
    });
  } catch (error) {
    next(error);
  }
});

const handlePaymentVerification = async (req: any, res: any, next: any) => {
  try {
    const { orderId, bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const targetId = orderId || bookingId;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(targetId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'EXPIRED' || (order.expiresAt && order.expiresAt < new Date())) {
      order.status = 'EXPIRED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment window expired' });
    }

    // Verify Razorpay HMAC signature if online payment identifiers are provided
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        order.status = 'FAILED';
        await order.save();
        return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
      }

      order.razorpayOrderId = razorpay_order_id;
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
    }

    order.status = 'PAID';
    await order.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: order,
      status: 'PAID'
    });
  } catch (error) {
    next(error);
  }
};

router.post('/verify-payment', requireAuth, handlePaymentVerification);
router.post('/verify', requireAuth, handlePaymentVerification);

// Razorpay Webhook listener (HMAC-SHA256 verified)
router.post('/webhook/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    let rawBody: string | Buffer = '';
    
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if ((req as any).rawBody) {
      rawBody = (req as any).rawBody;
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (req.body) {
      rawBody = JSON.stringify(req.body);
    }

    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    let body: any = {};
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf-8') || '{}');
    } else if (typeof req.body === 'string') {
      body = JSON.parse(req.body || '{}');
    } else {
      body = req.body || {};
    }
    const event = body?.event;
    const payload = body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      if (rzpOrderId) {
        await Order.findOneAndUpdate(
          { razorpayOrderId: rzpOrderId },
          { 
            status: 'PAID', 
            razorpayPaymentId: paymentEntity?.id 
          }
        );
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook processing error:', err);
    res.status(500).json({ status: 'error' });
  }
});

export const paymentsRouter = router;

