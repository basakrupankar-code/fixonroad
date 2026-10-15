import { Coordinates, isValidCoordinate, calculateHaversineDistanceKm } from './distance';

export interface SynchronizedLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
}

export interface CanonicalBengalLocality {
  key: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  radiusKm: number;
  keywords: string[];
}

export const CANONICAL_BENGAL_LOCALITIES: CanonicalBengalLocality[] = [
  {
    key: 'samudragar',
    city: 'Samudragar',
    address: 'Station Bazaar Road, Kalna - Samudragar Ferry Ghat Road, Samudragar, Purba Bardhaman 713519',
    lat: 23.3610,
    lng: 88.3180,
    radiusKm: 12,
    keywords: ['samudragar', 'kalna', 'ferry ghat', 'purba bardhaman', 'bardhaman', 'nabadwip']
  },
  {
    key: 'kalyani',
    city: 'Kalyani',
    address: 'Block B, Central Park Road, Kalyani, Nadia 741235',
    lat: 22.9772,
    lng: 88.4312,
    radiusKm: 10,
    keywords: ['kalyani', 'central park', 'aiims kalyani', 'kalyani university', 'simanta expressway', 'a-block', 'b-block']
  },
  {
    key: 'kanchrapara',
    city: 'Kanchrapara',
    address: 'Railway Colony Road, Kanchrapara, North 24 Parganas 743145',
    lat: 22.9460,
    lng: 88.4330,
    radiusKm: 8,
    keywords: ['kanchrapara', 'workshop gate', 'bag more', 'kalyani border']
  },
  {
    key: 'chakdaha',
    city: 'Chakdaha',
    address: 'Lalpur Road, Near Chakdaha Station, Nadia 741222',
    lat: 23.0800,
    lng: 88.5200,
    radiusKm: 10,
    keywords: ['chakdaha', 'lalpur', 'nh-12 bypass']
  },
  {
    key: 'ranaghat',
    city: 'Ranaghat',
    address: 'Court Road, Ranaghat Sub-Division, Nadia 741201',
    lat: 23.1810,
    lng: 88.5800,
    radiusKm: 10,
    keywords: ['ranaghat', 'court road', 'happy club', 'gournibas']
  },
  {
    key: 'shantipur',
    city: 'Shantipur',
    address: 'College Road, Shantipur Municipality, Nadia 741404',
    lat: 23.2500,
    lng: 88.4300,
    radiusKm: 10,
    keywords: ['shantipur', 'sutragarh', 'college road']
  },
  {
    key: 'naihati',
    city: 'Naihati',
    address: 'Anandabazar Link Road, Naihati, North 24 Parganas 743165',
    lat: 22.8980,
    lng: 88.4230,
    radiusKm: 8,
    keywords: ['naihati', 'anandabazar', 'bhatpara']
  },
  {
    key: 'barrackpore',
    city: 'Barrackpore',
    address: 'SN Banerjee Road, Cantonment Area, Barrackpore 700120',
    lat: 22.7670,
    lng: 88.3750,
    radiusKm: 10,
    keywords: ['barrackpore', 'cantonment', 'wireless more', 'titagarh']
  },
  {
    key: 'chinsurah',
    city: 'Chinsurah',
    address: 'Pipulpati More, Grand Trunk Road, Hooghly 712101',
    lat: 22.9030,
    lng: 88.3970,
    radiusKm: 10,
    keywords: ['chinsurah', 'hooghly', 'bandel', 'pipulpati']
  },
  {
    key: 'krishnanagar',
    city: 'Krishnanagar',
    address: 'Nediarpara Main Road, Krishnanagar, Nadia 741101',
    lat: 23.4000,
    lng: 88.5000,
    radiusKm: 12,
    keywords: ['krishnanagar', 'nediarpara', 'ghurni']
  }
];

