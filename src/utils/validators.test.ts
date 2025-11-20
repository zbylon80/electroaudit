import fc from 'fast-check';
import {
  validateNumeric,
  validateRequired,
  validateRange,
  validateEmail,
  validateEnum,
} from './validators';

describe('Validator Property Tests', () => {
  /**
   * Feature: electroaudit-mobile-app, Property 20: Numeric Input Validation
   * Validates: Requirements 9.1
   * 
   * For any numeric measurement field, the validator should accept valid numeric 
   * strings and numbers, and should reject non-numeric input, empty strings, and 
   * special characters.
   */
  test('Property 20: Numeric Input Validation', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.double({ noNaN: true, noDefaultInfinity: true }),
          fc.integer().map(n => n.toString()),
          fc.double({ noNaN: true, noDefaultInfinity: true }).map(n => n.toString())
        ),
        (validNumeric) => {
          // All valid numeric values should pass validation
          const result = validateNumeric(validNumeric);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter(s => {
            const trimmed = s.trim();
            // Reject strings that don't match numeric pattern (including scientific notation)
            return !/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(trimmed) && trimmed !== '';
          }),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('abc'),
          fc.constant('12.34.56'),
          fc.constant('NaN'),
          fc.constant('Infinity'),
          fc.constant('-Infinity')
        ),
        (invalidNumeric) => {
          // All invalid numeric values should fail validation
          const result = validateNumeric(invalidNumeric);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: electroaudit-mobile-app, Property 21: Required Field Validation
   * Validates: Requirements 9.2
   * 
   * For any form with required fields, attempting to submit with any required 
   * field empty should fail validation and prevent submission.
   */
  test('Property 21: Required Field Validation', () => {
    // Test that non-empty values pass validation
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer(),
          fc.float().filter(n => !isNaN(n) && isFinite(n)),
          fc.boolean(),
          fc.array(fc.anything(), { minLength: 1 })
        ),
        (nonEmptyValue) => {
          const result = validateRequired(nonEmptyValue);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    // Test that empty values fail validation
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '), // whitespace only
          fc.constant(null),
          fc.constant(undefined),
          fc.constant([]),
          fc.constant({})
        ),
        (emptyValue) => {
          const result = validateRequired(emptyValue);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: electroaudit-mobile-app, Property 22: Measurement Range Validation
   * Validates: Requirements 9.3
   * 
   * For any measurement value input, the validator should accept values within 
   * reasonable ranges for electrical measurements and should reject values 
   * outside these ranges.
   */
  test('Property 22: Measurement Range Validation', () => {
    // Test resistance range (0-10000Ω)
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true, noDefaultInfinity: true }),
        (validResistance) => {
          const result = validateRange(validResistance, 0, 10000);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -1000, max: -0.01, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 10000.01, max: 100000, noNaN: true, noDefaultInfinity: true })
        ),
        (invalidResistance) => {
          const result = validateRange(invalidResistance, 0, 10000);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    // Test insulation range (0-1000MΩ)
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (validInsulation) => {
          const result = validateRange(validInsulation, 0, 1000);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    // Test RCD time range (0-1000ms)
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (validRcdTime) => {
          const result = validateRange(validRcdTime, 0, 1000);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    // Test that non-numeric values fail range validation
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('abc'),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('')
        ),
        (nonNumeric) => {
          const result = validateRange(nonNumeric, 0, 1000);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Validator Unit Tests', () => {
  describe('validateNumeric', () => {
    it('should accept valid integers', () => {
      expect(validateNumeric(123)).toBe(true);
      expect(validateNumeric('123')).toBe(true);
      expect(validateNumeric(0)).toBe(true);
      expect(validateNumeric('0')).toBe(true);
    });

    it('should accept valid decimals', () => {
      expect(validateNumeric(123.45)).toBe(true);
      expect(validateNumeric('123.45')).toBe(true);
      expect(validateNumeric(0.5)).toBe(true);
    });

    it('should accept negative numbers', () => {
      expect(validateNumeric(-123)).toBe(true);
      expect(validateNumeric('-123.45')).toBe(true);
    });

    it('should reject non-numeric values', () => {
      expect(validateNumeric('abc')).toBe(false);
      expect(validateNumeric('')).toBe(false);
      expect(validateNumeric('   ')).toBe(false);
      expect(validateNumeric(null)).toBe(false);
      expect(validateNumeric(undefined)).toBe(false);
      expect(validateNumeric('12.34.56')).toBe(false);
      expect(validateNumeric('NaN')).toBe(false);
      expect(validateNumeric('Infinity')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty strings', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('  test  ')).toBe(true);
    });

    it('should accept numbers including zero', () => {
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(123)).toBe(true);
      expect(validateRequired(-5)).toBe(true);
    });

    it('should accept booleans', () => {
      expect(validateRequired(true)).toBe(true);
      expect(validateRequired(false)).toBe(true);
    });

    it('should reject empty values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired([])).toBe(false);
      expect(validateRequired({})).toBe(false);
    });
  });

  describe('validateRange', () => {
    it('should accept values within range', () => {
      expect(validateRange(5, 0, 10)).toBe(true);
      expect(validateRange(0, 0, 10)).toBe(true);
      expect(validateRange(10, 0, 10)).toBe(true);
      expect(validateRange('5', 0, 10)).toBe(true);
    });

    it('should reject values outside range', () => {
      expect(validateRange(-1, 0, 10)).toBe(false);
      expect(validateRange(11, 0, 10)).toBe(false);
      expect(validateRange(100, 0, 10)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(validateRange('abc', 0, 10)).toBe(false);
      expect(validateRange(null, 0, 10)).toBe(false);
      expect(validateRange(undefined, 0, 10)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validateEnum', () => {
    const validStatuses = ['draft', 'in_progress', 'done'];
    const validTypes = ['socket', 'lighting', 'rcd', 'earthing', 'lps', 'other'];

    it('should accept values in the enum', () => {
      expect(validateEnum('draft', validStatuses)).toBe(true);
      expect(validateEnum('in_progress', validStatuses)).toBe(true);
      expect(validateEnum('done', validStatuses)).toBe(true);
      expect(validateEnum('socket', validTypes)).toBe(true);
    });

    it('should reject values not in the enum', () => {
      expect(validateEnum('invalid', validStatuses)).toBe(false);
      expect(validateEnum('pending', validStatuses)).toBe(false);
      expect(validateEnum('', validStatuses)).toBe(false);
      expect(validateEnum(null, validStatuses)).toBe(false);
      expect(validateEnum(undefined, validStatuses)).toBe(false);
    });
  });
});
