import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { verifyToken } from '../utils/jwt';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id?: any;
        userId: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.session_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }

    const session = await Session.findOne({ sessionToken: token });
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await Session.findByIdAndDelete(session._id);
      }
      return res.status(401).json({ success: false, message: 'Unauthorized. Session expired or invalid.' });
    }

    let user;
    if (session.role === 'mechanic') {
      user = await mongoose.model('Mechanic').findById(session.userId);
    } else {
      user = await User.findById(session.userId);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. User not found.' });
    }

    req.user = {
      _id: user._id,
      userId: user._id.toString(),
      role: session.role || (user as any).role || 'customer'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }
};

export const requireRole = (role: 'customer' | 'mechanic') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: `Requires ${role} role` });
    }
    next();
  };
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.session_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const session = await Session.findOne({ sessionToken: token });
    if (!session || session.expiresAt < new Date()) {
      return next();
    }

    let user;
    if (session.role === 'mechanic') {
      user = await mongoose.model('Mechanic').findById(session.userId);
    } else {
      user = await User.findById(session.userId);
    }

    if (user) {
      req.user = {
        _id: user._id,
        userId: user._id.toString(),
        role: session.role
      };
    }

    next();
  } catch (_error) {
    next();
  }
};

export const verifyCartAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.session_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let userId: string | undefined;
    let role: string | undefined;

    // 1. Try JWT verification first
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        userId = decoded.userId;
        role = decoded.role;
      }
    } catch {
      // Fallback to session check
    }

    // 2. Try DB session lookup if not resolved from JWT
    if (!userId) {
      const session = await Session.findOne({ sessionToken: token });
      if (session && session.expiresAt >= new Date()) {
        userId = session.userId.toString();
        role = session.role;
      }
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = {
      _id: userId,
      userId,
      role: role || 'customer'
    };

    next();
  } catch (error) {
    console.error('Cart auth middleware error:', error);
    return res.status(401).json({ error: "Authentication required" });
  }
};

export const requireCustomerCartRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: "Forbidden: Only customer accounts can create roadside dispatch carts" });
  }
  next();
};

