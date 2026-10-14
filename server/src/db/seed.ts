/**
 * seed.ts — Populates the FixOnRoad MongoDB Atlas cluster with realistic
 * driver (customer) and mechanic data for analysis & security auditing.
 *
 * Run:  npx tsx src/db/seed.ts
 *
 * What it creates:
 *   • 20 customer users (role: 'customer')
 *   • 15 mechanics with workshop details, specializations & live locations
 *   • 30 orders linking customers ↔ mechanics across every status & payment method
 *
 * All passwords are bcrypt-hashed ("Test@1234").
 * Phone numbers use realistic Indian +91 format.
 * Locations span Kolkata, Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Pune, Jaipur.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Mechanic } from '../models/Mechanic';
import { Order } from '../models/Order';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixonroad';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
const DEFAULT_PWD = hash('Test@1234');

const randomBetween = (min: number, max: number) =>
  +(min + Math.random() * (max - min)).toFixed(6);

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ─── Indian City Coordinates (lat/lng bounding boxes) ─────────────────────────

const CITIES: Record<string, { lat: [number, number]; lng: [number, number]; names: string[] }> = {
  Kolkata: {
    lat: [22.48, 22.62],
    lng: [88.30, 88.42],
    names: [
      'Park Street', 'Salt Lake Sector V', 'Howrah Station Area',
      'Jadavpur', 'New Town Action Area II', 'Gariahat',
    ],
  },
  Delhi: {
    lat: [28.52, 28.72],
    lng: [77.10, 77.32],
    names: [
      'Connaught Place', 'Karol Bagh', 'Dwarka Sector 21',
      'Lajpat Nagar', 'Rohini Sector 9', 'Saket',
    ],
  },
  Mumbai: {
    lat: [18.92, 19.12],
    lng: [72.82, 72.92],
    names: [
      'Andheri West', 'Bandra East', 'Dadar TT Circle',
      'Powai Hiranandani', 'Goregaon East', 'Malad West',
    ],
  },
  Bangalore: {
    lat: [12.90, 13.04],
    lng: [77.52, 77.68],
    names: [
      'Koramangala 4th Block', 'Whitefield ITPL Road',
      'Indiranagar 100 Feet Road', 'Electronic City Phase 1',
      'Jayanagar 4th Block', 'HSR Layout Sector 7',
    ],
  },
  Chennai: {
    lat: [13.00, 13.12],
    lng: [80.20, 80.30],
    names: [
      'T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery',
      'OMR Thoraipakkam', 'Mylapore',
    ],
  },
  Hyderabad: {
    lat: [17.36, 17.48],
    lng: [78.38, 78.52],
    names: [
      'Banjara Hills Road No. 12', 'Madhapur Hitech City',
      'Gachibowli', 'Secunderabad Clock Tower',
      'Kukatpally', 'Ameerpet',
    ],
  },
  Pune: {
    lat: [18.48, 18.58],
    lng: [73.82, 73.92],
    names: [
      'Shivaji Nagar FC Road', 'Hinjewadi Phase 1',
      'Kothrud', 'Viman Nagar', 'Hadapsar', 'Baner',
    ],
  },
  Jaipur: {
    lat: [26.85, 26.95],
    lng: [75.74, 75.84],
    names: [
      'C-Scheme', 'Malviya Nagar', 'Vaishali Nagar',
      'Mansarovar', 'Tonk Road', 'Jagatpura',
    ],
  },
};

const cityKeys = Object.keys(CITIES);

function randomLocation(city?: string) {
  const c = city || pick(cityKeys);
  const info = CITIES[c];
  return {
    city: c,
    lat: randomBetween(info.lat[0], info.lat[1]),
    lng: randomBetween(info.lng[0], info.lng[1]),
    address: `${pick(info.names)}, ${c}, India`,
  };
}

// ─── Realistic Customer (Driver) Data ─────────────────────────────────────────

const CUSTOMERS = [
  { name: 'Rupankar Basak', email: 'rupankar.basak@gmail.com', phone: '+919876543210' },
  { name: 'Arjun Sharma', email: 'arjun.sharma@gmail.com', phone: '+919123456780' },
  { name: 'Priya Mukherjee', email: 'priya.mukherjee@outlook.com', phone: '+919988776655' },
  { name: 'Rahul Verma', email: 'rahul.verma@gmail.com', phone: '+919012345678' },
  { name: 'Sneha Chatterjee', email: 'sneha.chatt@gmail.com', phone: '+918765432109' },
  { name: 'Amit Patel', email: 'amit.patel.drive@gmail.com', phone: '+917654321098' },
  { name: 'Deepika Rao', email: 'deepika.rao@yahoo.com', phone: '+916543210987' },
  { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '+919234567890' },
  { name: 'Ananya Das', email: 'ananya.das@outlook.com', phone: '+918901234567' },
  { name: 'Rohan Gupta', email: 'rohan.gupta99@gmail.com', phone: '+917890123456' },
  { name: 'Kavita Nair', email: 'kavita.nair@gmail.com', phone: '+916789012345' },
  { name: 'Suresh Iyer', email: 'suresh.iyer@gmail.com', phone: '+919345678901' },
  { name: 'Meera Joshi', email: 'meera.joshi@gmail.com', phone: '+918456789012' },
  { name: 'Aditya Banerjee', email: 'aditya.banerjee@outlook.com', phone: '+917567890123' },
  { name: 'Pooja Reddy', email: 'pooja.reddy@gmail.com', phone: '+916678901234' },
  { name: 'Sanjay Kumar', email: 'sanjay.kumar.drv@gmail.com', phone: '+919456789012' },
  { name: 'Nisha Pillai', email: 'nisha.pillai@yahoo.com', phone: '+918567890123' },
  { name: 'Karthik Menon', email: 'karthik.menon@gmail.com', phone: '+917678901234' },
  { name: 'Tanvi Deshmukh', email: 'tanvi.desh@gmail.com', phone: '+916789012340' },
  { name: 'Rajesh Tiwari', email: 'rajesh.tiwari@gmail.com', phone: '+919567890123' },
];

// ─── Realistic Mechanic Data ──────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  'Flat Tyre', 'Engine Repair', 'Battery Jumpstart', 'Oil Change',
  'Brake Repair', 'Towing', 'AC Repair', 'Clutch Repair',
  'Suspension Fix', 'General Service',
];

const SPECIALIZATIONS = [
  'Two-Wheeler Specialist', 'Four-Wheeler Specialist',
  'Diesel Engine Expert', 'EV & Hybrid Specialist',
  'Heavy Vehicle Specialist', 'Multi-Brand Specialist',
  'Luxury Car Specialist', 'Commercial Vehicle Expert',
];

const MECHANICS_DATA = [
  {
    name: 'Rajendra Mondal',
    email: 'rajendra.mechanic@gmail.com',
    phone: '+919800112233',
    workshopName: 'Mondal Auto Works',
    city: 'Kolkata',
    vehiclePlate: 'WB-06-AK-4521',
    upiId: 'rajendramondal@upi',
  },
  {
    name: 'Sunil Yadav',
    email: 'sunil.yadav.mech@gmail.com',
    phone: '+919811223344',
    workshopName: 'Yadav Motor Garage',
    city: 'Delhi',
    vehiclePlate: 'DL-4C-BJ-7892',
    upiId: 'sunilyadav@paytm',
  },
  {
    name: 'Mohammed Irfan',
    email: 'irfan.autocare@gmail.com',
    phone: '+919822334455',
    workshopName: 'Irfan Auto Care',
    city: 'Mumbai',
    vehiclePlate: 'MH-02-CD-3456',
    upiId: 'irfanauto@upi',
  },
  {
    name: 'Venkatesh Murthy',
    email: 'venkatesh.murthy@gmail.com',
    phone: '+919833445566',
    workshopName: 'Murthy Motors',
    city: 'Bangalore',
    vehiclePlate: 'KA-01-EF-6789',
    upiId: 'venkatesh.m@ybl',
  },
  {
    name: 'Balasubramanian K',
    email: 'bala.kmech@gmail.com',
    phone: '+919844556677',
    workshopName: 'Bala Two-Wheeler Clinic',
    city: 'Chennai',
    vehiclePlate: 'TN-09-GH-1234',
    upiId: 'balak@upi',
  },
  {
    name: 'Ganesh Reddy',
    email: 'ganesh.reddy.repair@gmail.com',
    phone: '+919855667788',
    workshopName: 'Reddy Road Rescue',
    city: 'Hyderabad',
    vehiclePlate: 'TS-08-IJ-5678',
    upiId: 'ganeshreddy@gpay',
  },
  {
    name: 'Prakash Jadhav',
    email: 'prakash.jadhav@gmail.com',
    phone: '+919866778899',
    workshopName: 'Jadhav Car Hospital',
    city: 'Pune',
    vehiclePlate: 'MH-12-KL-9012',
    upiId: 'prakashj@phonepe',
  },
  {
    name: 'Hemant Meena',
    email: 'hemant.meena.auto@gmail.com',
    phone: '+919877889900',
    workshopName: 'Meena Tyre & Auto',
    city: 'Jaipur',
    vehiclePlate: 'RJ-14-MN-3456',
    upiId: 'hemantmeena@upi',
  },
  {
    name: 'Debashis Roy',
    email: 'debashis.roy.mech@gmail.com',
    phone: '+919888990011',
    workshopName: 'Roy Express Garage',
    city: 'Kolkata',
    vehiclePlate: 'WB-02-OP-7890',
    upiId: 'debashisroy@paytm',
  },
  {
    name: 'Manoj Pandey',
    email: 'manoj.pandey.fix@gmail.com',
    phone: '+919899001122',
    workshopName: 'Pandey Quick Fix',
    city: 'Delhi',
    vehiclePlate: 'DL-8S-QR-2345',
    upiId: 'manojpandey@ybl',
  },
  {
    name: 'Abdul Rehman',
    email: 'abdul.rehman.auto@gmail.com',
    phone: '+919900112233',
    workshopName: 'AR Auto Solutions',
    city: 'Mumbai',
    vehiclePlate: 'MH-04-ST-6789',
    upiId: 'abdulrehman@upi',
  },
  {
    name: 'Nagaraj Shetty',
    email: 'nagaraj.shetty@gmail.com',
    phone: '+919911223344',
    workshopName: 'Shetty EV Service',
    city: 'Bangalore',
    vehiclePlate: 'KA-05-UV-0123',
    upiId: 'nagaraj.s@gpay',
  },
  {
    name: 'Selvakumar P',
    email: 'selva.kumar.auto@gmail.com',
    phone: '+919922334455',
    workshopName: 'Selva Diesel Experts',
    city: 'Chennai',
    vehiclePlate: 'TN-07-WX-4567',
    upiId: 'selvakumar@phonepe',
  },
  {
    name: 'Ravi Teja Goud',
    email: 'raviteja.goud@gmail.com',
    phone: '+919933445566',
    workshopName: 'Teja Road Assist',
    city: 'Hyderabad',
    vehiclePlate: 'TS-10-YZ-8901',
    upiId: 'ravitejag@upi',
  },
  {
    name: 'Sachin Bhosale',
    email: 'sachin.bhosale.mech@gmail.com',
    phone: '+919944556677',
    workshopName: 'Bhosale Motor Hub',
    city: 'Pune',
    vehiclePlate: 'MH-14-AB-2345',
    upiId: 'sachinb@ybl',
  },
];

// ─── Service Types & Pricing ──────────────────────────────────────────────────

const SERVICE_TYPES = [
  { serviceType: 'Flat Tyre Fix', basePrice: 250 },
  { serviceType: 'Battery Jumpstart', basePrice: 400 },
  { serviceType: 'Engine Diagnostic', basePrice: 800 },
  { serviceType: 'Oil Change', basePrice: 600 },
  { serviceType: 'Brake Pad Replacement', basePrice: 1200 },
  { serviceType: 'Towing (up to 10 km)', basePrice: 1500 },
  { serviceType: 'AC Gas Refill', basePrice: 1800 },
  { serviceType: 'Clutch Cable Replacement', basePrice: 900 },
  { serviceType: 'Spark Plug Replacement', basePrice: 350 },
  { serviceType: 'General Health Check-up', basePrice: 500 },
];

const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'MECHANIC_ASSIGNED', 'EN_ROUTE',
  'ARRIVED', 'COMPLETED', 'EXPIRED', 'PAID', 'FAILED',
] as const;

const PAYMENT_METHODS = ['cod', 'razorpay', 'upi', 'card', 'netbanking'] as const;

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  const db = mongoose.connection.db!;

  // ── Step 0: Drop stale indexes if present ───────────────────────────────────
  try {
    const indexes = await db.collection('mechanics').indexes();
    const staleIdx = indexes.find((idx: any) => idx.name === 'userId_1');
    if (staleIdx) {
      await db.collection('mechanics').dropIndex('userId_1');
      console.log('🧹 Dropped stale userId_1 index on mechanics.\n');
    }
  } catch (e: any) {
    // Ignore if collection does not exist yet
  }

  // ── 1. Seed Customers ───────────────────────────────────────────────────────
  console.log('👤 Seeding 20 customers (drivers)...');
  const customerDocs = [];
  for (const c of CUSTOMERS) {
    const loc = randomLocation();
    const existing = await User.findOne({ email: c.email });
    if (existing) {
      console.log(`   ⏭  ${c.name} already exists, skipping.`);
      customerDocs.push(existing);
      continue;
    }
    const user = await User.create({
      name: c.name,
      email: c.email,
      password: DEFAULT_PWD,
      phone: c.phone,
      role: 'customer',
      savedLocations: [loc.address],
    });
    customerDocs.push(user);
    console.log(`   ✅ ${c.name}  (${loc.city})`);
  }

  // ── 2. Seed Mechanics ───────────────────────────────────────────────────────
  console.log('\n🔧 Seeding 15 mechanics...');
  const mechanicDocs = [];
  for (let i = 0; i < MECHANICS_DATA.length; i++) {
    const m = MECHANICS_DATA[i];
    const loc = randomLocation(m.city);

    const existing = await Mechanic.findOne({ email: m.email });
    if (existing) {
      console.log(`   ⏭  ${m.name} already exists, skipping.`);
      mechanicDocs.push(existing);
      continue;
    }

    // Pick 2-4 random service categories
    const numCats = 2 + Math.floor(Math.random() * 3);
    const cats = [...SERVICE_CATEGORIES].sort(() => Math.random() - 0.5).slice(0, numCats);

    const mechanic = await Mechanic.create({
      name: m.name,
      email: m.email,
      password: DEFAULT_PWD,
      phone: m.phone,
      role: 'mechanic',
      workshopName: m.workshopName,
      serviceCategories: cats,
      specialization: pick(SPECIALIZATIONS),
      serviceRadius: pick([5, 8, 10, 12, 15, 20]),
      vehiclePlate: m.vehiclePlate,
      upiId: m.upiId,
      isAvailable: Math.random() > 0.3, // ~70% available
      rating: +(3.5 + Math.random() * 1.5).toFixed(1), // 3.5 – 5.0
      currentLocation: { lat: loc.lat, lng: loc.lng },
    });
    mechanicDocs.push(mechanic);
    console.log(`   ✅ ${m.name}  @ ${m.workshopName}  (${m.city})`);
  }

  // ── 3. Seed Orders ─────────────────────────────────────────────────────────
  console.log('\n📋 Seeding 30 orders...');
  for (let i = 0; i < 30; i++) {
    const customer = pick(customerDocs);
    const mechanic = pick(mechanicDocs);
    const svc = pick(SERVICE_TYPES);
    const loc = randomLocation();

    const gst = +(svc.basePrice * 0.18).toFixed(2);
    const platformFee = +(svc.basePrice * 0.05).toFixed(2);
    const totalAmount = +(svc.basePrice + gst + platformFee).toFixed(2);

    const status = pick(ORDER_STATUSES);
    const paymentMethod = pick(PAYMENT_METHODS);

    // Expired orders get an expiresAt in the past
    const expiresAt =
      status === 'EXPIRED'
        ? new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000))
        : status === 'PENDING'
        ? new Date(Date.now() + 30 * 60000) // 30 min from now
        : undefined;

    const order = await Order.create({
      userId: customer._id,
      mechanicId: ['PENDING', 'EXPIRED', 'FAILED'].includes(status)
        ? undefined
        : mechanic._id,
      serviceDetails: {
        serviceType: svc.serviceType,
        basePrice: svc.basePrice,
        gst,
        platformFee,
        totalAmount,
      },
      location: {
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
      },
      status,
      paymentMethod,
      razorpayOrderId:
        paymentMethod === 'razorpay'
          ? `order_${Date.now().toString(36)}${i}`
          : undefined,
      expiresAt,
    });

    console.log(
      `   ✅ Order #${i + 1}  ${svc.serviceType}  ₹${totalAmount}  [${status}]  ${customer.name} → ${
        order.mechanicId ? mechanic.name : '(unassigned)'
      }`
    );
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`   📊  ${customerDocs.length} customers`);
  console.log(`   🔧  ${mechanicDocs.length} mechanics`);
  console.log(`   📋  30 orders\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
