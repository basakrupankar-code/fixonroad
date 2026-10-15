/**
 * seed.ts — FixOnRoad MongoDB Atlas Realistic Seeding Script
 *
 * Populates realistic production-grade data for the FixOnRoad platform:
 *   • 10 Verified Mechanics across Bengal hubs (Kalyani, Nadia, Hooghly, North 24 Parganas)
 *   • 50 Real Customers across Bengal
 *   • 25 Orders with 16-character cryptographic tracking codes (FOR-XXXXXXXXXXXXXXXX)
 *
 * Usage: npm run seed  (or npx tsx src/db/seed.ts)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Mechanic } from '../models/Mechanic';
import { Order } from '../models/Order';
import { generateOrderCode } from '../utils/orderCode';
import { getRoadRoute } from '../utils/routing';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixonroad';
const DEFAULT_PASSWORD = bcrypt.hashSync('Test@1234', 10);

// ─── 10 Real Bengal Mechanics ──────────────────────────────────────────────────
const REAL_MECHANICS = [
  {
    name: 'Subhasish Ghosh',
    email: 'subhasish.ghosh@fixonroad.com',
    phone: '+91 98302 44109',
    workshopName: 'FixOnRoad Kalyani Central Auto Hub',
    vehiclePlate: 'WB-12-AE-4921',
    vehicleModel: 'Hero Splendor Plus (Service Bike)',
    specialization: 'Two-Wheeler Engine & Electrical Diagnostics',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Battery Jumpstart', 'Emergency Fuel Delivery', 'Minor Engine Breakdown'],
    serviceRadius: 35,
    rating: 4.9,
    upiId: 'subhasish.ghosh@okhdfcbank',
    currentLocation: { lat: 22.9750, lng: 88.4340 }, // Kalyani
    city: 'Kalyani, Nadia'
  },
  {
    name: 'Anirban Mukherjee',
    email: 'anirban.mukherjee@fixonroad.com',
    phone: '+91 98301 55210',
    workshopName: 'Kanchrapara Quick Rescue Point',
    vehiclePlate: 'WB-24-K-8812',
    vehicleModel: 'Bajaj Pulsar 150 Rapid Unit',
    specialization: 'Puncture, Tubeless Patch & Wheel Alignment',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Chain & Sprocket Repair', 'Emergency Fuel Delivery'],
    serviceRadius: 30,
    rating: 4.8,
    upiId: 'anirban.m@paytm',
    currentLocation: { lat: 22.9460, lng: 88.4330 }, // Kanchrapara
    city: 'Kanchrapara, North 24 Parganas'
  },
  {
    name: 'Debasish Mondal',
    email: 'debasish.mondal@fixonroad.com',
    phone: '+91 98303 66321',
    workshopName: 'Chakdaha Highway Support Station',
    vehiclePlate: 'WB-16-T-3401',
    vehicleModel: 'Honda Shine 125 Service Unit',
    specialization: 'Battery Jumpstart & Electrical Short-Circuit Recovery',
    serviceCategories: ['Battery Jumpstart', 'Electrical Inspection', 'Emergency Fuel Delivery'],
    serviceRadius: 35,
    rating: 4.9,
    upiId: 'debasish.mondal@upi',
    currentLocation: { lat: 23.0800, lng: 88.5200 }, // Chakdaha
    city: 'Chakdaha, Nadia'
  },
  {
    name: 'Bikram Roy',
    email: 'bikram.roy@fixonroad.com',
    phone: '+91 98304 77432',
    workshopName: 'Ranaghat NH-12 Rapid Unit',
    vehiclePlate: 'WB-14-R-5520',
    vehicleModel: 'TVS Apache RTR 160 Response Bike',
    specialization: 'Heavy Two-Wheeler & Drive Transmission',
    serviceCategories: ['Minor Engine Breakdown', 'Two-Wheeler Towing', 'Clutch & Cable Replacement'],
    serviceRadius: 40,
    rating: 4.7,
    upiId: 'bikram.roy@axisbank',
    currentLocation: { lat: 23.1810, lng: 88.5800 }, // Ranaghat
    city: 'Ranaghat, Nadia'
  },
  {
    name: 'Rajesh Karmakar',
    email: 'rajesh.karmakar@fixonroad.com',
    phone: '+91 98305 88543',
    workshopName: 'Shantipur Auto Garage & Spares',
    vehiclePlate: 'WB-18-B-6109',
    vehicleModel: 'Hero Glamour 125 Mobile Unit',
    specialization: 'Carburetor & Fuel Injection Calibration',
    serviceCategories: ['Emergency Fuel Delivery', 'Spark Plug & Ignition Fix', 'Flat Tyre / Puncture Repair'],
    serviceRadius: 35,
    rating: 4.8,
    upiId: 'rajesh.karmakar@ybl',
    currentLocation: { lat: 23.2500, lng: 88.4300 }, // Shantipur
    city: 'Shantipur, Nadia'
  },
  {
    name: 'Sourav Banerjee',
    email: 'sourav.banerjee@fixonroad.com',
    phone: '+91 98306 99654',
    workshopName: 'Samudragar Breakdown & Recovery Station',
    vehiclePlate: 'WB-20-C-9934',
    vehicleModel: 'Bajaj Discover 125 Service Unit',
    specialization: 'On-Spot Highway Breakdown Recovery',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Battery Jumpstart', 'Minor Engine Breakdown', 'Emergency Fuel Delivery'],
    serviceRadius: 45,
    rating: 4.9,
    upiId: 'sourav.banerjee@icici',
    currentLocation: { lat: 23.3610, lng: 88.3180 }, // Samudragar
    city: 'Samudragar, Purba Bardhaman'
  },
  {
    name: 'Pradip Halder',
    email: 'pradip.halder@fixonroad.com',
    phone: '+91 98307 11765',
    workshopName: 'Naihati Express Care Hub',
    vehiclePlate: 'WB-12-F-2287',
    vehicleModel: 'Yamaha FZ-S Rapid Responder',
    specialization: 'Hydraulic Disc Brake & Suspension Rescue',
    serviceCategories: ['Brake Fluid & Bleeding', 'Flat Tyre / Puncture Repair', 'Chain & Cable Repair'],
    serviceRadius: 30,
    rating: 4.8,
    upiId: 'pradip.halder@okaxis',
    currentLocation: { lat: 22.8980, lng: 88.4230 }, // Naihati
    city: 'Naihati, North 24 Parganas'
  },
  {
    name: 'Amitabha Sen',
    email: 'amitabha.sen@fixonroad.com',
    phone: '+91 98308 22876',
    workshopName: 'Barrackpore Emergency Assistance Center',
    vehiclePlate: 'WB-24-M-7411',
    vehicleModel: 'Honda CB Unicorn 160 Response Unit',
    specialization: 'Rapid Battery Replacement & Alternator Diagnostics',
    serviceCategories: ['Battery Jumpstart', 'Emergency Fuel Delivery', 'Minor Engine Breakdown'],
    serviceRadius: 35,
    rating: 4.7,
    upiId: 'amitabha.sen@sbi',
    currentLocation: { lat: 22.7670, lng: 88.3750 }, // Barrackpore
    city: 'Barrackpore, North 24 Parganas'
  },
  {
    name: 'Tanmay Das',
    email: 'tanmay.das@fixonroad.com',
    phone: '+91 98309 33987',
    workshopName: 'Hooghly River Roadside Rescue',
    vehiclePlate: 'WB-16-D-8032',
    vehicleModel: 'Suzuki Gixxer 150 Mobile Bike',
    specialization: 'Comprehensive Multi-Brand Two-Wheeler Inspection',
    serviceCategories: ['Flat Tyre / Puncture Repair', 'Battery Jumpstart', 'Two-Wheeler Towing', 'Oil Top-up & Fluid Leak Fix'],
    serviceRadius: 35,
    rating: 4.9,
    upiId: 'tanmay.das@paytm',
    currentLocation: { lat: 22.9030, lng: 88.3970 }, // Hooghly / Chinsurah
    city: 'Chinsurah, Hooghly'
  },
  {
    name: 'Rakesh Pal',
    email: 'rakesh.pal@fixonroad.com',
    phone: '+91 98310 44098',
    workshopName: 'Krishnanagar Road Care Hub',
    vehiclePlate: 'WB-14-H-1904',
    vehicleModel: 'Hero Passion Pro Response Bike',
    specialization: 'Emergency Towing & Mechanical Recovery',
    serviceCategories: ['Two-Wheeler Towing', 'Flat Tyre / Puncture Repair', 'Minor Engine Breakdown'],
    serviceRadius: 40,
    rating: 4.8,
    upiId: 'rakesh.pal@hdfcbank',
    currentLocation: { lat: 23.4000, lng: 88.5000 }, // Krishnanagar
    city: 'Krishnanagar, Nadia'
  }
];

// ─── 50 Real Customers with Realistic Bengal Locations ─────────────────────────
const REAL_CUSTOMERS = [
  { name: 'Rupankar Basak', city: 'Kalyani', address: 'Block B, Central Park Road, Kalyani, Nadia 741235', lat: 22.9780, lng: 88.4330 },
  { name: 'Sayan Sengupta', city: 'Kalyani', address: 'Near Kalyani University Gate 1, Nadia 741235', lat: 22.9860, lng: 88.4410 },
  { name: 'Poulomi Dasgupta', city: 'Kanchrapara', address: 'Railway Colony Road, Kanchrapara, 24 Pgs (N) 743145', lat: 22.9480, lng: 88.4350 },
  { name: 'Abhishek Chatterjee', city: 'Chakdaha', address: 'Lalpur Road, Near Chakdaha Station, Nadia 741222', lat: 23.0820, lng: 88.5220 },
  { name: 'Trisha Majumder', city: 'Ranaghat', address: 'Court Road, Ranaghat Sub-Division, Nadia 741201', lat: 23.1790, lng: 88.5780 },
  { name: 'Arindam Dutta', city: 'Shantipur', address: 'College Road, Shantipur Municipality, Nadia 741404', lat: 23.2480, lng: 88.4320 },
  { name: 'Sneha Roy', city: 'Samudragar', address: 'Station Bazaar Road, Samudragar, Purba Bardhaman 713519', lat: 23.3610, lng: 88.3180 },
  { name: 'Ritwik Bhattacharya', city: 'Naihati', address: 'Anandabazar Link Road, Naihati, 24 Pgs (N) 743165', lat: 22.8990, lng: 88.4210 },
  { name: 'Priyanka Kundu', city: 'Barrackpore', address: 'SN Banerjee Road, Cantonment Area, Barrackpore 700120', lat: 22.7650, lng: 88.3730 },
  { name: 'Joydeep Ganguly', city: 'Chinsurah', address: 'Pipulpati More, Grand Trunk Road, Hooghly 712101', lat: 22.9010, lng: 88.3950 },
  { name: 'Moumita Bose', city: 'Bandel', address: 'Bandel Church Road, Hooghly 712123', lat: 22.9190, lng: 88.3840 },
  { name: 'Souvik Ghosh', city: 'Serampore', address: 'Battala Road, Serampore, Hooghly 712201', lat: 22.7510, lng: 88.3440 },
  { name: 'Ananya Das', city: 'Krishnanagar', address: 'Nediarpara Main Road, Krishnanagar, Nadia 741101', lat: 23.4020, lng: 88.5020 },
  { name: 'Deep Sarkar', city: 'Barasat', address: 'Champadali More, Jessore Road, Barasat 700124', lat: 22.7210, lng: 88.4820 },
  { name: 'Rimpa Mukherjee', city: 'Habra', address: 'Jessore Road Crossing, Habra, 24 Pgs (N) 743263', lat: 22.8340, lng: 88.6320 },
  { name: 'Nilanjan Chakraborty', city: 'Bhatpara', address: 'Ghoshpara Road, Bhatpara, 24 Pgs (N) 743123', lat: 22.8680, lng: 88.4060 },
  { name: 'Madhurima Pal', city: 'Titagarh', address: 'BT Road Titagarh Crossing, 24 Pgs (N) 700119', lat: 22.7380, lng: 88.3760 },
  { name: 'Subhajit Saha', city: 'Khardah', address: 'Khardah Station Road, 24 Pgs (N) 700117', lat: 22.7190, lng: 88.3790 },
  { name: 'Swagata Paul', city: 'Sodepur', address: 'Station Road, Sodepur, Kolkata 700110', lat: 22.6990, lng: 88.3880 },
  { name: 'Indranil Mitra', city: 'Belgharia', address: 'Feeder Road, Belgharia, Kolkata 700056', lat: 22.6630, lng: 88.3850 },
  { name: 'Tanushree Ghosh', city: 'Dum Dum', address: 'Dum Dum Cantonment Station Road, Kolkata 700065', lat: 22.6390, lng: 88.4180 },
  { name: 'Koushik Dey', city: 'Salt Lake', address: 'Sector V Ring Road, Salt Lake, Kolkata 700091', lat: 22.5830, lng: 88.4310 },
  { name: 'Payel Banerjee', city: 'New Town', address: 'Action Area II Main Arterial Road, New Town 700156', lat: 22.6010, lng: 88.4680 },
  { name: 'Rahul Sharma', city: 'Kolkata', address: 'Park Street Cross, Kolkata 700016', lat: 22.5510, lng: 88.3520 },
  { name: 'Debolina Sen', city: 'Howrah', address: 'Foreshore Road, Shibpur, Howrah 711102', lat: 22.5710, lng: 88.3240 },
  { name: 'Aakash Verma', city: 'Kalyani', address: 'Simanta Expressway Junction, Kalyani 741235', lat: 22.9690, lng: 88.4280 },
  { name: 'Megha Agarwal', city: 'Kalyani', address: 'A-Block Market Area, Kalyani 741235', lat: 22.9790, lng: 88.4380 },
  { name: 'Sandip Das', city: 'Kanchrapara', address: 'Workshop Gate No 3, Kanchrapara 743145', lat: 22.9430, lng: 88.4310 },
  { name: 'Pallabi Roy', city: 'Chakdaha', address: 'NH-12 Bypass Overbridge, Chakdaha 741222', lat: 23.0760, lng: 88.5170 },
  { name: 'Siddhartha Guha', city: 'Ranaghat', address: 'Happy Club More, Ranaghat 741201', lat: 23.1830, lng: 88.5830 },
  { name: 'Shreya Nandi', city: 'Shantipur', address: 'Sutragarh Handloom Cluster, Shantipur 741404', lat: 23.2420, lng: 88.4250 },
  { name: 'Arijit Pramanik', city: 'Samudragar', address: 'Bhagirathi Ferry Ghat Road, Samudragar 713519', lat: 23.3640, lng: 88.3150 },
  { name: 'Sudip Mondal', city: 'Kalna', address: '108 Shiva Temple Road, Kalna, Purba Bardhaman 713409', lat: 23.2210, lng: 88.3680 },
  { name: 'Dipika Halder', city: 'Naihati', address: 'Bhatpara Border Link Road, Naihati 743165', lat: 22.8940, lng: 88.4190 },
  { name: 'Rohan Gupta', city: 'Barrackpore', address: 'Wireless More, Barrackpore 700120', lat: 22.7720, lng: 88.3810 },
  { name: 'Bipasha Roy', city: 'Chinsurah', address: 'Tolafatak Road, Chinsurah 712101', lat: 22.8980, lng: 88.3910 },
  { name: 'Prasenjit Karmakar', city: 'Bandel', address: 'Debanandapur Road, Bandel 712123', lat: 22.9230, lng: 88.3790 },
  { name: 'Kavita Mishra', city: 'Serampore', address: 'College Ghat Road, Serampore 712201', lat: 22.7540, lng: 88.3480 },
  { name: 'Tuhin Mukherjee', city: 'Krishnanagar', address: 'Ghurni Clay Doll Colony, Krishnanagar 741101', lat: 23.4080, lng: 88.5080 },
  { name: 'Sampa Ghosh', city: 'Barasat', address: 'Kachhari Maidan Road, Barasat 700124', lat: 22.7240, lng: 88.4860 },
  { name: 'Animesh Das', city: 'Habra', address: 'Banipur ITI Campus Road, Habra 743263', lat: 22.8390, lng: 88.6380 },
  { name: 'Sumana Bhattacharya', city: 'Khardah', address: 'Rahara Bazaar More, Khardah 700118', lat: 22.7240, lng: 88.3830 },
  { name: 'Rajdeep Sen', city: 'Sodepur', address: 'Amrabati Housing Link, Sodepur 700110', lat: 22.7020, lng: 88.3920 },
  { name: 'Sohini Paul', city: 'Kolkata', address: 'Lake Gardens, Southern Avenue, Kolkata 700045', lat: 22.5050, lng: 88.3610 },
  { name: 'Vikramjit Singh', city: 'Salt Lake', address: 'Karunamoyee Central Park, Salt Lake 700091', lat: 22.5880, lng: 88.4230 },
  { name: 'Pooja Jha', city: 'New Town', address: 'Chinar Park Crossing, Rajarhat 700136', lat: 22.6280, lng: 88.4480 },
  { name: 'Ratan Das', city: 'Kalyani', address: 'Buddha Park Sector, Kalyani 741235', lat: 22.9730, lng: 88.4310 },
  { name: 'Manish Pandey', city: 'Ranaghat', address: 'Gournibas Road, Ranaghat 741201', lat: 23.1760, lng: 88.5740 },
  { name: 'Ananya Roy', city: 'Barrackpore', address: 'Orderly Bazaar, Barrackpore Cantonment 700120', lat: 22.7680, lng: 88.3780 },
  { name: 'Debjit Biswas', city: 'Kanchrapara', address: 'Bag More, Kanchrapara 743145', lat: 22.9510, lng: 88.4380 }
];

// Service catalog for seeding realistic orders
const SERVICE_CATALOG = [
  { serviceType: 'flat-tyre', name: 'Flat Tyre / Puncture Repair', basePrice: 299 },
  { serviceType: 'battery-jumpstart', name: 'Battery Jumpstart & Boost', basePrice: 349 },
  { serviceType: 'fuel-delivery', name: 'Emergency Fuel Delivery', basePrice: 249 },
  { serviceType: 'minor-repair', name: 'Minor Mechanical Breakdown', basePrice: 399 },
  { serviceType: 'towing', name: 'Rapid Two-Wheeler Towing', basePrice: 799 }
];

const ORDER_STATUSES = ['COMPLETED', 'CONFIRMED', 'PAID', 'EN_ROUTE', 'MECHANIC_ASSIGNED', 'ARRIVED', 'PENDING'] as const;

export async function runSeed() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 FixOnRoad MongoDB Atlas Realistic Seeding Pipeline');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Successfully connected to MongoDB Atlas.\n');

  // ─── 1. Complete Database Wipe ──────────────────────────────────────────────
  console.log('🧹 Clearing existing collections (User, Mechanic, Order)...');
  const deletedOrders = await Order.deleteMany({});
  const deletedMechanics = await Mechanic.deleteMany({});
  const deletedUsers = await User.deleteMany({});
  console.log(`   ✓ Removed ${deletedOrders.deletedCount} orders`);
  console.log(`   ✓ Removed ${deletedMechanics.deletedCount} mechanics`);
  console.log(`   ✓ Removed ${deletedUsers.deletedCount} users\n`);

  // ─── 2. Seed 10 Mechanics ──────────────────────────────────────────────────
  console.log('🔧 Seeding 10 Verified Mechanics across Bengal Hubs...');
  const mechanicDocs: any[] = [];
  for (const mech of REAL_MECHANICS) {
    const created = await Mechanic.create({
      name: mech.name,
      email: mech.email,
      password: DEFAULT_PASSWORD,
      phone: mech.phone,
      role: 'mechanic',
      workshopName: mech.workshopName,
      serviceCategories: mech.serviceCategories,
      specialization: mech.specialization,
      serviceRadius: mech.serviceRadius,
      vehiclePlate: mech.vehiclePlate,
      vehicleModel: mech.vehicleModel,
      upiId: mech.upiId,
      isAvailable: true,
      rating: mech.rating,
      currentLocation: mech.currentLocation
    });
    mechanicDocs.push(created);
    console.log(`   ✅ [Mechanic] ${created.name} | ${mech.vehiclePlate} | Hub: ${mech.workshopName} (${mech.city})`);
  }
  console.log(`\n🎉 Seeded ${mechanicDocs.length} mechanics successfully.\n`);

  // ─── 3. Seed 50 Customers/Users ────────────────────────────────────────────
  console.log('👥 Seeding 50 Real Customers across Bengal...');
  const userDocs: any[] = [];
  for (let i = 0; i < REAL_CUSTOMERS.length; i++) {
    const cust = REAL_CUSTOMERS[i];
    const emailNum = i + 1;
    // Create realistic email
    const nameSlug = cust.name.toLowerCase().replace(/\s+/g, '.');
    const email = i === 0 ? 'rupankar.basak@gmail.com' : `${nameSlug}.${emailNum}@example.com`;
    const phone = `+91 98300 ${String(emailNum).padStart(5, '0')}`;

    const createdUser = await User.create({
      name: cust.name,
      email,
      password: DEFAULT_PASSWORD,
      phone,
      role: 'customer',
      savedLocations: [cust.address]
    });
    userDocs.push({ ...createdUser.toObject(), locationCoords: { lat: cust.lat, lng: cust.lng, address: cust.address } });
    if ((i + 1) % 10 === 0 || i === 0) {
      console.log(`   ✅ [User #${i + 1}] ${cust.name} (${cust.city}) - ${email}`);
    }
  }
  console.log(`\n🎉 Seeded ${userDocs.length} real customers successfully.\n`);

  // ─── 4. Seed Realistic Orders with 16-Char Cryptographic Tracking Codes ────
  console.log('📋 Seeding 25 Orders with 16-Character Tracking Codes (FOR-XXXXXXXXXXXXXXXX)...');
  const seededOrders: any[] = [];

  // Dedicated demo configurations for the first 3 customer orders (Rupankar Basak) to verify uniqueness & coordinate sync
  const DEMO_ORDERS = [
    {
      serviceType: 'flat-tyre',
      serviceName: 'Flat Tyre / Puncture Repair',
      basePrice: 299,
      status: 'EN_ROUTE',
      // Order 1: Genuine Kalyani breakdown spot near Central Park
      location: {
        address: 'Block B, Central Park Road, Kalyani, Nadia 741235',
        lat: 22.9780,
        lng: 88.4330
      },
      // Assign Kalyani Specialist 1: Subhasish Ghosh
      mechanicIndex: 0 // Subhasish Ghosh (WB-12-AE-4921, Hero Splendor Plus)
    },
    {
      serviceType: 'fuel-delivery',
      serviceName: 'Emergency Fuel Delivery',
      basePrice: 249,
      status: 'CONFIRMED',
      // Order 2: Genuine Samudragar breakdown spot (~45 km from Kalyani Hub)
      location: {
        address: 'Station Bazaar Road, Kalna - Samudragar Ferry Ghat Road, Samudragar, Purba Bardhaman 713519',
        lat: 23.3610,
        lng: 88.3180
      },
      // Assign distinct Fuel Delivery Specialist: Rajesh Karmakar (WB-18-B-6109, Hero Glamour 125)
      mechanicIndex: 4 // Rajesh Karmakar (Carburetor & Fuel Injection Calibration)
    },
    {
      serviceType: 'battery-jumpstart',
      serviceName: 'Battery Jumpstart & Boost',
      basePrice: 349,
      status: 'MECHANIC_ASSIGNED',
      // Order 3: Chakdaha highway breakdown spot (~14 km)
      location: {
        address: 'Lalpur Road, Near Chakdaha Station, Nadia 741222',
        lat: 23.0820,
        lng: 88.5220
      },
      // Assign distinct Battery Specialist: Debasish Mondal (WB-16-T-3401, Honda Shine 125)
      mechanicIndex: 2 // Debasish Mondal
    }
  ];

  for (let i = 0; i < 25; i++) {
    const isDemo = i < DEMO_ORDERS.length;
    const demoConfig = isDemo ? DEMO_ORDERS[i] : null;

    const user = isDemo ? userDocs[0] : userDocs[i % userDocs.length];
    const service = demoConfig ? { serviceType: demoConfig.serviceType, basePrice: demoConfig.basePrice } : SERVICE_CATALOG[i % SERVICE_CATALOG.length];
    const status = (demoConfig ? demoConfig.status : ORDER_STATUSES[i % ORDER_STATUSES.length]) as any;

    // Ensure distinct mechanics: rotate through all 10 mechanics based on service matching
    const mechIndex = demoConfig ? demoConfig.mechanicIndex : ((i + 1) % mechanicDocs.length);
    const assignedMech = mechanicDocs[mechIndex];

    const gst = Math.round(service.basePrice * 0.18 * 100) / 100;
    const platformFee = 25;
    const totalAmount = service.basePrice + gst + platformFee;

    const userLoc = demoConfig ? demoConfig.location : (user.locationCoords || { lat: 22.9780, lng: 88.4330, address: 'Kalyani Breakdown Spot' });
    const mechLoc = assignedMech.currentLocation || { lat: 22.9750, lng: 88.4340 };

    // Compute real road distance & two-wheeler realistic duration
    const routeData = await getRoadRoute(
      { lat: mechLoc.lat, lng: mechLoc.lng },
      { lat: userLoc.lat, lng: userLoc.lng }
    );

    // Cryptographically secure 16-character alphanumeric tracking code
    const trackingCode = generateOrderCode();

    const order = await Order.create({
      userId: user._id,
      mechanicId: status === 'PENDING' ? undefined : assignedMech._id,
      orderCode: trackingCode,
      trackingCode,
      serviceDetails: {
        serviceType: service.serviceType,
        basePrice: service.basePrice,
        gst,
        platformFee,
        totalAmount
      },
      location: {
        lat: userLoc.lat,
        lng: userLoc.lng,
        address: userLoc.address
      },
      status,
      paymentMethod: i % 2 === 0 ? 'cod' : 'razorpay',
      roadDistanceKm: routeData.distanceKm,
      estimatedDurationMin: routeData.durationMinutes,
      routePolyline: routeData.coordinates,
      routingEngine: routeData.source,
      expiresAt: new Date(Date.now() + (i + 1) * 3600000)
    });

    seededOrders.push(order);
    console.log(`   ✅ [Order #${i + 1}] ${trackingCode} | ${service.serviceType} | ₹${totalAmount} | ${status} | Cust: ${user.name} → Mech: ${assignedMech.name} [${assignedMech.vehiclePlate} • ${assignedMech.vehicleModel}] (${routeData.distanceKm} km, ~${routeData.durationMinutes} min)`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎯 Seeding Complete Summary:');
  console.log(`   • 10 Verified Bengal Mechanics (All Available)`);
  console.log(`   • 50 Real Customers (Bengal Regions)`);
  console.log(`   • 25 Orders with 16-Char Cryptographic Tracking Codes (FOR-...)`);
  console.log(`   • Sample Tracking URL: /track/${seededOrders[0].trackingCode}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB Atlas.');
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  runSeed().catch((err) => {
    console.error('❌ Seeding pipeline error:', err);
    process.exit(1);
  });
}
