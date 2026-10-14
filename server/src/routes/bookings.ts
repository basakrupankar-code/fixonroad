import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Used by Mechanic Portal to fetch their jobs
router.get('/mechanic-jobs', requireAuth, async (req: any, res: any, next) => {
  try {
    const user = req.user;
    if (user.role !== 'mechanic') {
      return res.status(403).json({ error: { message: 'Only mechanics can fetch jobs' } });
    }

    // Get unassigned (PENDING) jobs or jobs assigned to this mechanic
    const jobs = await Order.find({
      $or: [
        { status: 'PENDING' },
        { mechanicId: user._id }
      ]
    }).populate('userId', 'name phone').sort({ createdAt: -1 });

    const formattedJobs = jobs.map((job: any) => ({
      id: job._id,
      type: job.serviceDetails.serviceType,
      customerName: job.userId?.name || 'Unknown',
      location: job.location.address,
      distance: 'Unknown km', // We can calculate this if needed
      price: job.serviceDetails.totalAmount,
      status: job.status,
      time: job.createdAt
    }));

    res.json({ jobs: formattedJobs });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req: any, res: any, next) => {
  try {
    const { mechanicId, serviceDetails, location } = req.body;
    
    const newOrder = await Order.create({
      userId: req.user._id,
      mechanicId,
      serviceDetails,
      location,
      status: 'PENDING',
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
    let query: any = { userId: req.user._id };
    
    // Sanitize query to prevent NoSQL operator injection
    if (typeof status === 'string' && VALID_ORDER_STATUSES.includes(status as any)) {
      query.status = status;
    }
    
    const bookings = await Order.find(query).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req: any, res: any, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: { message: 'Booking not found or invalid ID format' } });
    }

    const booking = await Order.findById(id).populate('mechanicId');
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found' } });
    }

    // BOLA / IDOR Verification: only the booking customer or assigned mechanic can view
    const currentUserId = req.user.userId || req.user._id.toString();
    const isCustomer = booking.userId.toString() === currentUserId;
    const assignedMechId = (booking.mechanicId as any)?._id?.toString() || booking.mechanicId?.toString();
    const isMechanic = assignedMechId === currentUserId;

    if (!isCustomer && !isMechanic && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden. You do not have permission to view this booking.' } });
    }

    res.json(booking);
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
