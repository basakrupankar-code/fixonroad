import { describe, it, expect } from 'vitest';

describe('Pricing Math', () => {
  it('should correctly calculate GST (18%) and total amount including platform fee', () => {
    const basePrice = 150;
    const gst = basePrice * 0.18;
    const platformFee = 50;
    
    expect(gst).toBe(27);
    expect(basePrice + gst + platformFee).toBe(227);
  });

  it('should handle edge case rounding correctly', () => {
    const basePrice = 199.99;
    const gst = basePrice * 0.18;
    const platformFee = 50;
    const totalAmount = basePrice + gst + platformFee;
    
    expect(totalAmount).toBeCloseTo(285.9882, 4);
  });
});
