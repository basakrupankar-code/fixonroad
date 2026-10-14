import crypto from 'crypto';

/**
 * Generates an unambiguous, human-readable unique order code.
 * Format: FOR-XXXXXX (e.g., FOR-8F3A2C)
 * Uses uppercase hexadecimal to avoid confusing ambiguous characters.
 */
export function generateOrderCode(): string {
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `FOR-${randomChars}`;
}
