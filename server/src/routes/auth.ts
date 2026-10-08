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
import { authenticator } from 'otplib';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(16, 'You must be at least 16 years old'),
  city: z.string().min(2, 'City is required'),
  acceptedCookies: z.boolean().refine(val => val === true, 'You must accept cookies'),
  role: z.enum(['customer', 'mechanic'])
}).superRefine((data, ctx) => {
  if (data.password) {
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
    if (COMMON_PASSWORDS.some(cp => data.password!.toLowerCase().includes(cp))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password is commonly used', path: ['password'] });
    }
  }
});

const RequestOtpSchema = z.object({
  identifier: z.string().min(3, 'Email or phone number is required')
});

const VerifyOtpSchema = z.object({
  identifier: z.string(),
  otp: z.string().length(6)
});

const ResetPasswordWithTokenSchema = z.object({
  resetToken: z.string(),
  password: z.string()
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

    if (user.isTwoFactorEnabled) {
      // Generate a temporary token that expires in 5 minutes
      const tempToken = jwt.sign({ pending2FAUserId: user._id.toString() }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ require2FA: true, tempToken });
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
        city: user.city,
        age: user.age,
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    next(error);
  }
});

// 1.6. Verify 2FA token
router.post('/login/2fa', async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ error: { message: 'Token and code are required' } });
    }

    const payload = jwt.verify(tempToken, JWT_SECRET) as { pending2FAUserId: string };
    const user = await User.findById(payload.pending2FAUserId);

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({ error: { message: '2FA setup is incomplete or invalid user' } });
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      return res.status(401).json({ error: { message: 'Invalid authenticator code' } });
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
        city: user.city,
        age: user.age,
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    res.status(401).json({ error: { message: 'Invalid or expired temporary token' } });
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
    const { identifier } = RequestOtpSchema.parse(req.body);
    
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });
    
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found. Please register first.' } });
    }
    
    if (!user.isEmailVerified && user.email === identifier) {
      return res.status(403).json({ error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' } });
    }

    const isEmail = identifier.includes('@');
    
    // Generate 6-digit OTP (Twilio Trial constraint for phone numbers)
    const otp = isEmail 
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '482913';
      
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Upsert into Otp collection
    await Otp.findOneAndUpdate(
      { identifier },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send Email or SMS
    if (isEmail) {
      await sendEmail(identifier, 'FixOnRoad Verification Code', `Your FixOnRoad verification code is ${otp}. It expires in 5 minutes.`);
    } else {
      await sendSMS(identifier, `Your FixOnRoad verification code is ${otp}. It expires in 5 minutes.`);
    }

    res.json({ message: 'OTP sent', expiresInSeconds: 300 });
  } catch (error) {
    next(error);
  }
});

// 4. Verify OTP and login
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { identifier, otp } = VerifyOtpSchema.parse(req.body);

    const otpRecord = await Otp.findOne({ identifier, otp, expiresAt: { $gt: new Date() } });

    if (!otpRecord) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });
    }

    // Delete OTP after successful use
    await Otp.deleteOne({ identifier });

    // Find user
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    if (user.isTwoFactorEnabled) {
      // Generate a temporary token that expires in 5 minutes
      const tempToken = jwt.sign({ pending2FAUserId: user._id.toString() }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ require2FA: true, tempToken });
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
        city: user.city,
        age: user.age,
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled
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

    if (user.isTwoFactorEnabled) {
      // Generate a temporary token that expires in 5 minutes
      const tempToken = jwt.sign({ pending2FAUserId: user._id.toString() }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ require2FA: true, tempToken });
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
        city: user.city,
        age: user.age,
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error: any) {
    console.error('Firebase Auth error:', error);
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Google token' } });
  }
});

// 6. Request OTP for Forgot Password
router.post('/forgot-password/request', async (req, res, next) => {
  try {
    const { identifier } = RequestOtpSchema.parse(req.body);
    
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    const isEmail = identifier.includes('@');
    
    // Generate 6-digit OTP (Twilio Trial constraint for phone numbers)
    const otp = isEmail 
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '482913';
      
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await Otp.findOneAndUpdate(
      { identifier },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    if (isEmail) {
      await sendEmail(identifier, 'FixOnRoad Password Reset', `Your FixOnRoad password reset code is ${otp}. It expires in 5 minutes.`);
    } else {
      await sendSMS(identifier, `Your FixOnRoad verification code is ${otp}. It expires in 5 minutes.`);
    }

    res.json({ message: 'Password reset OTP sent', expiresInSeconds: 300 });
  } catch (error) {
    next(error);
  }
});

// 7. Verify OTP for Password Reset
router.post('/forgot-password/verify', async (req, res, next) => {
  try {
    const { identifier, otp } = VerifyOtpSchema.parse(req.body);

    const otpRecord = await Otp.findOne({ identifier, otp, expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } });
    }

    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    await Otp.deleteOne({ identifier });

    const resetToken = jwt.sign({ resetUserId: user._id.toString() }, JWT_SECRET, { expiresIn: '15m' });

    res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    next(error);
  }
});

// 8. Set New Password and Login
router.post('/forgot-password/reset', async (req, res, next) => {
  try {
    const { resetToken, password } = ResetPasswordWithTokenSchema.parse(req.body);

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET) as { resetUserId: string };
    } catch (e) {
      return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset session. Please request a new OTP.' } });
    }

    const user = await User.findById(payload.resetUserId);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    if (user.email && password.toLowerCase().includes(user.email.split('@')[0].toLowerCase())) {
      return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must not contain your email address' } });
    }

    const COMMON_PASSWORDS = ['password', 'password123', '123456', '12345678', '123456789', '1234567890', 'qwerty', 'qwertyuiop', 'admin', 'admin123'];
    if (COMMON_PASSWORDS.some(cp => password.toLowerCase().includes(cp))) {
      return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password is commonly used' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    if (user.isTwoFactorEnabled) {
      const tempToken = jwt.sign({ pending2FAUserId: user._id.toString() }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ message: 'Password reset successful.', require2FA: true, tempToken });
    }

    const token = generateToken({ userId: user._id.toString(), role: user.role });

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Password reset successful.',
      token, 
      user: { 
        id: user._id, 
        phone: user.phone, 
        name: user.name, 
        email: user.email,
        username: user.username,
        city: user.city,
        age: user.age,
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
