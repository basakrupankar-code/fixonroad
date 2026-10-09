import { Router } from 'express';
import { User } from '../models/User';
import { Mechanic } from '../models/Mechanic';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

const PasswordSchema = z.object({
  password: z.string(),
  email: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password.length < 12) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must contain at least 12 characters', path: ['password'] });
  }
  if (!/[a-z]/.test(data.password) || !/[A-Z]/.test(data.password)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must contain both lower and upper case letters', path: ['password'] });
  }
  if (!/[0-9]/.test(data.password) && !/[^A-Za-z0-9]/.test(data.password)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must contain at least one number or symbol', path: ['password'] });
  }
  if (data.email && data.password.toLowerCase().includes(data.email.split('@')[0].toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must not contain your email address', path: ['password'] });
  }
  const COMMON_PASSWORDS = [
    'password', 'password123', '123456', '12345678', '123456789', 
    '1234567890', 'qwerty', 'qwertyuiop', 'admin', 'admin123'
  ];
  if (COMMON_PASSWORDS.some(cp => data.password.toLowerCase().includes(cp))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password is commonly used', path: ['password'] });
  }
});

const router = Router();

// Secure all /me routes
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    
    const responseData: any = {
      id: user._id, 
      phone: user.phone, 
      name: user.name, 
      role: user.role, 
      email: user.email,
    };

    if (user.role === 'mechanic') {
      responseData.workshopName = (user as any).workshopName;
      responseData.serviceCategories = (user as any).serviceCategories;
      responseData.isAvailable = (user as any).isAvailable;
      responseData.rating = (user as any).rating;
      responseData.currentLocation = (user as any).currentLocation;
    } else {
      responseData.savedLocations = (user as any).savedLocations;
      responseData.activeOrderId = (user as any).activeOrderId;
    }

    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    // Prepare update data based on role
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;

    if (req.user?.role === 'mechanic') {
      if (req.body.workshopName !== undefined) updateData.workshopName = req.body.workshopName;
      if (req.body.isAvailable !== undefined) updateData.isAvailable = req.body.isAvailable;
      if (req.body.currentLocation !== undefined) updateData.currentLocation = req.body.currentLocation;
    }

    const updated: any = await Model.findByIdAndUpdate(
      req.user?.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/password', async (req, res, next) => {
  try {
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    const { password } = PasswordSchema.parse({ 
      password: req.body.password,
      email: user.email 
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await Model.findByIdAndUpdate(
      req.user?.userId,
      { $set: { password: hashedPassword } },
      { runValidators: true }
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/2fa/status', async (req, res, next) => {
  try {
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    res.json({ isTwoFactorEnabled: user.isTwoFactorEnabled });
  } catch (error) {
    next(error);
  }
});

router.post('/2fa/generate', async (req, res, next) => {
  try {
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'FixOnRoad', secret);

    user.twoFactorSecret = secret;
    await user.save();

    const qrCodeImage = await qrcode.toDataURL(otpauthUrl);
    res.json({ secret, qrCodeImage });
  } catch (error) {
    next(error);
  }
});

router.post('/2fa/verify', async (req, res, next) => {
  try {
    const { code } = req.body;
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: { message: '2FA generation required first' } });
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      return res.status(400).json({ error: { message: 'Invalid 2FA code' } });
    }

    user.isTwoFactorEnabled = true;
    await user.save();

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/2fa/disable', async (req, res, next) => {
  try {
    const Model: any = req.user?.role === 'mechanic' ? Mechanic : User;
    const user: any = await Model.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
});



// Removed legacy /mechanic routes as they are now merged into /

export const meRouter = router;
