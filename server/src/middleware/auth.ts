import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { User } from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.session_token;

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
      userId: user._id.toString(),
      role: session.role
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
