/**
 * Format large numbers with suffixes (K, M, B)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with suffix
 */
export function formatNumberCompact(num: number | string | null | undefined, decimals: number = 1): string {
  // Convert to number and validate
  const numValue = typeof num === 'string' ? parseFloat(num) : Number(num);

  if (num === null || num === undefined || isNaN(numValue)) return '0';

  const absNum = Math.abs(numValue);

  if (absNum >= 1_000_000_000) {
    // Billions - use Math.round to avoid .toFixed
    const billions = Math.round(numValue / 1_000_000_000 * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return billions.toString().replace(/\.0$/, '') + 'B';
  } else if (absNum >= 1_000_000) {
    // Millions - use Math.round to avoid .toFixed
    const millions = Math.round(numValue / 1_000_000 * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return millions.toString().replace(/\.0$/, '') + 'M';
  } else if (absNum >= 1_000) {
    // Thousands - use Math.round to avoid .toFixed
    const thousands = Math.round(numValue / 1_000 * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return thousands.toString().replace(/\.0$/, '') + 'K';
  } else {
    // Less than 1000
    return numValue.toLocaleString();
  }
}

/**
 * Format currency with compact notation
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: ₱)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = '₱', decimals: number = 1): string {
  // Convert to number and validate
  const numValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (amount === null || amount === undefined || isNaN(numValue)) return `${currency}0`;

  const absAmount = Math.abs(numValue);

  // For small amounts, show full number
  if (absAmount < 10_000) {
    return `${currency}${numValue.toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  }

  // For large amounts, use compact notation
  return `${currency}${formatNumberCompact(numValue, decimals)}`;
}

/**
 * Format number with full locale string (for tooltips/details)
 * @param num - The number to format
 * @returns Formatted string with commas
 */
export function formatNumberFull(num: number | string | null | undefined): string {
  // Convert to number and validate
  const numValue = typeof num === 'string' ? parseFloat(num) : Number(num);

  if (num === null || num === undefined || isNaN(numValue)) return '0';
  return numValue.toLocaleString('en-PH');
}

/**
 * Format currency with full amount (for tooltips/details)
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: ₱)
 * @returns Formatted currency string
 */
export function formatCurrencyFull(amount: number | string | null | undefined, currency: string = '₱'): string {
  // Convert to number and validate
  const numValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (amount === null || amount === undefined || isNaN(numValue)) return `${currency}0`;
  return `${currency}${formatNumberFull(numValue)}`;
}
