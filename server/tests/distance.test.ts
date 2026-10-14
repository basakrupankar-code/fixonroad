import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceKm, isValidCoordinate, formatDistance } from '../src/utils/distance';

describe('Distance Utility & Haversine Formula', () => {
  it('validates coordinate boundaries correctly', () => {
    expect(isValidCoordinate(22.5726, 88.3639)).toBe(true); // Kolkata
    expect(isValidCoordinate(28.6139, 77.2090)).toBe(true); // New Delhi
    expect(isValidCoordinate(0, 0)).toBe(false); // Null island uninitialized
    expect(isValidCoordinate(95, 88)).toBe(false); // Out of bounds lat
    expect(isValidCoordinate(22, 195)).toBe(false); // Out of bounds lng
    expect(isValidCoordinate(null, undefined)).toBe(false);
    expect(isValidCoordinate(NaN, 88)).toBe(false);
  });

  it('calculates accurate distance between known Indian landmarks', () => {
    // Connaught Place, New Delhi (28.6315, 77.2167) to India Gate (28.6129, 77.2295) ~ 2.4 km
    const dist = calculateHaversineDistanceKm(
      { lat: 28.6315, lng: 77.2167 },
      { lat: 28.6129, lng: 77.2295 }
    );
    expect(dist).toBeGreaterThan(2.0);
    expect(dist).toBeLessThan(2.8);
  });

  it('returns null gracefully on missing or invalid coordinates', () => {
    expect(calculateHaversineDistanceKm(null, { lat: 28.6, lng: 77.2 })).toBeNull();
    expect(calculateHaversineDistanceKm({ lat: 0, lng: 0 }, { lat: 28.6, lng: 77.2 })).toBeNull();
    expect(calculateHaversineDistanceKm({ lat: 28.6, lng: 77.2 }, { lat: 999, lng: 77.2 })).toBeNull();
  });

  it('formats distance strings properly', () => {
    expect(formatDistance(4.2)).toBe('4.2 km');
    expect(formatDistance(0.05)).toBe('< 100 m');
    expect(formatDistance(null)).toBe('Nearby');
    expect(formatDistance(NaN)).toBe('Nearby');
  });
});
