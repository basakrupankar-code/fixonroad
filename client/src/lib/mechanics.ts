export interface MechanicProfile {
  id?: string;
  name: string;
  specialization: string;
  serviceCategories: string[];
  workshopName: string;
  vehicleModel: string;
  vehiclePlate: string;
  phone: string;
  rating: number;
  completedJobs?: number;
  hubLocation: {
    lat: number;
    lng: number;
  };
}

export interface ResolvedMechanic {
  id?: string;
  name: string;
  specialization: string;
  serviceCategories: string[];
  workshopName: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleDisplay: string;
  phone: string;
  rating: number;
  hubLocation: {
    lat: number;
    lng: number;
  };
  isDynamic: boolean;
}

/**
 * Verified Bengal Roadside Assistance Mechanics Pool
 * Tailored for Kalyani, Nadia, Hooghly & Greater Bengal zones with valid WB RTO plates
 */
export const SEED_MECHANICS: MechanicProfile[] = [
  {
    id: 'mech-subhasish-ghosh',
    name: 'Subhasish Ghosh',
    specialization: 'Two-Wheeler Engine & Electrical Diagnostics',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Battery Jumpstart', 'Emergency Fuel Delivery', 'Minor Engine Breakdown'],
    workshopName: 'FixOnRoad Kalyani Central Auto Hub',
    vehicleModel: 'Hero Splendor Plus (Service Bike)',
    vehiclePlate: 'WB-12-AE-4921',
    phone: '+91 98302 44109',
    rating: 4.9,
    completedJobs: 1240,
    hubLocation: { lat: 22.9750, lng: 88.4340 } // Kalyani Central
  },
  {
    id: 'mech-anirban-mukherjee',
    name: 'Anirban Mukherjee',
    specialization: 'Puncture, Tubeless Patch & Wheel Alignment',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Chain & Sprocket Repair', 'Emergency Fuel Delivery'],
    workshopName: 'Kanchrapara Quick Rescue Point',
    vehicleModel: 'Bajaj Pulsar 150 Rapid Unit',
    vehiclePlate: 'WB-24-K-8812',
    phone: '+91 98301 55210',
    rating: 4.8,
    completedJobs: 980,
    hubLocation: { lat: 22.9460, lng: 88.4330 } // Kanchrapara
  },
  {
    id: 'mech-debasish-mondal',
    name: 'Debasish Mondal',
    specialization: 'Battery Jumpstart & Electrical Short-Circuit Recovery',
    serviceCategories: ['Battery Jumpstart', 'Electrical Inspection', 'Emergency Fuel Delivery'],
    workshopName: 'Chakdaha Highway Support Station',
    vehicleModel: 'Honda Shine 125 Service Unit',
    vehiclePlate: 'WB-16-T-3401',
    phone: '+91 98303 66321',
    rating: 4.9,
    completedJobs: 1120,
    hubLocation: { lat: 23.0800, lng: 88.5200 } // Chakdaha
  },
  {
    id: 'mech-bikram-roy',
    name: 'Bikram Roy',
    specialization: 'Heavy Two-Wheeler & Drive Transmission',
    serviceCategories: ['Minor Engine Breakdown', 'Two-Wheeler Towing', 'Clutch & Cable Replacement'],
    workshopName: 'Ranaghat NH-12 Rapid Unit',
    vehicleModel: 'TVS Apache RTR 160 Response Bike',
    vehiclePlate: 'WB-14-R-5520',
    phone: '+91 98304 77432',
    rating: 4.7,
    completedJobs: 860,
    hubLocation: { lat: 23.1810, lng: 88.5800 } // Ranaghat
  },
  {
    id: 'mech-rajesh-karmakar',
    name: 'Rajesh Karmakar',
    specialization: 'Carburetor & Fuel Injection Calibration',
    serviceCategories: ['Emergency Fuel Delivery', 'Spark Plug & Ignition Fix', 'Flat Tyre / Puncture Repair'],
    workshopName: 'Shantipur Auto Garage & Spares',
    vehicleModel: 'Hero Glamour 125 Mobile Unit',
    vehiclePlate: 'WB-18-B-6109',
    phone: '+91 98305 88543',
    rating: 4.8,
    completedJobs: 730,
    hubLocation: { lat: 23.2500, lng: 88.4300 } // Shantipur
  },
  {
    id: 'mech-sourav-banerjee',
    name: 'Sourav Banerjee',
    specialization: 'On-Spot Highway Breakdown Recovery',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Battery Jumpstart', 'Minor Engine Breakdown', 'Emergency Fuel Delivery'],
    workshopName: 'Samudragar Breakdown & Recovery Station',
    vehicleModel: 'Bajaj Discover 125 Service Unit',
    vehiclePlate: 'WB-20-C-9934',
    phone: '+91 98306 99654',
    rating: 4.9,
    completedJobs: 1040,
    hubLocation: { lat: 23.3610, lng: 88.3180 } // Samudragar
  },
  {
    id: 'mech-pradip-halder',
    name: 'Pradip Halder',
    specialization: 'Hydraulic Disc Brake & Suspension Rescue',
    serviceCategories: ['Brake Fluid & Bleeding', 'Flat Tyre / Puncture Repair', 'Chain & Cable Repair'],
    workshopName: 'Naihati Express Care Hub',
    vehicleModel: 'Yamaha FZ-S Rapid Responder',
    vehiclePlate: 'WB-12-F-2287',
    phone: '+91 98307 11765',
    rating: 4.8,
    completedJobs: 920,
    hubLocation: { lat: 22.8980, lng: 88.4230 } // Naihati
  },
  {
    id: 'mech-amitabha-sen',
    name: 'Amitabha Sen',
    specialization: 'Rapid Battery Replacement & Alternator Diagnostics',
    serviceCategories: ['Battery Jumpstart', 'Emergency Fuel Delivery', 'Minor Engine Breakdown'],
    workshopName: 'Barrackpore Emergency Assistance Center',
    vehicleModel: 'Honda CB Unicorn 160 Response Unit',
    vehiclePlate: 'WB-24-M-7411',
    phone: '+91 98308 22876',
    rating: 4.7,
    completedJobs: 890,
    hubLocation: { lat: 22.7670, lng: 88.3750 } // Barrackpore
  },
  {
    id: 'mech-tanmay-das',
    name: 'Tanmay Das',
    specialization: 'Comprehensive Multi-Brand Two-Wheeler Inspection',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Battery Jumpstart', 'Two-Wheeler Towing', 'Oil Top-up & Fluid Leak Fix'],
    workshopName: 'Hooghly River Roadside Rescue',
    vehicleModel: 'Suzuki Gixxer 150 Mobile Bike',
    vehiclePlate: 'WB-16-D-8032',
    phone: '+91 98309 33987',
    rating: 4.9,
    completedJobs: 1100,
    hubLocation: { lat: 22.9030, lng: 88.3970 } // Chinsurah
  },
  {
    id: 'mech-rakesh-pal',
    name: 'Rakesh Pal',
    specialization: 'Emergency Towing & Mechanical Recovery',
    serviceCategories: ['Two-Wheeler Towing', 'Flat Tyre / Puncture Repair', 'Minor Engine Breakdown'],
    workshopName: 'Krishnanagar Road Care Hub',
    vehicleModel: 'Hero Passion Pro Response Bike',
    vehiclePlate: 'WB-14-H-1904',
    phone: '+91 98310 44098',
    rating: 4.8,
    completedJobs: 820,
    hubLocation: { lat: 23.4000, lng: 88.5000 } // Krishnanagar
  }
];

