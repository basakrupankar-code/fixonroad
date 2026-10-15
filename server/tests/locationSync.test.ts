import { describe, it, expect } from 'vitest';
import { synchronizeLocation, CANONICAL_BENGAL_LOCALITIES } from '../src/utils/locationSync';
import { calculateHaversineDistanceKm } from '../src/utils/distance';

describe('Location & Coordinate Synchronization Engine', () => {
  const KALYANI_HUB = { lat: 22.9750, lng: 88.4340 }; // Kalyani Central Auto Hub

  it('locks genuine Samudragar coordinates when Samudragar address is provided with desynchronized Kalyani coords', () => {
    // Defect scenario: Address says Samudragar, but coordinates are inside Kalyani [22.9770, 88.4310]
    const desyncedInput = {
      address: 'Kalna - Samudragar Ferry Ghat Road, Samudragar, West Bengal',
      lat: 22.9770,
      lng: 88.4310
    };

    const synced = synchronizeLocation(desyncedInput);

    // Coordinates must be locked to genuine Samudragar coordinates (~23.3610, 88.3180)
    expect(synced.lat).toBeCloseTo(23.3610, 2);
    expect(synced.lng).toBeCloseTo(88.3180, 2);
    expect(synced.address).toContain('Samudragar');

    // Distance from Kalyani Hub to genuine Samudragar must be realistic (~45 km, not 0.5 km)
    const roadDist = calculateHaversineDistanceKm(KALYANI_HUB, { lat: synced.lat, lng: synced.lng });
    expect(roadDist).toBeGreaterThan(40);
    expect(roadDist).toBeLessThan(55);
  });

  it('preserves genuine Kalyani address and coordinates from live browser geolocation', () => {
    // Scenario: User is in Kalyani via navigator.geolocation [22.9772, 88.4312]
    const kalyaniBrowserInput = {
      address: 'Detecting location...',
      lat: 22.9772,
      lng: 88.4312
    };

    const synced = synchronizeLocation(kalyaniBrowserInput);

    expect(synced.lat).toBeCloseTo(22.9772, 3);
    expect(synced.lng).toBeCloseTo(88.4312, 3);
    expect(synced.address).toContain('Kalyani');
    expect(synced.address).not.toContain('Samudragar');

    // Distance from Kalyani Hub to Kalyani spot must be ~0.5 km
    const dist = calculateHaversineDistanceKm(KALYANI_HUB, { lat: synced.lat, lng: synced.lng });
    expect(dist).toBeLessThan(1.0);
  });

  it('reflects actual Kalyani locality from live browser coordinates and does not fall back to Samudragar', () => {
    const liveBrowserCoords = {
      address: '',
      lat: 22.9772,
      lng: 88.4312
    };

    const synced = synchronizeLocation(liveBrowserCoords);
    expect(synced.lat).toBeCloseTo(22.9772, 3);
    expect(synced.lng).toBeCloseTo(88.4312, 3);
    expect(synced.address).toContain('Kalyani');
    expect(synced.address).not.toContain('Samudragar');
  });

  it('resolves coordinates from address string when coordinates are 0, 0 or missing', () => {
    const zeroCoordsInput = {
      address: 'Kalna - Samudragar Ferry Ghat Road, Samudragar, West Bengal',
      lat: 0,
      lng: 0
    };

    const synced = synchronizeLocation(zeroCoordsInput);
    expect(synced.lat).toBeCloseTo(23.3610, 2);
    expect(synced.lng).toBeCloseTo(88.3180, 2);
  });
});
