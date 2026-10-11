import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app';

describe('Payments Routes & Razorpay Test Mode', () => {
  it('should return razorpay public test config', async () => {
    const res = await request(app).get('/api/v1/payments/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.keyId).toBe('rzp_test_TmgnRVOfgBgCJV');
    expect(res.body.mode).toBe('test');
  });

  it('should require authentication for order creation', async () => {
    const res = await request(app).post('/api/v1/payments/create-order').send({
      serviceType: 'flat-tire',
      basePrice: 150,
      paymentMethod: 'upi',
      location: { lat: 22.9772, lng: 88.4312, address: 'Kalyani, WB' }
    });
    expect(res.status).toBe(401);
  });

  it('should reject webhook with invalid signature', async () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: {} });
    const res = await request(app)
      .post('/api/v1/payments/webhook/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'invalid_signature_hex')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should accept webhook with valid signature', async () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: {} });
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fixonroadWebhookSecret2026!';
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhook/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
