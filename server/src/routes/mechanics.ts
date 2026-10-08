import { Router } from 'express';
import { Mechanic } from '../models/Mechanic';

const router = Router();

router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, serviceId, radiusKm, specialization } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: { message: 'Latitude and longitude are required' } });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radius = Number(radiusKm) || 10; // Default to 10km

    // Build the query
    let query: any = {
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    };

    // Filter by specialization if provided
    if (specialization) {
      query.specializations = specialization; // matches if the array contains this string
    }

    // Find mechanics and populate user info (name, phone, etc.)
    const mechanics = await Mechanic.find(query).populate('userId', 'name phone').limit(50);

    // Map to response format
    const formattedMechanics = mechanics.map((m: any) => {
      // Calculate distance using standard Haversine formula roughly (since $near doesn't return distance easily without aggregate)
      return {
        id: m._id,
        name: (m.userId as any).name,
        phone: (m.userId as any).phone,
        garageName: m.garageName,
        ratingAvg: m.ratingAvg,
        ratingCount: m.ratingCount,
        specializations: m.specializations,
        isOnline: m.isOnline,
        coordinates: m.location?.coordinates
      };
    });

    res.json({
      mechanics: formattedMechanics
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
