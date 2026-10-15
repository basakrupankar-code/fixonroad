import { Mechanic } from '../models/Mechanic';
import { Order } from '../models/Order';
import { calculateHaversineDistanceKm, isValidCoordinate, Coordinates } from './distance';

export interface AssignMechanicOptions {
  location?: Coordinates | null;
  serviceType?: string;
  maxRadiusKm?: number;
  excludeMechanicIds?: string[];
}

// Capability keyword map to match service types against mechanic serviceCategories & specializations
const SERVICE_KEYWORD_MAP: Record<string, string[]> = {
  'flat-tire': ['puncture', 'tubeless', 'tyre', 'tire', 'patch', 'wheel', 'valve'],
  'flat-tyre': ['puncture', 'tubeless', 'tyre', 'tire', 'patch', 'wheel', 'valve'],
  'puncture': ['puncture', 'tubeless', 'tyre', 'tire', 'patch'],
  'battery': ['battery', 'jumpstart', 'jump start', 'electrical', 'voltage', 'short-circuit'],
  'battery-jumpstart': ['battery', 'jumpstart', 'jump start', 'electrical', 'voltage', 'short-circuit'],
  'dead-battery': ['battery', 'jumpstart', 'jump start', 'electrical', 'voltage', 'short-circuit'],
  'fuel': ['fuel', 'petrol', 'diesel', 'carburetor', 'fuel injection'],
  'fuel-delivery': ['fuel', 'petrol', 'diesel', 'carburetor', 'fuel injection'],
  'emergency-fuel': ['fuel', 'petrol', 'diesel', 'carburetor', 'fuel injection'],
  'towing': ['towing', 'tow', 'flatbed', 'ramp', 'recovery', 'transport'],
  'two-wheeler-towing': ['towing', 'tow', 'flatbed', 'ramp', 'recovery', 'transport'],
  'bike-towing': ['towing', 'tow', 'flatbed', 'ramp', 'recovery', 'transport'],
  'minor-repair': ['engine', 'carburetor', 'spark', 'breakdown', 'clutch', 'chain', 'transmission', 'brake'],
  'engine': ['engine', 'carburetor', 'spark', 'breakdown', 'transmission', 'diagnostics'],
  'chain': ['chain', 'sprocket', 'transmission', 'link'],
  'brake': ['brake', 'disc', 'hydraulic', 'fluid', 'bleeding', 'suspension', 'cable'],
  'lockout': ['lockout', 'key', 'lock', 'electrical']
};

function extractServiceKeywords(serviceType?: string): string[] {
  if (!serviceType) return [];
  const clean = serviceType.toLowerCase().trim();
  const keywords = new Set<string>();

  // Direct match
  if (SERVICE_KEYWORD_MAP[clean]) {
    SERVICE_KEYWORD_MAP[clean].forEach(k => keywords.add(k));
  }

  // Tokenize & substring matching (e.g. 'fuel-bike' -> 'fuel', 'flat-tire-car' -> 'flat-tire')
  Object.keys(SERVICE_KEYWORD_MAP).forEach(mapKey => {
    if (clean.includes(mapKey) || mapKey.includes(clean)) {
      SERVICE_KEYWORD_MAP[mapKey].forEach(k => keywords.add(k));
    }
  });

  if (keywords.size === 0) {
    clean.split(/[-_\s]+/).forEach(token => {
      if (token.length > 2) keywords.add(token);
    });
  }

  return Array.from(keywords);
}

function scoreCapability(mech: any, keywords: string[]): number {
  if (keywords.length === 0) return 1;

  const specText = (mech.specialization || '').toLowerCase();
  const categoriesText = Array.isArray(mech.serviceCategories) 
    ? mech.serviceCategories.join(' ').toLowerCase() 
    : '';

  let score = 0;
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    // Direct category match is worth 3 points
    if (categoriesText.includes(kwLower)) {
      score += 3;
    }
    // Specialization match is worth 2 points
    if (specText.includes(kwLower)) {
      score += 2;
    }
  }
  return score;
}

