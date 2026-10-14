export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Validates whether the given latitude and longitude represent a realistic geographic point.
 * Excludes Null Island (0,0) which indicates uninitialized MongoDB default coordinates.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return false;
  }
  const nLat = Number(lat);
  const nLng = Number(lng);

  if (isNaN(nLat) || isNaN(nLng)) {
    return false;
  }

  // Latitudes must be between -90 and 90, longitudes between -180 and 180
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
    return false;
  }

  // Treat (0,0) as uninitialized/unset default location in roadside assistance context
  if (Math.abs(nLat) < 0.0001 && Math.abs(nLng) < 0.0001) {
    return false;
  }

  return true;
}

/**
 * Computes great-circle distance between two geographic coordinates using the Haversine formula.
 * Returns distance in kilometers rounded to 1 decimal place, or null if coordinates are invalid.
 */
export function calculateHaversineDistanceKm(
  coord1?: Coordinates | null,
  coord2?: Coordinates | null
): number | null {
  if (!coord1 || !coord2) {
    return null;
  }

  if (!isValidCoordinate(coord1.lat, coord1.lng) || !isValidCoordinate(coord2.lat, coord2.lng)) {
    return null;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  // Clamp 'a' to [0, 1] to prevent floating point inaccuracies causing Math.sqrt(negative)
  const clampedA = Math.min(Math.max(a, 0), 1);
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Formats distance in km into a user-friendly string (e.g., '4.2 km', '< 100 m', 'Nearby')
 */
export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null || isNaN(distanceKm) || distanceKm < 0) {
    return 'Nearby';
  }
  if (distanceKm < 0.1) {
    return '< 100 m';
  }
  return `${distanceKm.toFixed(1)} km`;
}
