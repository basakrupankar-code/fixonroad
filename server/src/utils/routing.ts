import { Coordinates, isValidCoordinate, calculateHaversineDistanceKm } from './distance';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [latitude, longitude] tuples for Leaflet Polyline
  source: 'osrm' | 'fallback';
}

/**
 * Computes actual road driving distance and realistic two-wheeler ETA using OSRM,
 * returning full road polyline coordinates in [lat, lng] format for Leaflet.
 */
export async function getRoadRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult> {
  if (!isValidCoordinate(origin.lat, origin.lng) || !isValidCoordinate(destination.lat, destination.lng)) {
    return {
      distanceKm: 5,
      durationMinutes: 15,
      coordinates: [
        [origin.lat || 22.9772, origin.lng || 88.4312],
        [destination.lat || 23.3644, destination.lng || 88.3182]
      ],
      source: 'fallback'
    };
  }

  // OSRM expects coordinates in {longitude},{latitude} format
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FixOnRoad-DispatchEngine/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        const rawDistanceMeters = route.distance || 0;
        const distanceKm = Math.round((rawDistanceMeters / 1000) * 10) / 10;

        // Realistic two-wheeler urban/suburban average speed: ~28 km/h + 3 min dispatch prep
        const twoWheelerMinutes = Math.max(5, Math.round((distanceKm / 28) * 60) + 3);

        // Convert OSRM [longitude, latitude] to Leaflet [latitude, longitude]
        const rawCoords: [number, number][] = route.geometry?.coordinates || [];
        const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

        return {
          distanceKm,
          durationMinutes: twoWheelerMinutes,
          coordinates: leafletCoords.length > 0 ? leafletCoords : [[origin.lat, origin.lng], [destination.lat, destination.lng]],
          source: 'osrm'
        };
      }
    }
  } catch (error) {
    console.warn('OSRM routing request failed or timed out, using enhanced road fallback:', error);
  }

  // Enhanced Road Fallback with 1.28x road tortuosity factor & realistic bike speed
  const straightLineKm = calculateHaversineDistanceKm(origin, destination) || 5;
  const estimatedRoadKm = Math.round(straightLineKm * 1.28 * 10) / 10;
  const estimatedDuration = Math.max(5, Math.round((estimatedRoadKm / 28) * 60) + 3);

  // Generate a multi-point curved path between origin and destination to mimic road travel
  const midLat = (origin.lat + destination.lat) / 2 + (destination.lng - origin.lng) * 0.08;
  const midLng = (origin.lng + destination.lng) / 2 - (destination.lat - origin.lat) * 0.08;

  const fallbackPolyline: [number, number][] = [
    [origin.lat, origin.lng],
    [(origin.lat + midLat) / 2, (origin.lng + midLng) / 2],
    [midLat, midLng],
    [(midLat + destination.lat) / 2, (midLng + destination.lng) / 2],
    [destination.lat, destination.lng]
  ];

  return {
    distanceKm: estimatedRoadKm,
    durationMinutes: estimatedDuration,
    coordinates: fallbackPolyline,
    source: 'fallback'
  };
}
