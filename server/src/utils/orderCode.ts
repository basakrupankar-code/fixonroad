import crypto from 'crypto';

/**
 * Generates a cryptographically secure 16-character uppercase alphanumeric tracking code.
 * Format: FOR-XXXXXXXXXXXXXXXX (e.g., FOR-A3E7B891F4C20D6E)
 */
export function generateOrderCode(): string {
  // Generates clean 16-character random hex (8 random bytes = 16 hex characters)
  const rawHex16 = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `FOR-${rawHex16}`;
}
