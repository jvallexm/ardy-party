/**
 * Formats a numeric bonus value for display.
 *
 * Positive numbers are prefixed with '+' so they read as explicit bonuses;
 * zero and negative numbers are stringified as-is.
 *
 * @param {number} n - The bonus value to format.
 * @returns {string} The formatted string, e.g. '+3', '-1', or '0'.
 * @example
 * formatBonus(3);  // => '+3'
 * formatBonus(-1); // => '-1'
 * formatBonus(0);  // => '0'
 */
export function formatBonus(n) {
  return n > 0 ? `+${n}` : String(n);
}
