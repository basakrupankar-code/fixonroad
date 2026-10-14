export interface LatLng {
  lat: number;
  lng: number;
}

export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return false;
  }
  const nLat = Number(lat);
  const nLng = Number(lng);

  if (isNaN(nLat) || isNaN(nLng)) {
    return false;
  }
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
    return false;
  }
  if (Math.abs(nLat) < 0.0001 && Math.abs(nLng) < 0.0001) {
    return false; // Null island default uninitialized
  }
  return true;
}

export function calculateHaversineDistanceKm(
  coord1?: LatLng | null,
  coord2?: LatLng | null
): number | null {
  if (!coord1 || !coord2) return null;
  if (!isValidCoordinate(coord1.lat, coord1.lng) || !isValidCoordinate(coord2.lat, coord2.lng)) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const clampedA = Math.min(Math.max(a, 0), 1);
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm) || distanceKm < 0) {
    return 'Nearby';
  }
  if (distanceKm < 0.1) {
    return '< 100 m';
  }
  return `${distanceKm.toFixed(1)} km`;
}
