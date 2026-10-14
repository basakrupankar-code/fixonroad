import { Router } from 'express';
import { Mechanic } from '../models/Mechanic';

const router = Router();

router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radiusKm, specialization } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: { message: 'Latitude and longitude are required' } });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radius = Math.min(Math.max(Number(radiusKm) || 10, 1), 50); // Clamp 1km - 50km

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: { message: 'Invalid coordinates' } });
    }

    let filter: any = {
      isAvailable: true
    };

    if (typeof specialization === 'string' && specialization.trim().length > 0) {
      filter.specialization = specialization.trim();
    }

    const mechanics = await Mechanic.find(filter).limit(50);

    // Filter mechanics within radius using Haversine formula
    const degToRad = (deg: number) => deg * (Math.PI / 180);
    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in km
      const dLat = degToRad(lat2 - lat1);
      const dLon = degToRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const formattedMechanics = mechanics
      .map((m: any) => {
        const mechLat = m.currentLocation?.lat || 0;
        const mechLng = m.currentLocation?.lng || 0;
        const dist = getDistanceKm(latitude, longitude, mechLat, mechLng);
        return {
          id: m._id,
          name: m.name,
          phone: m.phone,
          workshopName: m.workshopName,
          rating: m.rating,
          specialization: m.specialization,
          serviceCategories: m.serviceCategories,
          isAvailable: m.isAvailable,
          currentLocation: m.currentLocation,
          distanceKm: +dist.toFixed(2)
        };
      })
      .filter((m: any) => m.distanceKm <= radius)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

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
