/**
 * Validation utilities for form inputs and data validation
 */

/**
 * Validates that a value is a valid numeric input
 * Accepts numbers and numeric strings, rejects non-numeric values
 * @param value - The value to validate
 * @returns true if valid numeric input, false otherwise
 */
export const validateNumeric = (value: any): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // If it's already a number type, check if it's valid
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }

  // Convert to string for validation
  const stringValue = String(value).trim();
  
  if (stringValue === '') {
    return false;
  }

  // Try to parse as number
  const parsed = Number(stringValue);
  
  // Check if parsing was successful and resulted in a finite number
  if (isNaN(parsed) || !isFinite(parsed)) {
    return false;
  }

  // For string inputs, ensure they represent valid numeric format
  // Accept: integers, decimals, negative numbers, scientific notation
  const numericRegex = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
  return numericRegex.test(stringValue);
};

/**
 * Validates that a required field is not empty
 * @param value - The value to validate
 * @returns true if field has a value, false if empty/null/undefined
 */
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  // For strings, check if not empty after trimming
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  // For numbers, accept 0 as valid
  if (typeof value === 'number') {
    return !isNaN(value);
  }

  // For booleans, always valid
  if (typeof value === 'boolean') {
    return true;
  }

  // For arrays, check if not empty
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // For objects, check if not empty
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return false;
};

/**
 * Validates that a numeric value is within a specified range
 * @param value - The value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns true if value is within range, false otherwise
 */
export const validateRange = (value: any, min: number, max: number): boolean => {
  // First check if it's a valid numeric value
  if (!validateNumeric(value)) {
    return false;
  }

  const numValue = Number(value);
  return numValue >= min && numValue <= max;
};

/**
 * Validates email format using a standard email regex
 * @param email - The email string to validate
 * @returns true if valid email format, false otherwise
 */
export const validateEmail = (email: any): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail === '') {
    return false;
  }

  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmedEmail);
};

/**
 * Validates that a value is one of the allowed enum values
 * @param value - The value to validate
 * @param allowedValues - Array of allowed enum values
 * @returns true if value is in the allowed values, false otherwise
 */
export const validateEnum = <T>(value: any, allowedValues: T[]): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  return allowedValues.includes(value as T);
};