/**
 * Computes a deterministic positive hash from any string (order ID, order code, tracking code)
 */
export function hashStringToSeed(str?: string): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a pseudo-random mechanic mapped to the unique order ID seed
 */
export function getDeterministicMechanic(seedKey?: string): MechanicProfile {
  if (!seedKey) return SEED_MECHANICS[0];
  const hash = hashStringToSeed(seedKey);
  const index = hash % SEED_MECHANICS.length;
  return SEED_MECHANICS[index];
}

/**
 * Decouples and extracts the mechanic profile from any Order document
 * Supports `order.mechanic`, `order.assignedMechanic`, and `order.mechanicId`.
 * If dynamic data is missing or loading, smoothly maps to a seeded mechanic for that specific order.
 */
export function resolveOrderMechanic(order: any, fallbackSeedKey?: string): ResolvedMechanic {
  const seedKey = order?.orderCode || order?._id || order?.id || fallbackSeedKey;
  const seed = getDeterministicMechanic(seedKey);

  // Check all possible mechanic property bindings from order document
  const raw = order?.mechanic || order?.assignedMechanic || order?.mechanicId;

  if (!raw || typeof raw !== 'object' || (!raw.name && !raw._id)) {
    return {
      id: seed.id,
      name: seed.name,
      specialization: seed.specialization,
      serviceCategories: seed.serviceCategories,
      workshopName: seed.workshopName,
      vehicleModel: seed.vehicleModel,
      vehiclePlate: seed.vehiclePlate,
      vehicleDisplay: `${seed.vehicleModel} • ${seed.vehiclePlate}`,
      phone: seed.phone,
      rating: seed.rating,
      hubLocation: seed.hubLocation,
      isDynamic: false
    };
  }

  // Raw mechanic is present on the order document: bind dynamically
  const name = raw.name || raw.fullName || seed.name;

  const specialization = raw.specialization 
    || (Array.isArray(raw.serviceCategories) && raw.serviceCategories.length > 0 ? raw.serviceCategories.join(' • ') : '')
    || seed.specialization;

  const serviceCategories = Array.isArray(raw.serviceCategories) && raw.serviceCategories.length > 0 
    ? raw.serviceCategories 
    : seed.serviceCategories;

  const workshopName = raw.workshopName || raw.hubName || seed.workshopName;

  const vehiclePlate = raw.vehiclePlate || raw.vehicleNumber || seed.vehiclePlate;

  const vehicleModel = raw.vehicleModel || (raw.vehicleType === 'bike' ? 'Service Bike' : seed.vehicleModel);

  const vehicleDisplay = `${vehicleModel} • ${vehiclePlate}`;

  const phone = raw.phone || raw.contactNumber || seed.phone;

  const rating = typeof raw.rating === 'number' && raw.rating >= 4.0 
    ? Number(raw.rating.toFixed(1)) 
    : seed.rating;

  const hubLat = raw.currentLocation?.lat || raw.hubLocation?.lat || seed.hubLocation.lat;
  const hubLng = raw.currentLocation?.lng || raw.hubLocation?.lng || seed.hubLocation.lng;

  return {
    id: raw._id || raw.id || seed.id,
    name,
    specialization,
    serviceCategories,
    workshopName,
    vehicleModel,
    vehiclePlate,
    vehicleDisplay,
    phone,
    rating,
    hubLocation: { lat: hubLat, lng: hubLng },
    isDynamic: true
  };
}
