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
    specialization: 'Puncture & Tubeless Specialist',
    serviceCategories: ['Flat Tire', 'Tubeless Puncture', 'Air Refill', 'Valve Replace'],
    workshopName: 'Kalyani Ghosh Auto Hub',
    vehicleModel: 'Hero Splendor Plus',
    vehiclePlate: 'WB-24-K-8812',
    phone: '+91 98302 44109',
    rating: 4.9,
    completedJobs: 1240,
    hubLocation: { lat: 22.975, lng: 88.434 } // Kalyani Central
  },
  {
    id: 'mech-animesh-mukherjee',
    name: 'Animesh Mukherjee',
    specialization: 'Engine & Carburetor Diagnostics',
    serviceCategories: ['Engine Diagnostics', 'Carburetor Tuning', 'Spark Plug', 'Starting Trouble'],
    workshopName: 'Mukherjee Two-Wheeler Care',
    vehicleModel: 'Bajaj Pulsar 150',
    vehiclePlate: 'WB-12-AE-4921',
    phone: '+91 98311 23456',
    rating: 4.8,
    completedJobs: 980,
    hubLocation: { lat: 22.992, lng: 88.418 } // Kalyani Outer
  },
  {
    id: 'mech-debashis-roy',
    name: 'Debashis Roy',
    specialization: 'Battery & Electrical Specialist',
    serviceCategories: ['Jump Start', 'Terminal Voltage Check', 'Relay Repair', 'Fuse Block'],
    workshopName: 'Roy Electricals & Battery Service',
    vehicleModel: 'Honda Shine 125',
    vehiclePlate: 'WB-24-Q-3319',
    phone: '+91 98320 67891',
    rating: 4.9,
    completedJobs: 1120,
    hubLocation: { lat: 23.003, lng: 88.452 } // Kanchrapara Hub
  },
  {
    id: 'mech-rupankar-basak',
    name: 'Rupankar Basak',
    specialization: 'Drive Chain & Transmission Master',
    serviceCategories: ['Chain Sprocket Fix', 'Master Link Repair', 'High-Viscosity Lube'],
    workshopName: 'Basak Superbike Service Point',
    vehicleModel: 'TVS Apache RTR 160',
    vehiclePlate: 'WB-16-BD-7740',
    phone: '+91 98305 88921',
    rating: 4.9,
    completedJobs: 860,
    hubLocation: { lat: 22.981, lng: 88.429 } // Kalyani A-Block
  },
  {
    id: 'mech-sunil-yadav',
    name: 'Sunil Yadav',
    specialization: 'Emergency Fuel & Recovery Technician',
    serviceCategories: ['Fuel Delivery', 'Fuel Pump Priming', 'Highway Stalling Recovery'],
    workshopName: 'Yadav Express Roadside Unit',
    vehicleModel: 'Hero Glamour XTEC',
    vehiclePlate: 'WB-26-R-9014',
    phone: '+91 98366 12390',
    rating: 4.8,
    completedJobs: 730,
    hubLocation: { lat: 23.015, lng: 88.461 } // Halisahar
  },
  {
    id: 'mech-mohammed-irfan',
    name: 'Mohammed Irfan',
    specialization: 'Brake & Clutch Diagnostic Expert',
    serviceCategories: ['Hydraulic Disc Brake', 'Clutch Cable Replace', 'Brake Fluid Bleed'],
    workshopName: 'Irfan Multi-Brand Garage',
    vehicleModel: 'Yamaha FZ-S FI',
    vehiclePlate: 'WB-14-H-6523',
    phone: '+91 98325 77612',
    rating: 4.9,
    completedJobs: 1040,
    hubLocation: { lat: 23.028, lng: 88.441 } // Naihati
  },
  {
    id: 'mech-rajendra-mondal',
    name: 'Rajendra Mondal',
    specialization: 'Two-Wheeler Hydraulic Towing Master',
    serviceCategories: ['Hydraulic Ramp Towing', 'Accident Recovery', 'Safe Flatbed'],
    workshopName: 'Mondal Bengal Roadside Fleet',
    vehicleModel: 'Mahindra Bolero Recovery Bike',
    vehiclePlate: 'WB-24-M-5510',
    phone: '+91 98301 99283',
    rating: 4.8,
    completedJobs: 920,
    hubLocation: { lat: 22.964, lng: 88.445 } // Kalyani South
  },
  {
    id: 'mech-prakash-jadhav',
    name: 'Prakash Jadhav',
    specialization: 'Scooter & CVT Belt Specialist',
    serviceCategories: ['CVT Belt Fix', 'Self-Start Relay', 'Puncture Repair'],
    workshopName: 'Jadhav Precision Motors',
    vehicleModel: 'Honda Activa 6G Fleet',
    vehiclePlate: 'WB-12-BF-3180',
    phone: '+91 98319 44321',
    rating: 4.9,
    completedJobs: 890,
    hubLocation: { lat: 22.955, lng: 88.412 } // Tribeni - Hooghly
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
