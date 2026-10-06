import { Router } from 'express';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    const { bookingId, rating, comment, tags } = req.body;
    // TODO: create review, update mechanic rating avg
    res.status(201).json({ id: 'r_1' });
  } catch (error) {
    next(error);
  }
});

export const reviewsRouter = router;
