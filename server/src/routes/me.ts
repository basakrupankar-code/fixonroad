import { Router } from 'express';
import { User } from '../models/User';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Secure all /me routes
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    res.json({ 
      id: user._id, 
      phone: user.phone, 
      name: user.name, 
      role: user.role, 
      email: user.email,
      username: user.username,
      city: user.city,
      age: user.age
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { name, email, username, city, age } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: { name, email, username, city, age } },
      { new: true, runValidators: true }
    );
    res.json({ id: user?._id, name: user?.name, email: user?.email, phone: user?.phone, role: user?.role, username: user?.username, city: user?.city, age: user?.age });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out successfully' });
});

export const meRouter = router;
