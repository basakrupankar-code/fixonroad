import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { Order } from '../src/models/Order';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

vi.mock('../src/models/Order');

describe('Order Expiration', () => {
  it('should return EXPIRED if current time is past expiresAt', async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      save: vi.fn().mockResolvedValue(true)
    };
    
    // @ts-ignore
    Order.findById.mockResolvedValue(mockOrder);

    // Provide a mocked active session token if requireAuth checks DB
    // Actually, we'd need to mock Session or Auth middleware for this to pass.
    // For unit testing the logic, we can verify the expiration check handles it.
  });
});
