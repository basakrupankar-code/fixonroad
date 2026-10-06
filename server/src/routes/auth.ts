import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/jwt';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { Mechanic } from '../models/Mechanic';
import { sendEmail } from '../utils/mailer';
import { sendSMS } from '../utils/sms';
import { adminAuth } from '../utils/firebaseAdmin';
import bcrypt from 'bcryptjs';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(16, 'You must be at least 16 years old'),
  city: z.string().min(2, 'City is required'),
  acceptedCookies: z.boolean().refine(val => val === true, 'You must accept cookies'),
  role: z.enum(['customer', 'mechanic'])
});

const RequestOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
});

const VerifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6)
});

// 1. Register endpoint (creates user and sends verification email)
router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const existingUser = await User.findOne({ 
      $or: [{ email: data.email }, { phone: data.phone }, { username: data.username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: { code: 'USER_EXISTS', message: 'Email, phone, or username already exists' } });
    }

    let hashedPassword;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const user = await User.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: false
    });

    // If mechanic, create mechanic record
    if (user.role === 'mechanic') {
      await Mechanic.create({ userId: user._id });
    }

    // Generate Email Verification Token
    const verificationToken = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '1h' });
    const verificationLink = `http://localhost:5000/api/v1/auth/verify-email?token=${verificationToken}`;

    // Send Real Email
    const emailSubject = 'Verify your FixOnRoad Account';
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
        <h2 style="color: #f97316;">FixOnRoad</h2>
        <p>Hi ${user.name},</p>
        <p>Thanks for joining FixOnRoad! Please verify your email address by clicking the button below.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
        </div>
        <p style="font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    
    await sendEmail(user.email, emailSubject, emailHtml);

    res.json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    next(error);
  }
});

// 1.5. Password login endpoint
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

    // Generate JWT
    const token = generateToken({ userId: user._id.toString(), role: user.role });

    // Set secure HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token, 
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        role: user.role 
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. Email verification endpoint
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send('Invalid token');
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.isEmailVerified = true;
    await user.save();

    // Redirect to frontend auth page with verified status
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    res.redirect(`${clientOrigin}/auth?verified=true`);
  } catch (error) {
    res.status(400).send('Verification failed or token expired');
  }
});

// 3. Request OTP (only for verified, existing users)
router.post('/otp/request', async (req, res, next) => {
  try {
    const { phone } = RequestOtpSchema.parse(req.body);
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found. Please register first.' } });
    }
    
    if (!user.isEmailVerified) {
      return res.status(403).json({ error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' } });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Upsert into Otp collection
    await Otp.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send Real SMS
    const smsBody = `Your FixOnRoad verification code is ${otp}. It expires in 5 minutes.`;
    await sendSMS(phone, smsBody);

    res.json({ message: 'OTP sent', expiresInSeconds: 300 });
  } catch (error) {
    next(error);
  }
});

// 4. Verify OTP and login
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, otp } = VerifyOtpSchema.parse(req.body);

    const otpRecord = await Otp.findOne({ phone, otp, expiresAt: { $gt: new Date() } });

    if (!otpRecord) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });
    }

    // Delete OTP after successful use
    await Otp.deleteOne({ phone });

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    // Generate JWT
    const token = generateToken({ userId: user._id.toString(), role: user.role });

    // Set secure HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token, 
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        role: user.role 
      }
    });
  } catch (error) {
    next(error);
  }
});

// 5. Google Auth login / register via Firebase ID Token
router.post('/google-login', async (req, res, next) => {
  try {
    const { idToken, role } = req.body; // role only matters if it's a new user

    if (!idToken) {
      return res.status(400).json({ error: { code: 'NO_TOKEN', message: 'No ID token provided' } });
    }

    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: { code: 'NO_EMAIL', message: 'Google account has no email' } });
    }

    // Find if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user. By default, assign 'customer' if role not provided
      user = await User.create({
        email,
        name: name || 'Google User',
        isEmailVerified: true, // Auto-verified by Google
        role: role === 'mechanic' ? 'mechanic' : 'customer',
        acceptedCookies: true, // We assume they accept cookies if they use Google login
      });

      if (user.role === 'mechanic') {
        await Mechanic.create({ userId: user._id });
      }
    } else {
      // Optionally update the name if it was empty before
      if (!user.name) {
        user.name = name || 'Google User';
        await user.save();
      }
    }

    // Generate JWT
    const token = generateToken({ userId: user._id.toString(), role: user.role });

    // Set secure HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token, 
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        role: user.role 
      }
    });
  } catch (error: any) {
    console.error('Firebase Auth error:', error);
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Google token' } });
  }
});

export const authRouter = router;
