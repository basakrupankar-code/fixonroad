import { Router } from 'express';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    const { mechanicId, serviceId, pickup, notes } = req.body;
    // TODO: Create requested booking in DB, emit event to mechanic
    res.status(201).json({
      id: 'b_1',
      status: 'REQUESTED',
      priceInr: 250,
      feeInr: 50,
      totalInr: 300,
      expiresAt: new Date(Date.now() + 60000).toISOString() // expires in 60s
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', (req, res, next) => {
  try {
    const { status, active } = req.query;
    // TODO: List user's bookings
    res.json({ bookings: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Get booking details
    res.json({ id, status: 'REQUESTED' }); // Dummy
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // TODO: Update booking status, emit socket event
    res.json({ id, status, acceptedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

export const bookingsRouter = router;
