import { Router } from 'express';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const { vehicle } = req.query;
    // TODO: fetch services from DB
    res.json({
      services: [
        { id: 1, name: 'Puncture Repair', description: 'Get help for tyre puncture', basePriceInr: 250 },
        { id: 2, name: 'Battery Problem', description: 'Jump start / battery change', basePriceInr: 800 },
        { id: 5, name: 'General Service', description: 'Oil change, basic service', basePriceInr: 500 }
      ]
    });
  } catch (error) {
    next(error);
  }
});

export const servicesRouter = router;
