import { Router } from 'express';
import { User } from '../models/User';
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
      age: user.age,
      language: user.language,
      isTwoFactorEnabled: user.isTwoFactorEnabled
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { name, email, phone, username, city, age, language } = req.body;
    const parsedAge = age ? Number(age) : undefined;
    const finalPhone = phone ? phone : undefined;
    const finalUsername = username ? username : undefined;
    
    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: { name, email, phone: finalPhone, username: finalUsername, city, age: parsedAge, language } },
      { new: true, runValidators: true }
    );
    res.json({ id: user?._id, name: user?.name, email: user?.email, phone: user?.phone, role: user?.role, username: user?.username, city: user?.city, age: user?.age, language: user?.language });
  } catch (error) {
    next(error);
  }
});

router.patch('/password', async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    const { password } = PasswordSchema.parse({ 
      password: req.body.password,
      email: user.email 
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.findByIdAndUpdate(
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
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    res.json({ isTwoFactorEnabled: user.isTwoFactorEnabled });
  } catch (error) {
    next(error);
  }
});

router.post('/2fa/generate', async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.userId);
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
    const user = await User.findById(req.user?.userId);
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
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out successfully' });
});

import { Mechanic } from '../models/Mechanic';

router.get('/mechanic', async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || user.role !== 'mechanic') {
      return res.status(403).json({ error: { message: 'Only mechanics have a mechanic profile' } });
    }
    const mechanic = await Mechanic.findOne({ userId: user._id });
    if (!mechanic) {
      return res.status(404).json({ error: { message: 'Mechanic profile not found' } });
    }
    res.json(mechanic);
  } catch (error) {
    next(error);
  }
});

router.patch('/mechanic', async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || user.role !== 'mechanic') {
      return res.status(403).json({ error: { message: 'Only mechanics have a mechanic profile' } });
    }
    const { garageName, isOnline, specializations, lat, lng } = req.body;
    
    let updateData: any = {};
    if (garageName !== undefined) updateData.garageName = garageName;
    if (isOnline !== undefined) updateData.isOnline = isOnline;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (lat !== undefined && lng !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      };
      updateData.locationUpdatedAt = new Date();
    }
    
    const mechanic = await Mechanic.findOneAndUpdate(
      { userId: user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    res.json(mechanic);
  } catch (error) {
    next(error);
  }
});

export const meRouter = router;
