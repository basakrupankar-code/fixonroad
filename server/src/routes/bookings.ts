import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Mechanic } from '../models/Mechanic';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { calculateHaversineDistanceKm, isValidCoordinate, formatDistance } from '../utils/distance';
import { assignRandomAvailableMechanic } from '../utils/mechanicAssignment';
import { generateOrderCode } from '../utils/orderCode';
import { getRoadRoute } from '../utils/routing';
import { synchronizeLocation } from '../utils/locationSync';

const router = Router();

// Used by Mechanic Portal to fetch their jobs with live distance calculation
router.get('/mechanic-jobs', requireAuth, async (req: any, res: any, next) => {
  try {
    const user = req.user;
    if (user.role !== 'mechanic') {
      return res.status(403).json({ error: { message: 'Only mechanics can fetch jobs' } });
    }

    // 1. Resolve mechanic location: check query parameters first, then profile database
    let mechLat: number | null = null;
    let mechLng: number | null = null;

    if (req.query.lat && req.query.lng) {
      const qLat = Number(req.query.lat);
      const qLng = Number(req.query.lng);
      if (isValidCoordinate(qLat, qLng)) {
        mechLat = qLat;
        mechLng = qLng;

        // Asynchronously update mechanic profile with latest live location if valid
        Mechanic.findByIdAndUpdate(user._id, {
          $set: { currentLocation: { lat: qLat, lng: qLng } }
        }).catch(err => console.error('Failed to update live mechanic location:', err));
      }
    }

    if (mechLat === null || mechLng === null) {
      const mechDoc = await Mechanic.findById(user._id).select('currentLocation');
      if (mechDoc?.currentLocation && isValidCoordinate(mechDoc.currentLocation.lat, mechDoc.currentLocation.lng)) {
        mechLat = mechDoc.currentLocation.lat;
        mechLng = mechDoc.currentLocation.lng;
      }
    }

    // 2. Get unassigned (PENDING) jobs or jobs assigned to this mechanic
    const jobs = await Order.find({
      $or: [
        { status: 'PENDING' },
        { mechanicId: user._id }
      ]
    }).populate('userId', 'name phone').sort({ createdAt: -1 });

    const formattedJobs = jobs.map((job: any) => {
      const jobLat = job.location?.lat;
      const jobLng = job.location?.lng;
      let distanceKm: number | null = null;

      if (isValidCoordinate(mechLat, mechLng) && isValidCoordinate(jobLat, jobLng)) {
        distanceKm = calculateHaversineDistanceKm(
          { lat: mechLat!, lng: mechLng! },
          { lat: jobLat, lng: jobLng }
        );
      }

      return {
        id: job._id,
        type: job.serviceDetails?.serviceType || 'Roadside Assistance',
        customerName: job.userId?.name || 'Customer in Need',
        customerPhone: job.userId?.phone || null,
        location: job.location?.address || 'Roadside Location',
        coordinates: {
          lat: typeof jobLat === 'number' ? jobLat : null,
          lng: typeof jobLng === 'number' ? jobLng : null
        },
        distanceKm: distanceKm,
        distance: formatDistance(distanceKm),
        price: Number(job.serviceDetails?.totalAmount || 0),
        basePrice: Number(job.serviceDetails?.basePrice || 0),
        gst: Number(job.serviceDetails?.gst || 0),
        platformFee: Number(job.serviceDetails?.platformFee || 0),
        status: job.status,
        time: job.createdAt
      };
    });

    res.json({ jobs: formattedJobs });
  } catch (error) {
    next(error);
  }
});

