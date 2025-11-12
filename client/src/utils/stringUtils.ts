/**
 * Universal String Utilities for Case-Insensitive Operations
 * Provides platform-wide normalization and comparison functions
 */

/**
 * Normalizes a string for case-insensitive comparison
 * @param value - The string to normalize
 * @returns Normalized string (lowercase, trimmed) or empty string if null/undefined
 */
export const normalizeForComparison = (value: string | null | undefined): string => {
  return (value || '').toLowerCase().trim();
};

/**
 * Case-insensitive string equality comparison
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal (case-insensitive), false otherwise
 */
export const caseInsensitiveEquals = (
  a: string | null | undefined, 
  b: string | null | undefined
): boolean => {
  return normalizeForComparison(a) === normalizeForComparison(b);
};

/**
 * Case-insensitive array find operation
 * @param array - Array to search in
 * @param key - Property key to compare
 * @param value - Value to find
 * @returns Found item or undefined
 */
export const caseInsensitiveFind = <T>(
  array: T[] | undefined, 
  key: keyof T, 
  value: string | null | undefined
): T | undefined => {
  if (!array) return undefined;
  return array.find(item => caseInsensitiveEquals(String(item[key]), value));
};

/**
 * Case-insensitive array filter operation
 * @param array - Array to filter
 * @param key - Property key to compare
 * @param value - Value to match
 * @returns Filtered array
 */
export const caseInsensitiveFilter = <T>(
  array: T[] | undefined, 
  key: keyof T, 
  value: string | null | undefined
): T[] => {
  if (!array) return [];
  return array.filter(item => caseInsensitiveEquals(String(item[key]), value));
};

/**
 * Case-insensitive includes check
 * @param array - Array of strings to search in
 * @param value - Value to find
 * @returns True if array includes the value (case-insensitive)
 */
export const caseInsensitiveIncludes = (
  array: (string | null | undefined)[] | undefined, 
  value: string | null | undefined
): boolean => {
  if (!array) return false;
  const normalizedValue = normalizeForComparison(value);
  return array.some(item => normalizeForComparison(item) === normalizedValue);
};

/**
 * Converts string to proper case for display (First Letter Capitalized)
 * @param value - String to convert
 * @returns String with first letter capitalized
 */
export const toDisplayCase = (value: string | null | undefined): string => {
  const normalized = normalizeForComparison(value);
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

/**
 * Case-insensitive sort function
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Sort comparison result
 */
export const caseInsensitiveSort = (
  a: string | null | undefined, 
  b: string | null | undefined
): number => {
  return normalizeForComparison(a).localeCompare(normalizeForComparison(b));
};