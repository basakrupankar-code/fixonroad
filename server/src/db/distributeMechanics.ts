/**
 * distributeMechanics.ts
 *
 * Randomly and evenly distributes orders across all available mechanics in MongoDB Atlas.
 * Ensures:
 * 1. Every mechanic (including newly signed-up Google partners) has completed and active orders.
 * 2. Mechanics have realistic earnings across today, this week, this month, and lifetime.
 * 3. Keeps an unassigned pool of PENDING orders available for real-time dispatch in the Incident Feed.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Mechanic } from '../models/Mechanic';
import { Order } from '../models/Order';

dotenv.config({ path: 'q:/fixonroad/server/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixonroad';

async function distribute() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas.\n');

  // 1. Fetch all mechanics and ensure they are available
  await Mechanic.updateMany({}, { $set: { isAvailable: true } });
  const mechanics = await Mechanic.find({}).sort({ createdAt: 1 });
  console.log(`🔧 Found ${mechanics.length} total mechanics:`);
  mechanics.forEach((m, idx) => {
    console.log(`   ${idx + 1}. [${m._id}] ${m.name} (${m.email}) - Loc: (${m.currentLocation?.lat?.toFixed(2)}, ${m.currentLocation?.lng?.toFixed(2)})`);
  });

  if (mechanics.length === 0) {
    console.error('❌ No mechanics found in database.');
    await mongoose.disconnect();
    return;
  }

  // 2. Fetch all orders
  const allOrders = await Order.find({});
  console.log(`\n📋 Found ${allOrders.length} total orders.`);

  // Separate pending orders (keep some unassigned for the Incident Feed)
  const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
  const nonPendingOrders = allOrders.filter(o => o.status !== 'PENDING' && o.status !== 'FAILED' && o.status !== 'EXPIRED');
  const inactiveOrders = allOrders.filter(o => o.status === 'FAILED' || o.status === 'EXPIRED');

  console.log(`   • ${pendingOrders.length} PENDING orders`);
  console.log(`   • ${nonPendingOrders.length} Active / Completed orders`);
  console.log(`   • ${inactiveOrders.length} Inactive (Expired/Failed) orders\n`);

  // 3. Shuffle non-pending orders and mechanics for random, fair distribution
  const shuffledOrders = [...nonPendingOrders].sort(() => Math.random() - 0.5);

  // Assign non-pending orders round-robin across all mechanics
  console.log('⚖️  Distributing completed and active orders evenly across all mechanics...');
  for (let i = 0; i < shuffledOrders.length; i++) {
    const order = shuffledOrders[i];
    const assignedMechanic = mechanics[i % mechanics.length];

    await Order.findByIdAndUpdate(order._id, {
      $set: { mechanicId: assignedMechanic._id }
    });
  }

  // Also distribute half of the pending orders, keeping the rest open for Incident Feed
  const numPendingToAssign = Math.floor(pendingOrders.length / 2);
  for (let i = 0; i < pendingOrders.length; i++) {
    const order = pendingOrders[i];
    if (i < numPendingToAssign) {
      const assignedMechanic = mechanics[(nonPendingOrders.length + i) % mechanics.length];
      await Order.findByIdAndUpdate(order._id, {
        $set: { mechanicId: assignedMechanic._id, status: 'MECHANIC_ASSIGNED' }
      });
    } else {
      // Unassigned for real-time acceptance
      await Order.findByIdAndUpdate(order._id, {
        $unset: { mechanicId: 1 },
        $set: { status: 'PENDING' }
      });
    }
  }

  // 4. Verification & Distribution Report
  console.log('\n📊 Final Order Distribution by Mechanic:');
  const finalOrders = await Order.find({});
  const mechOrderMap: Record<string, { total: number; completed: number; active: number; earnings: number }> = {};

  for (const m of mechanics) {
    mechOrderMap[m._id.toString()] = { total: 0, completed: 0, active: 0, earnings: 0 };
  }
  let unassignedCount = 0;

  for (const o of finalOrders) {
    if (!o.mechanicId) {
      unassignedCount++;
      continue;
    }
    const mId = o.mechanicId.toString();
    if (!mechOrderMap[mId]) {
      mechOrderMap[mId] = { total: 0, completed: 0, active: 0, earnings: 0 };
    }
    mechOrderMap[mId].total++;
    const price = o.serviceDetails?.totalAmount || 0;
    if (['COMPLETED', 'PAID'].includes(o.status)) {
      mechOrderMap[mId].completed++;
      mechOrderMap[mId].earnings += price;
    } else if (['MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(o.status)) {
      mechOrderMap[mId].active++;
    }
  }

  for (const m of mechanics) {
    const stats = mechOrderMap[m._id.toString()];
    console.log(
      `   👤 ${m.name.padEnd(20)} [${m.email.padEnd(30)}] → Total: ${stats.total} | Completed: ${stats.completed} | Active: ${stats.active} | Est. Earned: ₹${stats.earnings}`
    );
  }
  console.log(`\n   🟢 Unassigned PENDING orders (available in Incident Feed): ${unassignedCount}`);

  await mongoose.disconnect();
  console.log('\n🎉 Distribution complete & database synced!');
}

distribute().catch(err => {
  console.error('❌ Distribution error:', err);
  process.exit(1);
});