// Used by Mechanic Portal to fetch aggregated earnings & recent payouts
router.get('/mechanic-earnings', requireAuth, async (req: any, res: any, next) => {
  try {
    const user = req.user;
    if (user.role !== 'mechanic') {
      return res.status(403).json({ error: { message: 'Only mechanics can fetch earnings' } });
    }

    const mechanicObjId = new mongoose.Types.ObjectId(user._id);

    // Compute Indian Standard Time / local date boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // MongoDB aggregation pipeline for completed/paid job amounts
    const aggregation = await Order.aggregate([
      {
        $match: {
          mechanicId: { $in: [mechanicObjId, user._id.toString()] },
          status: { $in: ['COMPLETED', 'PAID'] }
        }
      },
      {
        $group: {
          _id: null,
          lifetimeEarnings: { $sum: '$serviceDetails.totalAmount' },
          totalCompletedJobs: { $sum: 1 },
          todayEarnings: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfToday] }, '$serviceDetails.totalAmount', 0]
            }
          },
          todayJobs: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0]
            }
          },
          weekEarnings: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$serviceDetails.totalAmount', 0]
            }
          },
          weekJobs: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0]
            }
          },
          monthEarnings: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$serviceDetails.totalAmount', 0]
            }
          },
          monthJobs: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Active in-progress jobs calculation
    const activeJobs = await Order.find({
      mechanicId: { $in: [mechanicObjId, user._id.toString()] },
      status: { $in: ['MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED'] }
    }).select('serviceDetails.totalAmount');

    const activeJobsCount = activeJobs.length;
    const activeEarnings = activeJobs.reduce((sum, j) => sum + Number(j.serviceDetails?.totalAmount || 0), 0);

    // Recent payouts list
    const recentOrders = await Order.find({
      mechanicId: { $in: [mechanicObjId, user._id.toString()] },
      status: { $in: ['COMPLETED', 'PAID'] }
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(10)
      .populate('userId', 'name phone');

    const recentPayouts = recentOrders.map((o: any) => ({
      id: o._id,
      serviceType: o.serviceDetails?.serviceType || 'Roadside Assistance',
      customerName: o.userId?.name || 'Customer',
      amount: Number(o.serviceDetails?.totalAmount || 0),
      basePrice: Number(o.serviceDetails?.basePrice || 0),
      date: o.updatedAt || o.createdAt,
      paymentMethod: o.paymentMethod || 'UPI',
      status: o.status
    }));

    const stats = aggregation[0] || {
      lifetimeEarnings: 0,
      totalCompletedJobs: 0,
      todayEarnings: 0,
      todayJobs: 0,
      weekEarnings: 0,
      weekJobs: 0,
      monthEarnings: 0,
      monthJobs: 0
    };

    res.json({
      earnings: {
        today: Math.round(Number(stats.todayEarnings) || 0),
        todayJobs: Number(stats.todayJobs) || 0,
        week: Math.round(Number(stats.weekEarnings) || 0),
        weekJobs: Number(stats.weekJobs) || 0,
        month: Math.round(Number(stats.monthEarnings) || 0),
        monthJobs: Number(stats.monthJobs) || 0,
        lifetime: Math.round(Number(stats.lifetimeEarnings) || 0),
        completedJobs: Number(stats.totalCompletedJobs) || 0,
        activeJobs: activeJobsCount,
        activeEarnings: Math.round(activeEarnings)
      },
      recentPayouts
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req: any, res: any, next) => {
  try {
    let { mechanicId, serviceDetails, serviceType, basePrice, location, paymentMethod, status } = req.body;
    
    if (!serviceDetails && serviceType) {
      const base = Number(basePrice) || 150;
      const gst = Math.round(base * 0.18);
      const platformFee = 10;
      const platformGst = Math.round(platformFee * 0.18);
      serviceDetails = {
        serviceType,
        basePrice: base,
        gst,
        platformFee: platformFee + platformGst,
        totalAmount: base + gst + platformFee + platformGst
      };
    }

    // 1. Strictly lock and synchronize customer coordinates and human-readable address
    const syncLoc = synchronizeLocation(location);
    const synchronizedLocation = {
      address: syncLoc.address,
      lat: syncLoc.lat,
      lng: syncLoc.lng
    };

    let assignedMechanicDoc: any = null;
    // 2. If mechanicId is provided, fetch the mechanic; otherwise auto-assign based on availability, capability, and proximity
    if (mechanicId && mongoose.Types.ObjectId.isValid(mechanicId)) {
      assignedMechanicDoc = await Mechanic.findById(mechanicId);
    } else {
      assignedMechanicDoc = await assignRandomAvailableMechanic({
        location: { lat: syncLoc.lat, lng: syncLoc.lng },
        serviceType: serviceDetails?.serviceType || serviceType
      });
      if (assignedMechanicDoc) {
        mechanicId = assignedMechanicDoc._id;
      }
    }

    // 3. Compute real road network route & two-wheeler ETA via OSRM from mechanic's hub to customer coordinates
    const originCoords = {
      lat: assignedMechanicDoc?.currentLocation?.lat || 22.9750,
      lng: assignedMechanicDoc?.currentLocation?.lng || 88.4340
    };
    const destCoords = {
      lat: syncLoc.lat,
      lng: syncLoc.lng
    };

    const routeData = await getRoadRoute(originCoords, destCoords);

    // 4. Create unique order with 16-character cryptographic tracking code
    const orderCode = generateOrderCode();
    const newOrder = await Order.create({
      userId: req.user._id,
      orderCode,
      trackingCode: orderCode,
      mechanicId,
      serviceDetails,
      location: synchronizedLocation,
      paymentMethod: paymentMethod || 'cod',
      status: status || (mechanicId ? 'CONFIRMED' : 'PENDING'),
      roadDistanceKm: routeData.distanceKm,
      estimatedDurationMin: routeData.durationMinutes,
      routePolyline: routeData.coordinates,
      routingEngine: routeData.source,
      expiresAt: new Date(Date.now() + 600000) // expires in 10 mins
    });

    const populatedOrder = await Order.findById(newOrder._id).populate('mechanicId');
    res.status(201).json(populatedOrder || newOrder);
  } catch (error) {
    next(error);
  }
});

const VALID_ORDER_STATUSES = [
  'IDLE', 'PENDING', 'VERIFYING', 'PAID', 'FAILED', 
  'CONFIRMED', 'MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 
  'COMPLETED', 'EXPIRED'
] as const;

router.get('/', requireAuth, async (req: any, res: any, next) => {
  try {
    const { status } = req.query;
    let query: any = {};

    if (req.user?.role === 'mechanic') {
      const mechId = req.user._id;
      const mechObjId = mongoose.Types.ObjectId.isValid(mechId) ? new mongoose.Types.ObjectId(mechId) : mechId;
      query = { $or: [{ mechanicId: mechObjId }, { mechanicId: req.user.userId }, { mechanicId: mechId }] };
    } else {
      const userObjId = mongoose.Types.ObjectId.isValid(req.user._id) ? new mongoose.Types.ObjectId(req.user._id) : req.user._id;
      query = { $or: [{ userId: userObjId }, { userId: req.user.userId }, { userId: req.user._id }] };
    }
    
    // Sanitize query to prevent NoSQL operator injection; exclude inactive/cancelled by default
    if (typeof status === 'string' && VALID_ORDER_STATUSES.includes(status as any)) {
      query.status = status;
    } else if (!status) {
      query.status = { $nin: ['CANCELLED', 'FAILED', 'EXPIRED'] };
    }
    
    const orders = await Order.find(query)
      .populate('mechanicId', 'name workshopName specialization serviceCategories vehiclePlate vehicleModel phone rating currentLocation')
      .sort({ createdAt: -1 });

    const normalizedOrders = orders.map((o: any) => {
      const serviceType = 
        o.serviceType || 
        o.serviceDetails?.serviceType || 
        o.serviceId || 
        'roadside-assistance';
      
      const amount = 
        o.amount || 
        o.totalAmount || 
        o.serviceDetails?.totalAmount || 
        o.serviceFee || 
        150;

      const syncLoc = synchronizeLocation(o.location || { address: o.address });
      const location = {
        address: o.location?.address || syncLoc.address,
        lat: typeof o.location?.lat === 'number' && o.location.lat !== 0 ? o.location.lat : syncLoc.lat,
        lng: typeof o.location?.lng === 'number' && o.location.lng !== 0 ? o.location.lng : syncLoc.lng
      };

      return {
        _id: o._id,
        orderCode: o.orderCode || `FOR-${o._id.toString().slice(0, 6).toUpperCase()}`,
        serviceType,
        status: o.status || 'CONFIRMED',
        amount,
        totalPrice: amount,
        paymentMethod: o.paymentMethod || 'cod',
        location,
        address: location.address,
        roadDistanceKm: o.roadDistanceKm,
        estimatedDurationMin: o.estimatedDurationMin,
        routePolyline: o.routePolyline || [],
        routingEngine: o.routingEngine || 'osrm-bike',
        mechanicId: o.mechanicId,
        createdAt: o.createdAt || new Date()
      };
    });

    res.json({ bookings: normalizedOrders, orders: normalizedOrders });
  } catch (error) {
    next(error);
  }
});

// Route geometry endpoint for reliable road network calculation (avoids browser CORS/rate-limits)
router.get('/route-geometry', async (req: any, res: any, next) => {
  try {
    const originLat = Number(req.query.originLat) || 22.975;
    const originLng = Number(req.query.originLng) || 88.434;
    const destLat = Number(req.query.destLat) || 23.361;
    const destLng = Number(req.query.destLng) || 88.318;
    const route = await getRoadRoute({ lat: originLat, lng: originLng }, { lat: destLat, lng: destLng });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

// Dedicated Live Tracking Telemetry Endpoint: strictly gated behind auth, ownership & confirmed status
router.get('/track/:id', requireAuth, async (req: any, res: any, next) => {
  try {
    const { id } = req.params;
    const currentUserId = (req.user?.userId || req.user?._id || '').toString();
    
    // Support lookup by MongoDB ObjectId, orderCode, or trackingCode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId 
      ? { $or: [{ _id: id }, { orderCode: id.toUpperCase() }, { trackingCode: id.toUpperCase() }] } 
      : { $or: [{ orderCode: id.toUpperCase() }, { trackingCode: id.toUpperCase() }] };

    let booking = await Order.findOne(query).populate('mechanicId');
    if (!booking) {
      return res.status(404).json({ error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' } });
    }

    // 1. Customer Ownership & Role Gating:
    // Only allow customer creator, assigned mechanic, or admin
    const isOwner = booking.userId && booking.userId.toString() === currentUserId;
    const mechId = (booking.mechanicId as any)?._id?.toString() || booking.mechanicId?.toString();
    const isAssignedMechanic = mechId && mechId === currentUserId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAssignedMechanic && !isAdmin) {
      return res.status(403).json({ 
        error: { 
          message: 'Access Denied: You do not have permission to view this order telemetry',
          code: 'UNAUTHORIZED_ACCESS'
        } 
      });
    }

    // 2. Verified Active/Confirmed Status Check
    const statusUpper = (booking.status || '').toUpperCase();
    const INACTIVE_STATUSES = ['FAILED', 'CANCELLED', 'EXPIRED'];
    if (INACTIVE_STATUSES.includes(statusUpper)) {
      return res.status(400).json({
        error: {
          message: `Order is ${booking.status.toLowerCase()} and does not have an active live dispatch`,
          code: 'ORDER_INACTIVE',
          status: booking.status
        }
      });
    }

    // 3. Dynamically synchronize customer location & backfill road network geometry & realistic ETA if missing
    const syncLoc = synchronizeLocation(booking.location);
    if (!booking.location?.lat || booking.location.lat === 0 || 
        (syncLoc.address.toLowerCase().includes('samudragar') && booking.location.lat < 23)) {
      booking.location = {
        address: syncLoc.address,
        lat: syncLoc.lat,
        lng: syncLoc.lng
      };
      await booking.save();
    }

    if (!booking.routePolyline || booking.routePolyline.length <= 2 || !booking.roadDistanceKm) {
      const mechLocation = (booking.mechanicId as any)?.currentLocation || { lat: 22.9750, lng: 88.4340 };
      const destLocation = { lat: syncLoc.lat, lng: syncLoc.lng };
      const routeData = await getRoadRoute(
        { lat: mechLocation.lat || 22.9750, lng: mechLocation.lng || 88.4340 },
        { lat: destLocation.lat, lng: destLocation.lng }
      );
      booking.roadDistanceKm = routeData.distanceKm;
      booking.estimatedDurationMin = routeData.durationMinutes;
      booking.routePolyline = routeData.coordinates as any;
      booking.routingEngine = routeData.source;
      if (!booking.orderCode) {
        booking.orderCode = generateOrderCode();
      }
      booking.trackingCode = booking.orderCode;
      await booking.save();
    }

    const bookingData: any = booking.toObject ? booking.toObject() : { ...booking };
    bookingData.trackingCode = booking.trackingCode || booking.orderCode || `FOR-${booking._id.toString().slice(0, 8).toUpperCase()}`;
    bookingData.orderCode = bookingData.trackingCode;
    bookingData.hubLocation = (booking.mechanicId as any)?.currentLocation || { lat: 22.975, lng: 88.434 };

    res.json(bookingData);
  } catch (error) {
    next(error);
  }
});

// Standard booking lookup endpoint with strict ownership gating
router.get('/:id', requireAuth, async (req: any, res: any, next) => {
  try {
    const { id } = req.params;
    const currentUserId = (req.user?.userId || req.user?._id || '').toString();
    
    // Support lookup by MongoDB ObjectId, orderCode, or trackingCode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId 
      ? { $or: [{ _id: id }, { orderCode: id.toUpperCase() }, { trackingCode: id.toUpperCase() }] } 
      : { $or: [{ orderCode: id.toUpperCase() }, { trackingCode: id.toUpperCase() }] };

    let booking = await Order.findOne(query).populate('mechanicId');
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found', code: 'BOOKING_NOT_FOUND' } });
    }

    // Customer Ownership & Role Gating
    const isOwner = booking.userId && booking.userId.toString() === currentUserId;
    const mechId = (booking.mechanicId as any)?._id?.toString() || booking.mechanicId?.toString();
    const isAssignedMechanic = mechId && mechId === currentUserId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAssignedMechanic && !isAdmin) {
      return res.status(403).json({ 
        error: { 
          message: 'Access Denied: You do not have permission to view this booking',
          code: 'UNAUTHORIZED_ACCESS'
        } 
      });
    }

    // Dynamically synchronize customer location & backfill road network geometry & realistic ETA if missing
    const syncLoc = synchronizeLocation(booking.location);
    if (!booking.location?.lat || booking.location.lat === 0 || 
        (syncLoc.address.toLowerCase().includes('samudragar') && booking.location.lat < 23)) {
      booking.location = {
        address: syncLoc.address,
        lat: syncLoc.lat,
        lng: syncLoc.lng
      };
      await booking.save();
    }

    if (!booking.routePolyline || booking.routePolyline.length <= 2 || !booking.roadDistanceKm) {
      const mechLocation = (booking.mechanicId as any)?.currentLocation || { lat: 22.9750, lng: 88.4340 };
      const destLocation = { lat: syncLoc.lat, lng: syncLoc.lng };
      const routeData = await getRoadRoute(
        { lat: mechLocation.lat || 22.9750, lng: mechLocation.lng || 88.4340 },
        { lat: destLocation.lat, lng: destLocation.lng }
      );
      booking.roadDistanceKm = routeData.distanceKm;
      booking.estimatedDurationMin = routeData.durationMinutes;
      booking.routePolyline = routeData.coordinates as any;
      booking.routingEngine = routeData.source;
      if (!booking.orderCode) {
        booking.orderCode = generateOrderCode();
      }
      booking.trackingCode = booking.orderCode;
      await booking.save();
    }

    const bookingData: any = booking.toObject ? booking.toObject() : { ...booking };
    bookingData.trackingCode = booking.trackingCode || booking.orderCode || `FOR-${booking._id.toString().slice(0, 8).toUpperCase()}`;
    bookingData.orderCode = bookingData.trackingCode;
    bookingData.hubLocation = (booking.mechanicId as any)?.currentLocation || { lat: 22.975, lng: 88.434 };

    res.json(bookingData);
  } catch (error) {
    next(error);
  }
});


router.patch('/:id/status', requireAuth, async (req: any, res: any, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'Invalid booking ID format' } });
    }
    
    const { status } = req.body;
    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid or unsupported status value' } });
    }

    const booking = await Order.findById(id);
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found' } });
    }

    const currentUserId = req.user.userId || req.user._id.toString();
    const isCustomer = booking.userId.toString() === currentUserId;
    const isAssignedMechanic = booking.mechanicId?.toString() === currentUserId;

    // 1. Mechanic accepting a PENDING job (Atomic update eliminates race conditions)
    if (status === 'MECHANIC_ASSIGNED') {
      if (req.user.role !== 'mechanic') {
        return res.status(403).json({ error: { message: 'Only mechanics can accept bookings' } });
      }

      const assignedBooking = await Order.findOneAndUpdate(
        {
          _id: id,
          status: 'PENDING',
          $or: [{ mechanicId: { $exists: false } }, { mechanicId: null }]
        },
        {
          $set: {
            status: 'MECHANIC_ASSIGNED',
            mechanicId: req.user._id
          }
        },
        { new: true }
      );

      if (!assignedBooking) {
        return res.status(409).json({
          error: {
            code: 'JOB_ALREADY_TAKEN',
            message: 'This job has already been accepted by another partner or is no longer available.'
          }
        });
      }

      return res.json(assignedBooking);
    } 
    // 2. Mechanic updating workflow statuses (EN_ROUTE, ARRIVED, COMPLETED)
    else if (['EN_ROUTE', 'ARRIVED', 'COMPLETED'].includes(status)) {
      if (!isAssignedMechanic && req.user.role !== 'admin') {
        return res.status(403).json({ error: { message: 'Only the assigned mechanic can update this job progress' } });
      }
      booking.status = status;
    } 
    // 3. Customer or Mechanic cancelling/failing an order
    else if (['FAILED', 'EXPIRED'].includes(status)) {
      if (!isCustomer && !isAssignedMechanic && req.user.role !== 'admin') {
        return res.status(403).json({ error: { message: 'Forbidden. Unauthorized to change order status' } });
      }
      booking.status = status;
    } 
    else {
      // Direct updates to sensitive states like PAID must occur via payment verification
      if (status === 'PAID') {
        return res.status(403).json({ error: { message: 'Status PAID must be updated through the payment verification endpoint' } });
      }
      booking.status = status;
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export const bookingsRouter = router;
