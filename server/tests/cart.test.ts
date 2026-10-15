import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { generateToken } from '../src/utils/jwt';
import mongoose from 'mongoose';
import { Cart } from '../src/models/Cart';
import { Order } from '../src/models/Order';

vi.mock('../src/models/Cart');
vi.mock('../src/models/Order');
vi.mock('../src/models/Session');
vi.mock('../src/utils/mechanicAssignment', () => ({
  assignRandomAvailableMechanic: vi.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    name: 'Ramesh Das',
    phone: '9876543210',
    currentLocation: { lat: 22.9750, lng: 88.4340 }
  })
}));
vi.mock('../src/utils/routing', () => ({
  getRoadRoute: vi.fn().mockResolvedValue({
    distanceKm: 3.2,
    durationMinutes: 14,
    coordinates: [[22.9750, 88.4340], [22.9800, 88.4300]],
    source: 'osrm'
  })
}));

describe('Cart Access Control and RBAC (/api/cart)', () => {
  const customerId = new mongoose.Types.ObjectId().toString();
  const mechanicId = new mongoose.Types.ObjectId().toString();

  const customerToken = generateToken({ userId: customerId, role: 'customer' });
  const mechanicToken = generateToken({ userId: mechanicId, role: 'mechanic' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Access (401 Unauthorized)', () => {
    it('GET /api/cart returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('POST /api/cart/add returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .send({ item: { id: 'flat-tire', name: 'Puncture Repair', price: 200 } });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('DELETE /api/cart/item returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .delete('/api/cart/item?id=flat-tire');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('POST /api/cart/checkout returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/cart/checkout')
        .send({ paymentMethod: 'cod' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('returns 401 when providing an invalid or malformed token', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', 'Bearer invalid-token-string');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });
  });

  describe('Unauthorized Role Access (403 Forbidden for Mechanics)', () => {
    it('GET /api/cart denies mechanic and returns 403', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${mechanicToken}`);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden: Only customer accounts can create roadside dispatch carts' });
    });

    it('POST /api/cart/add denies mechanic and returns 403', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send({ item: { id: 'flat-tire', name: 'Puncture Repair', price: 200 } });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden: Only customer accounts can create roadside dispatch carts' });
    });

    it('DELETE /api/cart/item denies mechanic and returns 403', async () => {
      const res = await request(app)
        .delete('/api/cart/item?id=flat-tire')
        .set('Authorization', `Bearer ${mechanicToken}`);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden: Only customer accounts can create roadside dispatch carts' });
    });

    it('POST /api/cart/checkout denies mechanic and returns 403', async () => {
      const res = await request(app)
        .post('/api/cart/checkout')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send({ paymentMethod: 'cod' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden: Only customer accounts can create roadside dispatch carts' });
    });
  });

  describe('Authorized Customer Access (200 / 201 Success)', () => {
    it('GET /api/cart allows customer and returns cart details', async () => {
      const mockCart = {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId,
        items: [{ id: 'battery-jumpstart', name: 'Battery Jumpstart', price: 400, quantity: 1 }],
        breakdownLocation: { lat: 22.9750, lng: 88.4340, address: 'Kalyani' }
      };
      // @ts-ignore
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.baseTotal).toBe(400);
      expect(res.body.cart.platformFee).toBe(10);
      expect(res.body.cart.gst).toBe(72);
      expect(res.body.cart.totalAmount).toBe(482);
    });

    it('POST /api/cart/add adds breakdown item for customer', async () => {
      const mockCart: any = {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId,
        items: [],
        breakdownLocation: null,
        save: vi.fn().mockResolvedValue(true)
      };
      // @ts-ignore
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          item: { id: 'emergency-fuel', name: 'Emergency Fuel Delivery', price: 350, quantity: 2 },
          location: { lat: 22.9750, lng: 88.4340, address: 'Near Highway 34' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.breakdownLocation.address).toBe('Near Highway 34');
      expect(mockCart.save).toHaveBeenCalled();
    });

    it('DELETE /api/cart/item removes an item from customer cart', async () => {
      const mockCart: any = {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId,
        items: [
          { id: 'emergency-fuel', name: 'Emergency Fuel', price: 350 },
          { id: 'flat-tire', name: 'Puncture', price: 200 }
        ],
        save: vi.fn().mockResolvedValue(true)
      };
      // @ts-ignore
      Cart.findOne.mockResolvedValue(mockCart);

      const res = await request(app)
        .delete('/api/cart/item?id=flat-tire')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.items[0].id).toBe('emergency-fuel');
      expect(mockCart.save).toHaveBeenCalled();
    });

    it('POST /api/cart/checkout confirms dispatch and clears cart', async () => {
      const mockCart: any = {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId,
        items: [{ id: 'puncture', name: 'Puncture Repair', price: 250, quantity: 1 }],
        breakdownLocation: { lat: 22.9750, lng: 88.4340, address: 'B-Block Kalyani' },
        save: vi.fn().mockResolvedValue(true)
      };
      // @ts-ignore
      Cart.findOne.mockResolvedValue(mockCart);

      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId,
        status: 'CONFIRMED',
        orderCode: 'FIX-1234',
        serviceDetails: { totalAmount: 305 },
        populate: vi.fn().mockResolvedValue(true)
      };
      // @ts-ignore
      Order.create.mockResolvedValue(mockOrder);
      // @ts-ignore
      Order.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockOrder)
      });

      const res = await request(app)
        .post('/api/cart/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'cod' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockCart.items).toEqual([]);
      expect(mockCart.save).toHaveBeenCalled();
    });
  });
});