/**
 * Ensures strict synchronization between geographic coordinates and human-readable address.
 * 
 * Rules:
 * 1. If address mentions Samudragar/Kalna, genuine Samudragar coordinates (~23.3610, 88.3180) are locked.
 *    (Prevents the bug where Samudragar address was stored with Kalyani coordinates ~22.9770, 88.4310 yielding 0.5 km route).
 * 2. If coordinates come from live browser geolocation in Kalyani (~22.977, 88.431), the address is synchronized
 *    to Kalyani, Nadia, preventing accidental fallback to a dummy "Samudragar" string.
 * 3. If coordinates are invalid or 0,0, resolves coordinates based on address keywords.
 * 4. Ensures customer coordinates and address always stem from the exact same source locality.
 */
export function synchronizeLocation(input?: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
} | null): SynchronizedLocation {
  const rawAddress = (input?.address || '').trim();
  const addressLower = rawAddress.toLowerCase();
  const hasCoords = typeof input?.lat === 'number' && typeof input?.lng === 'number' && 
    isValidCoordinate(input.lat, input.lng) && 
    (input.lat !== 0 || input.lng !== 0);

  // 1. Check if the address explicitly identifies Samudragar / Kalna
  const isSamudragarAddress = ['samudragar', 'kalna', 'ferry ghat'].some(k => addressLower.includes(k));
  if (isSamudragarAddress) {
    const samudragar = CANONICAL_BENGAL_LOCALITIES[0];
    // Check if provided coords are genuinely in Samudragar (~23.2 to 23.4)
    if (hasCoords && input!.lat! >= 23.2 && input!.lat! <= 23.5 && input!.lng! >= 88.2 && input!.lng! <= 88.4) {
      return {
        lat: input!.lat!,
        lng: input!.lng!,
        address: rawAddress || samudragar.address,
        city: 'Samudragar, Purba Bardhaman'
      };
    }
    // Desynchronized (e.g. Samudragar address with Kalyani coordinates [22.977, 88.431]) -> lock to genuine Samudragar
    return {
      lat: samudragar.lat,
      lng: samudragar.lng,
      address: rawAddress || samudragar.address,
      city: 'Samudragar, Purba Bardhaman'
    };
  }

  // 2. If coordinates are provided, check if they are in Kalyani area (~22.94 - 23.01, 88.39 - 88.47)
  if (hasCoords) {
    const lat = input!.lat!;
    const lng = input!.lng!;

    // Check proximity to canonical localities
    let matchedLocality: CanonicalBengalLocality | null = null;
    let minDistance = Infinity;

    for (const loc of CANONICAL_BENGAL_LOCALITIES) {
      const dist = calculateHaversineDistanceKm({ lat, lng }, { lat: loc.lat, lng: loc.lng });
      if (dist !== null && dist <= loc.radiusKm && dist < minDistance) {
        minDistance = dist;
        matchedLocality = loc;
      }
    }

    if (matchedLocality) {
      // If address is generic, empty, or wrongly mentions Samudragar while coordinates are in Kalyani
      const needsAddressCorrection = 
        !rawAddress || 
        rawAddress === 'Detecting location...' || 
        rawAddress === 'Current Location' ||
        (matchedLocality.key !== 'samudragar' && addressLower.includes('samudragar'));

      return {
        lat,
        lng,
        address: needsAddressCorrection ? matchedLocality.address : rawAddress,
        city: matchedLocality.city
      };
    }

    // Coordinates are elsewhere in Bengal/India
    return {
      lat,
      lng,
      address: rawAddress || `Breakdown Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      city: 'West Bengal'
    };
  }

  // 3. No valid coordinates provided: match address string against canonical localities
  if (rawAddress) {
    for (const loc of CANONICAL_BENGAL_LOCALITIES) {
      if (loc.keywords.some(keyword => addressLower.includes(keyword))) {
        return {
          lat: loc.lat,
          lng: loc.lng,
          address: rawAddress,
          city: loc.city
        };
      }
    }
  }

  // 4. Ultimate fallback: default to Kalyani Central Hub with synchronized Kalyani address
  const kalyani = CANONICAL_BENGAL_LOCALITIES[1];
  return {
    lat: kalyani.lat,
    lng: kalyani.lng,
    address: kalyani.address,
    city: kalyani.city
  };
}
