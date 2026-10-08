import { Router } from 'express';

const router = Router();

router.post('/cash-confirm', (req, res, next) => {
  try {
    const { bookingId, amount, location, method } = req.body;
    // Mark booking as pending/paid (cash/upi)
    // Note: Since Direct UPI intent doesn't automatically confirm payment on the backend unless we implement UPI callbacks,
    // this simply records the order intent.
    res.json({ status: 'PAID' });
  } catch (error) {
    next(error);
  }
});

export const paymentsRouter = router;
