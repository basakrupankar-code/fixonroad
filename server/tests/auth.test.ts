import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth Middleware', () => {
  it('should return 401 when accessed without a session cookie', async () => {
    const res = await request(app).post('/api/v1/payments/create-order').send({
      serviceType: 'flat-tire',
      basePrice: 150,
      location: { lat: 0, lng: 0, address: 'test' }
    });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Unauthorized. Please log in.');
  });
});
