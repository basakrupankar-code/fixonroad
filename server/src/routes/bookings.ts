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

router.get('/', requireAuth, async (req: any, res: any, next) => {
  try {
    const { status, active } = req.query;
    let query: any = { userId: req.user._id };
    if (status) query.status = status;
    
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
      // Mock data bypass for testing with short ID if needed, 
      // or simply return 404 cleanly instead of crashing
      return res.status(404).json({ error: { message: 'Booking not found or invalid ID format' } });
    }

    const booking = await Order.findById(id).populate('mechanicId');
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found' } });
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
    const updatePayload: any = { status };
    
    if (status === 'MECHANIC_ASSIGNED' && req.user.role === 'mechanic') {
      updatePayload.mechanicId = req.user._id;
    }
    
    const booking = await Order.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found' } });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export const bookingsRouter = router;