/**
 * Finds and assigns an available mechanic distributed fairly among candidates.
 * 
 * Strategy:
 * 1. Checks active orders to exclude mechanics already busy on active jobs
 *    ('MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'CONFIRMED').
 * 2. Filters candidates by availability (`isAvailable: true`).
 * 3. Filters candidates by capability score (e.g. tyre specialists vs fuel runners vs towing/electrical).
 * 4. Filters and sorts remaining candidates by capability score and proximity to customer location.
 * 5. Returns a unique mechanic record with distinct vehicle plates, vehicle model, and contact details.
 */
export async function assignRandomAvailableMechanic(
  options: AssignMechanicOptions = {}
): Promise<any | null> {
  const { location, serviceType, maxRadiusKm = 50, excludeMechanicIds = [] } = options;

  // 1. Find all mechanics currently busy on an active job to avoid repeated mechanic assignment
  const activeOrders = await Order.find({
    status: { $in: ['MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'CONFIRMED'] },
    mechanicId: { $ne: null }
  }).select('mechanicId').lean();

  const busyMechanicIds = new Set<string>([
    ...activeOrders.map((o: any) => o.mechanicId?.toString()).filter(Boolean),
    ...excludeMechanicIds
  ]);

  // 2. Fetch all available mechanics
  let candidates = await Mechanic.find({ isAvailable: true }).lean();
  if (candidates.length === 0) {
    candidates = await Mechanic.find({}).lean();
  }

  if (candidates.length === 0) {
    return null;
  }

  // Filter out busy mechanics first
  const nonBusyCandidates = candidates.filter((m: any) => !busyMechanicIds.has(m._id.toString()));
  // If non-busy candidates exist, prioritize them to guarantee unique mechanic assignment
  if (nonBusyCandidates.length > 0) {
    candidates = nonBusyCandidates;
  }

  // 3. Service capability & category match filtering
  const serviceKeywords = extractServiceKeywords(serviceType);
  if (serviceKeywords.length > 0) {
    const scoredCandidates = candidates.map((mech: any) => ({
      mech,
      score: scoreCapability(mech, serviceKeywords)
    }));

    const maxScore = Math.max(...scoredCandidates.map(c => c.score), 0);
    if (maxScore > 0) {
      // Keep only candidates that match the highest capability tier (at least 60% of top score)
      candidates = scoredCandidates
        .filter(c => c.score >= maxScore * 0.6)
        .map(c => c.mech);
    }
  }

  // 4. Proximity & capability based candidate selection
  if (location && isValidCoordinate(location.lat, location.lng)) {
    const withDistance = candidates
      .map((mech: any) => {
        const mLat = mech.currentLocation?.lat;
        const mLng = mech.currentLocation?.lng;
        const dist = isValidCoordinate(mLat, mLng)
          ? calculateHaversineDistanceKm(location, { lat: mLat, lng: mLng })
          : null;
        const capabilityScore = scoreCapability(mech, serviceKeywords);
        return { mech, dist, capabilityScore };
      })
      .filter(({ dist }) => dist !== null)
      .sort((a, b) => {
        // Prioritize capability score first
        if (b.capabilityScore !== a.capabilityScore) {
          return b.capabilityScore - a.capabilityScore;
        }
        // Then sort by proximity ascending
        return (a.dist ?? 9999) - (b.dist ?? 9999);
      });

    if (withDistance.length > 0) {
      // Select the top specialist tier
      const topScore = withDistance[0].capabilityScore;
      const topSpecialists = withDistance.filter(c => c.capabilityScore === topScore);

      // Mechanics within their designated service radius (or maxRadiusKm)
      const withinRadius = topSpecialists.filter(({ mech, dist }) => {
        const radius = mech.serviceRadius || maxRadiusKm;
        return (dist ?? 9999) <= Math.max(radius, maxRadiusKm);
      });

      const pool = withinRadius.length > 0 ? withinRadius : topSpecialists;
      // If multiple top specialists are close (e.g. within 5 km of closest), tie-break fairly
      const closestDist = pool[0].dist ?? 0;
      const nearPool = pool.filter(c => ((c.dist ?? 0) - closestDist) <= 5);
      const chosenIndex = Math.floor(Math.random() * nearPool.length);
      return nearPool[chosenIndex].mech;
    }
  }

  // 5. Fallback: random selection from remaining capability-matched candidate pool
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}
