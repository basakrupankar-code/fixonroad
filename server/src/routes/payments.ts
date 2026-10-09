import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { Order } from '../models/Order';
import { z } from 'zod';

const router = Router();

const createOrderSchema = z.object({
  serviceType: z.string(),
  basePrice: z.number(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  })
});

router.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const parsed = createOrderSchema.parse(req.body);
    
    const gst = parsed.basePrice * 0.18;
    const platformFee = 50;
    const totalAmount = parsed.basePrice + gst + platformFee;

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const order = await Order.create({
      userId: req.user?.userId,
      serviceDetails: {
        serviceType: parsed.serviceType,
        basePrice: parsed.basePrice,
        gst,
        platformFee,
        totalAmount
      },
      location: parsed.location,
      status: 'PENDING',
      expiresAt
    });

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-payment', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'EXPIRED' || (order.expiresAt && order.expiresAt < new Date())) {
      order.status = 'EXPIRED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment expired' });
    }

    order.status = 'PAID';
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export const paymentsRouter = router;
