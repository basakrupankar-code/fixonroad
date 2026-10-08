import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Mechanic } from '../models/Mechanic';
import { sendEmail } from '../utils/mailer';
import { adminAuth } from '../utils/firebaseAdmin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(16, 'You must be at least 16 years old'),
  city: z.string().min(2, 'City is required'),
  acceptedCookies: z.boolean().refine(val => val === true, 'You must accept cookies'),
  role: z.enum(['customer', 'mechanic'])
});

const generateSession = async (userId: any, res: any) => {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const expiresAt = new Date(Date.now() + maxAgeMs);

  await Session.create({
    userId,
    sessionToken,
    expiresAt
  });

  res.cookie('session_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: maxAgeMs
  });
};

// 1. Register endpoint
router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const existingUser = await User.findOne({ 
      $or: [{ email: data.email }, { phone: data.phone }, { username: data.username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: { code: 'USER_EXISTS', message: 'Email, phone, or username already exists' } });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: true // For simplicity in this new auth system, auto-verify or handle later
    });

    if (user.role === 'mechanic') {
      await Mechanic.create({ userId: user._id });
    }

    await generateSession(user._id, res);

    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        city: user.city,
        age: user.age,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password are required' } });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    if (!user.password) {
      return res.status(401).json({ error: { message: 'Please log in with Google' } });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    await generateSession(user._id, res);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        city: user.city,
        age: user.age,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Logout endpoint
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.session_token;
    if (token) {
      await Session.findOneAndDelete({ sessionToken: token });
    }

    res.clearCookie('session_token', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' 
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

// 4. Google Auth login
router.post('/google-login', async (req, res, next) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: { code: 'NO_TOKEN', message: 'No ID token provided' } });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: { code: 'NO_EMAIL', message: 'Google account has no email' } });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name: name || 'Google User',
        isEmailVerified: true,
        role: role === 'mechanic' ? 'mechanic' : 'customer',
        acceptedCookies: true,
      });

      if (user.role === 'mechanic') {
        await Mechanic.create({ userId: user._id });
      }
    } else {
      if (!user.name) {
        user.name = name || 'Google User';
        await user.save();
      }
    }

    await generateSession(user._id, res);

    res.json({
      success: true,
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        city: user.city,
        age: user.age,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Firebase Auth error:', error);
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Google token' } });
  }
});

export const authRouter = router;
