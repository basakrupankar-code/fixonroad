import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Mechanic } from '../models/Mechanic';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { calculateHaversineDistanceKm, isValidCoordinate, formatDistance } from '../utils/distance';
import { assignRandomAvailableMechanic } from '../utils/mechanicAssignment';
import { generateOrderCode } from '../utils/orderCode';
import { getRoadRoute } from '../utils/routing';

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
    let { mechanicId, serviceDetails, location, paymentMethod } = req.body;
    
    let assignedMechanicDoc: any = null;
    // 1. If mechanicId is provided, fetch the mechanic; otherwise auto-assign
    if (mechanicId && mongoose.Types.ObjectId.isValid(mechanicId)) {
      assignedMechanicDoc = await Mechanic.findById(mechanicId);
    } else {
      assignedMechanicDoc = await assignRandomAvailableMechanic({
        location: location ? { lat: location.lat, lng: location.lng } : null,
        serviceType: serviceDetails?.serviceType
      });
      if (assignedMechanicDoc) {
        mechanicId = assignedMechanicDoc._id;
      }
    }

    // 2. Compute real road network route & two-wheeler ETA via OSRM
    const originCoords = {
      lat: assignedMechanicDoc?.currentLocation?.lat || 22.9772,
      lng: assignedMechanicDoc?.currentLocation?.lng || 88.4312
    };
    const destCoords = {
      lat: location?.lat || 23.3644,
      lng: location?.lng || 88.3182
    };

    const routeData = await getRoadRoute(originCoords, destCoords);

    // 3. Create unique order with human-readable tracking code
    const orderCode = generateOrderCode();
    const newOrder = await Order.create({
      userId: req.user._id,
      orderCode,
      mechanicId,
      serviceDetails,
      location,
      paymentMethod: paymentMethod || 'cod',
      status: mechanicId ? 'CONFIRMED' : 'PENDING',
      roadDistanceKm: routeData.distanceKm,
      estimatedDurationMin: routeData.durationMinutes,
      routePolyline: routeData.coordinates,
      routingEngine: routeData.source,
      expiresAt: new Date(Date.now() + 600000) // expires in 10 mins
    });

    res.status(201).json(newOrder);
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
    
    // Sanitize query to prevent NoSQL operator injection
    if (typeof status === 'string' && VALID_ORDER_STATUSES.includes(status as any)) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('mechanicId', 'name workshopName specialization serviceCategories vehiclePlate phone rating currentLocation')
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

      const location = o.location || {
        address: o.address || 'Kalyani, West Bengal',
        lat: 22.9772,
        lng: 88.4312
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

router.get('/:id', optionalAuth, async (req: any, res: any, next) => {
  try {
    const { id } = req.params;
    
    // Support lookup by either MongoDB ObjectId or human-readable orderCode (e.g. FOR-XXXXXX)
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { orderCode: id.toUpperCase() };

    let booking = await Order.findOne(query).populate('mechanicId');
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found' } });
    }

    // If routePolyline is missing on existing order, dynamically compute & backfill it
    if (!booking.routePolyline || booking.routePolyline.length === 0) {
      const mechLocation = (booking.mechanicId as any)?.currentLocation || { lat: 22.975, lng: 88.434 };
      const destLocation = booking.location || { lat: 23.361, lng: 88.318 };
      const routeData = await getRoadRoute(
        { lat: mechLocation.lat || 22.975, lng: mechLocation.lng || 88.434 },
        { lat: destLocation.lat || 23.361, lng: destLocation.lng || 88.318 }
      );
      booking.roadDistanceKm = routeData.distanceKm;
      booking.estimatedDurationMin = routeData.durationMinutes;
      booking.routePolyline = routeData.coordinates;
      booking.routingEngine = routeData.source;
      if (!booking.orderCode) {
        booking.orderCode = generateOrderCode();
      }
      await booking.save();
    }

    const bookingData = booking.toObject ? booking.toObject() : { ...booking };
    bookingData.trackingCode = booking.orderCode || `FOR-${booking._id.toString().slice(0, 8).toUpperCase()}`;
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
