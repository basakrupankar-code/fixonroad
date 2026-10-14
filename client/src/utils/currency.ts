/**
 * Safely parses any value (string, number, undefined) into a valid number.
 * Prevents NaN and string-concatenation bugs.
 */
export function parseNumericAmount(value: any): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (typeof value === 'string') {
    // Strip currency symbols, commas, and whitespace
    const clean = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Formats numbers into standardized Indian Rupee currency format (e.g. ₹1,107, ₹1,476, ₹1,25,000).
 * Handles null, undefined, strings, and zero gracefully.
 */
export function formatCurrencyINR(amount: any): string {
  const numeric = parseNumericAmount(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numeric);
}
