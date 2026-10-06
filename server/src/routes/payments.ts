import { Router } from 'express';

const router = Router();

router.post('/create-order', (req, res, next) => {
  try {
    const { bookingId } = req.body;
    // TODO: Create Razorpay order
    res.json({ orderId: 'order_xxx', amountPaise: 30000, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // TODO: Verify Razorpay signature, mark booking as paid
    res.json({ status: 'PAID' });
  } catch (error) {
    next(error);
  }
});

router.post('/cash-confirm', (req, res, next) => {
  try {
    const { bookingId } = req.body;
    // TODO: Mark booking as paid (cash)
    res.json({ status: 'PAID' });
  } catch (error) {
    next(error);
  }
});

export const paymentsRouter = router;
