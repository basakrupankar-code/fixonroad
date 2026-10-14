import { Mechanic } from '../models/Mechanic';
import { calculateHaversineDistanceKm, isValidCoordinate, Coordinates } from './distance';

export interface AssignMechanicOptions {
  location?: Coordinates | null;
  serviceType?: string;
  maxRadiusKm?: number;
}

/**
 * Finds and assigns an available mechanic distributed fairly among candidates.
 * 
 * Strategy:
 * 1. Queries available mechanics (`isAvailable: true`). Falls back to all mechanics if none available.
 * 2. If valid coordinates are provided:
 *    - Calculates distance to each mechanic.
 *    - Filters candidates within their service radius (or maxRadiusKm, default 50km).
 *    - If multiple candidates are nearby (e.g. within top 3 closest),
 *      it randomly picks one among them to evenly distribute dispatch load.
 * 3. If no coordinates or no mechanics within radius:
 *    - Randomly picks from all available mechanics.
 * 4. Returns the assigned mechanic object or null if no mechanics exist.
 */
export async function assignRandomAvailableMechanic(
  options: AssignMechanicOptions = {}
): Promise<any | null> {
  const { location, maxRadiusKm = 50 } = options;

  // 1. Fetch available mechanics first
  let candidates = await Mechanic.find({ isAvailable: true }).lean();
  if (candidates.length === 0) {
    // Fallback: If all are marked unavailable, consider all mechanics
    candidates = await Mechanic.find({}).lean();
  }

  if (candidates.length === 0) {
    return null;
  }

  // 2. Location-based candidate filtering
  if (location && isValidCoordinate(location.lat, location.lng)) {
    const withDistance = candidates
      .map((mech: any) => {
        const mLat = mech.currentLocation?.lat;
        const mLng = mech.currentLocation?.lng;
        const dist = isValidCoordinate(mLat, mLng)
          ? calculateHaversineDistanceKm(location, { lat: mLat, lng: mLng })
          : null;
        return { mech, dist };
      })
      .filter(({ mech, dist }) => {
        if (dist === null) return false;
        const radius = mech.serviceRadius || maxRadiusKm;
        return dist <= Math.max(radius, maxRadiusKm);
      })
      .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999));

    if (withDistance.length > 0) {
      // Pick randomly among closest candidates to distribute load fairly across mechanics
      const poolSize = Math.min(withDistance.length, Math.max(3, Math.min(withDistance.length, 5)));
      const chosenIndex = Math.floor(Math.random() * poolSize);
      return withDistance[chosenIndex].mech;
    }
  }

  // 3. Fallback: pick randomly from the available candidate pool
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}
