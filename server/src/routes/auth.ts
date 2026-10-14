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
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(16, 'You must be at least 16 years old').optional(),
  city: z.string().min(2, 'City is required'),
  acceptedCookies: z.boolean().refine(val => val === true, 'You must accept cookies'),
  role: z.enum(['customer', 'mechanic']),
  workshopName: z.string().optional(),
  serviceRadius: z.union([z.number(), z.string().transform(v => parseFloat(v) || 10)]).optional(),
  specialization: z.string().optional(),
  vehiclePlate: z.string().optional(),
  upiId: z.string().optional()
});

const generateSession = async (userId: any, role: 'customer' | 'mechanic', res: any) => {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const expiresAt = new Date(Date.now() + maxAgeMs);

  await Session.create({
    userId,
    role,
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

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').transform(e => e.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required')
});

// 1. Register endpoint
router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase().trim();

    const Model: any = data.role === 'mechanic' ? Mechanic : User;

    const existingFilter: any[] = [{ email: normalizedEmail }];
    if (data.phone) {
      existingFilter.push({ phone: data.phone });
    }

    const existingUser = await Model.findOne({ $or: existingFilter });

    if (existingUser) {
      return res.status(400).json({ error: { code: 'USER_EXISTS', message: 'An account with this email or phone already exists' } });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await Model.create({
      ...data,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await generateSession(user._id, user.role, res);

    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
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
    const { email, password } = LoginSchema.parse(req.body);

    let user: any = await User.findOne({ email });
    let isMechanic = false;

    if (!user) {
      user = await Mechanic.findOne({ email });
      if (user) isMechanic = true;
    }

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

    await generateSession(user._id, user.role, res);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
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

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: { code: 'NO_TOKEN', message: 'No ID token provided' } });
    }

    let decodedEmail: string | undefined;
    let decodedName: string | undefined;

    // 1. Attempt verification via Firebase Admin SDK
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      decodedEmail = decoded.email;
      decodedName = decoded.name;
    } catch (adminErr: any) {
      // 2. Fallback verification via Google's OAuth2 tokeninfo endpoint
      // (ensures verification succeeds even if Firebase Admin service account key is not present)
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (tokenRes.ok) {
          const tokenInfo = await tokenRes.json();
          if (tokenInfo.email && (tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true)) {
            decodedEmail = tokenInfo.email;
            decodedName = tokenInfo.name || tokenInfo.given_name;
          }
        }
      } catch (fetchErr) {
        console.error('Google tokeninfo fallback error:', fetchErr);
      }
    }

    if (!decodedEmail) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Google token' } });
    }

    const normalizedEmail = decodedEmail.toLowerCase().trim();
    const effectiveRole = role === 'mechanic' ? 'mechanic' : 'customer';
    const Model: any = effectiveRole === 'mechanic' ? Mechanic : User;

    let user: any = await Model.findOne({ email: normalizedEmail });

    if (!user) {
      try {
        if (effectiveRole === 'mechanic') {
          user = await Mechanic.create({
            email: normalizedEmail,
            name: decodedName || 'Mechanic Partner',
            role: 'mechanic',
            workshopName: `${decodedName || 'Partner'}'s Auto Garage`,
            serviceCategories: ['General Service', 'Flat Tyre', 'Battery Jumpstart'],
            specialization: 'Multi-Brand Specialist',
            serviceRadius: 10,
            isAvailable: true,
            currentLocation: { lat: 22.9772, lng: 88.4312 }
          });
        } else {
          user = await User.create({
            email: normalizedEmail,
            name: decodedName || 'Google User',
            role: 'customer',
          });
        }
      } catch (createErr: any) {
        // Prevent race condition if two concurrent requests create the account at the same time
        if (createErr.code === 11000) {
          user = await Model.findOne({ email: normalizedEmail });
        } else {
          throw createErr;
        }
      }
    } else {
      if (!user.name && decodedName) {
        user.name = decodedName;
        await user.save();
      }
    }

    if (!user) {
      return res.status(500).json({ error: { message: 'Failed to initialize user session' } });
    }

    await generateSession(user._id, user.role, res);

    res.json({
      success: true,
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        role: user.role,
        workshopName: user.workshopName,
      }
    });
  } catch (error: any) {
    console.error('Google login processing error:', error);
    res.status(500).json({ error: { code: 'AUTH_ERROR', message: 'Failed to process Google sign-in' } });
  }
});

export const authRouter = router;
