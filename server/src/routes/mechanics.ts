import { Router } from 'express';

const router = Router();

router.get('/nearby', (req, res, next) => {
  try {
    const { lat, lng, serviceId, radiusKm } = req.query;
    // TODO: DB query using PostGIS ST_DWithin
    res.json({
      mechanics: [
        {
          id: 'm_1',
          name: 'Rohit Kumar',
          garageName: 'RiderFix Garage',
          distanceKm: 1.2,
          etaMinutes: 10,
          ratingAvg: 4.8,
          ratingCount: 254,
          priceInr: 250,
          feeInr: 50
        }
      ]
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/reviews', (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Get reviews for mechanic
    res.json({ reviews: [] });
  } catch (error) {
    next(error);
  }
});

export const mechanicsRouter = router;
