import * as fc from 'fast-check';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './database';
import { createOrUpdateResult, getResultByPoint } from './result';
import { ResultInput, PointType } from '../types';
import * as pointService from './point';

// Mock expo-sqlite
jest.mock('expo-sqlite');

// Mock point service
jest.mock('./point', () => ({
  getPoint: jest.fn(),
}));

describe('MeasurementResult Service Property Tests', () => {
  let mockDb: any;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock database with async methods
    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    
    // Mock openDatabaseAsync to return our mock database
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    
    // Initialize database
    await initDatabase();
    
    // Mock getPoint to return a valid measurement point (OTHER type allows all fields)
    (pointService.getPoint as jest.Mock).mockResolvedValue({
      id: '00000000-0000-1000-8000-000000000000',
      inspectionOrderId: '00000000-0000-1000-8000-000000000001',
      label: 'Test Point',
      type: PointType.OTHER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

// Arbitraries (generators) for property-based testing

/**
 * Generator for measurement result data with all measurement fields
 * This generator creates results with various combinations of measurement data
 */
const measurementResultArbitrary = (): fc.Arbitrary<ResultInput> => {
  return fc.record({
    measurementPointId: fc.uuid(),
    // Loop impedance measurements
    loopImpedance: fc.option(fc.float({ min: 0, max: 10000, noNaN: true })),
    loopResultPass: fc.option(fc.boolean()),
    // Insulation measurements
    insulationLn: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
    insulationLpe: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
    insulationNpe: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
    insulationResultPass: fc.option(fc.boolean()),
    // RCD measurements
    rcdType: fc.option(fc.constantFrom('AC', 'A', 'F')),
    rcdRatedCurrent: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
    rcdTime1x: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
    rcdTime5x: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
    rcdResultPass: fc.option(fc.boolean()),
    // PE continuity measurements
    peResistance: fc.option(fc.float({ min: 0, max: 10000, noNaN: true })),
    peResultPass: fc.option(fc.boolean()),
    // Earthing measurements
    earthingResistance: fc.option(fc.float({ min: 0, max: 10000, noNaN: true })),
    earthingResultPass: fc.option(fc.boolean()),
    // Polarity and phase sequence
    polarityOk: fc.option(fc.boolean()),
    phaseSequenceOk: fc.option(fc.boolean()),
    // Breakers check
    breakerCheckOk: fc.option(fc.boolean()),
    // LPS measurements
    lpsEarthingResistance: fc.option(fc.float({ min: 0, max: 10000, noNaN: true })),
    lpsContinuityOk: fc.option(fc.boolean()),
    lpsVisualOk: fc.option(fc.boolean()),
    // Comments
    comments: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
  });
};

// Property Tests

/**
 * Feature: electroaudit-mobile-app, Property 15: Measurement Result Persistence
 * For any measurement result with any combination of measurement fields,
 * creating or updating the result should persist all provided field values
 * in the database.
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11
 */
test('Property 15: Measurement Result Persistence', async () => {
  await fc.assert(
    fc.asyncProperty(measurementResultArbitrary(), async (resultData) => {
      // Mock the insert operation
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
      
      // First, mock getResultByPoint to return null (no existing result)
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      
      // Create result
      const created = await createOrUpdateResult(resultData);
      
      // Mock the query to return the created result
      // Convert boolean values to integers for SQLite storage
      // Helper to convert boolean to int, handling null
      const boolToIntOrNull = (val: boolean | null | undefined) => {
        if (val === null || val === undefined) return null;
        return val ? 1 : 0;
      };
      
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: created.id,
          measurementPointId: resultData.measurementPointId,
          loopImpedance: resultData.loopImpedance ?? null,
          loopResultPass: boolToIntOrNull(resultData.loopResultPass),
          insulationLn: resultData.insulationLn ?? null,
          insulationLpe: resultData.insulationLpe ?? null,
          insulationNpe: resultData.insulationNpe ?? null,
          insulationResultPass: boolToIntOrNull(resultData.insulationResultPass),
          rcdType: resultData.rcdType ?? null,
          rcdRatedCurrent: resultData.rcdRatedCurrent ?? null,
          rcdTime1x: resultData.rcdTime1x ?? null,
          rcdTime5x: resultData.rcdTime5x ?? null,
          rcdResultPass: boolToIntOrNull(resultData.rcdResultPass),
          peResistance: resultData.peResistance ?? null,
          peResultPass: boolToIntOrNull(resultData.peResultPass),
          earthingResistance: resultData.earthingResistance ?? null,
          earthingResultPass: boolToIntOrNull(resultData.earthingResultPass),
          polarityOk: boolToIntOrNull(resultData.polarityOk),
          phaseSequenceOk: boolToIntOrNull(resultData.phaseSequenceOk),
          breakerCheckOk: boolToIntOrNull(resultData.breakerCheckOk),
          lpsEarthingResistance: resultData.lpsEarthingResistance ?? null,
          lpsContinuityOk: boolToIntOrNull(resultData.lpsContinuityOk),
          lpsVisualOk: boolToIntOrNull(resultData.lpsVisualOk),
          comments: resultData.comments ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
      
      // Retrieve result
      const retrieved = await getResultByPoint(resultData.measurementPointId);
      
      // Assertions - all provided fields should be persisted
      expect(retrieved).not.toBeNull();
      expect(retrieved!.measurementPointId).toBe(resultData.measurementPointId);
      
      // Loop impedance
      expect(retrieved!.loopImpedance).toBe(resultData.loopImpedance ?? undefined);
      expect(retrieved!.loopResultPass).toBe(resultData.loopResultPass ?? undefined);
      
      // Insulation
      expect(retrieved!.insulationLn).toBe(resultData.insulationLn ?? undefined);
      expect(retrieved!.insulationLpe).toBe(resultData.insulationLpe ?? undefined);
      expect(retrieved!.insulationNpe).toBe(resultData.insulationNpe ?? undefined);
      expect(retrieved!.insulationResultPass).toBe(resultData.insulationResultPass ?? undefined);
      
      // RCD
      expect(retrieved!.rcdType).toBe(resultData.rcdType ?? undefined);
      expect(retrieved!.rcdRatedCurrent).toBe(resultData.rcdRatedCurrent ?? undefined);
      expect(retrieved!.rcdTime1x).toBe(resultData.rcdTime1x ?? undefined);
      expect(retrieved!.rcdTime5x).toBe(resultData.rcdTime5x ?? undefined);
      expect(retrieved!.rcdResultPass).toBe(resultData.rcdResultPass ?? undefined);
      
      // PE continuity
      expect(retrieved!.peResistance).toBe(resultData.peResistance ?? undefined);
      expect(retrieved!.peResultPass).toBe(resultData.peResultPass ?? undefined);
      
      // Earthing
      expect(retrieved!.earthingResistance).toBe(resultData.earthingResistance ?? undefined);
      expect(retrieved!.earthingResultPass).toBe(resultData.earthingResultPass ?? undefined);
      
      // Polarity and phase sequence
      expect(retrieved!.polarityOk).toBe(resultData.polarityOk ?? undefined);
      expect(retrieved!.phaseSequenceOk).toBe(resultData.phaseSequenceOk ?? undefined);
      
      // Breakers
      expect(retrieved!.breakerCheckOk).toBe(resultData.breakerCheckOk ?? undefined);
      
      // LPS
      expect(retrieved!.lpsEarthingResistance).toBe(resultData.lpsEarthingResistance ?? undefined);
      expect(retrieved!.lpsContinuityOk).toBe(resultData.lpsContinuityOk ?? undefined);
      expect(retrieved!.lpsVisualOk).toBe(resultData.lpsVisualOk ?? undefined);
      
      // Comments
      expect(retrieved!.comments).toBe(resultData.comments ?? undefined);
    }),
    { numRuns: 100 }
  );
});

/**
 * Generator for measurement result with specific fields set to null
 * to test nullable field handling
 */
const measurementResultWithNullFieldsArbitrary = (): fc.Arbitrary<ResultInput> => {
  return fc.record({
    measurementPointId: fc.uuid(),
    // Randomly set some fields to null, some to undefined, some to values
    loopImpedance: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 10000, noNaN: true })
    ),
    loopResultPass: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    insulationLn: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 1000, noNaN: true })
    ),
    insulationLpe: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 1000, noNaN: true })
    ),
    insulationNpe: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 1000, noNaN: true })
    ),
    insulationResultPass: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    rcdType: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.constantFrom('AC', 'A', 'F')
    ),
    rcdRatedCurrent: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 1000, noNaN: true })
    ),
    rcdTime1x: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 1000, noNaN: true })
    ),
    rcdTime5x: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 1000, noNaN: true })
    ),
    rcdResultPass: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    peResistance: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 10000, noNaN: true })
    ),
    peResultPass: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    earthingResistance: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 10000, noNaN: true })
    ),
    earthingResultPass: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    polarityOk: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    phaseSequenceOk: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    breakerCheckOk: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    lpsEarthingResistance: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.float({ min: 0, max: 10000, noNaN: true })
    ),
    lpsContinuityOk: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    lpsVisualOk: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.boolean()
    ),
    comments: fc.oneof(
      fc.constant(null as any),
      fc.constant(undefined),
      fc.string({ minLength: 0, maxLength: 500 })
    ),
  });
};

/**
 * Feature: electroaudit-mobile-app, Property 16: Measurement Result Nullable Fields
 * For any measurement result, fields not applicable to the current measurement
 * scope should be allowed to be null and should be stored as null in the database.
 * Validates: Requirements 5.12
 */
test('Property 16: Measurement Result Nullable Fields', async () => {
  await fc.assert(
    fc.asyncProperty(measurementResultWithNullFieldsArbitrary(), async (resultData) => {
      // Mock the insert operation
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
      
      // First, mock getResultByPoint to return null (no existing result)
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      
      // Create result - should succeed even with null/undefined fields
      const created = await createOrUpdateResult(resultData);
      
      // Mock the query to return the created result
      // Helper to convert boolean to int, handling null
      const boolToIntOrNull = (val: boolean | null | undefined) => {
        if (val === null || val === undefined) return null;
        return val ? 1 : 0;
      };
      
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: created.id,
          measurementPointId: resultData.measurementPointId,
          loopImpedance: resultData.loopImpedance ?? null,
          loopResultPass: boolToIntOrNull(resultData.loopResultPass),
          insulationLn: resultData.insulationLn ?? null,
          insulationLpe: resultData.insulationLpe ?? null,
          insulationNpe: resultData.insulationNpe ?? null,
          insulationResultPass: boolToIntOrNull(resultData.insulationResultPass),
          rcdType: resultData.rcdType ?? null,
          rcdRatedCurrent: resultData.rcdRatedCurrent ?? null,
          rcdTime1x: resultData.rcdTime1x ?? null,
          rcdTime5x: resultData.rcdTime5x ?? null,
          rcdResultPass: boolToIntOrNull(resultData.rcdResultPass),
          peResistance: resultData.peResistance ?? null,
          peResultPass: boolToIntOrNull(resultData.peResultPass),
          earthingResistance: resultData.earthingResistance ?? null,
          earthingResultPass: boolToIntOrNull(resultData.earthingResultPass),
          polarityOk: boolToIntOrNull(resultData.polarityOk),
          phaseSequenceOk: boolToIntOrNull(resultData.phaseSequenceOk),
          breakerCheckOk: boolToIntOrNull(resultData.breakerCheckOk),
          lpsEarthingResistance: resultData.lpsEarthingResistance ?? null,
          lpsContinuityOk: boolToIntOrNull(resultData.lpsContinuityOk),
          lpsVisualOk: boolToIntOrNull(resultData.lpsVisualOk),
          comments: resultData.comments ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
      
      // Retrieve result
      const retrieved = await getResultByPoint(resultData.measurementPointId);
      
      // Assertions - creation should succeed and null/undefined fields should be stored as null
      expect(retrieved).not.toBeNull();
      expect(retrieved!.measurementPointId).toBe(resultData.measurementPointId);
      
      // Helper to check field equality, treating null and undefined as equivalent
      const checkField = (retrievedVal: any, inputVal: any) => {
        if (inputVal === null || inputVal === undefined) {
          expect(retrievedVal).toBeUndefined();
        } else {
          expect(retrievedVal).toBe(inputVal);
        }
      };
      
      // Check all fields
      checkField(retrieved!.loopImpedance, resultData.loopImpedance);
      checkField(retrieved!.loopResultPass, resultData.loopResultPass);
      checkField(retrieved!.insulationLn, resultData.insulationLn);
      checkField(retrieved!.insulationLpe, resultData.insulationLpe);
      checkField(retrieved!.insulationNpe, resultData.insulationNpe);
      checkField(retrieved!.insulationResultPass, resultData.insulationResultPass);
      checkField(retrieved!.rcdType, resultData.rcdType);
      checkField(retrieved!.rcdRatedCurrent, resultData.rcdRatedCurrent);
      checkField(retrieved!.rcdTime1x, resultData.rcdTime1x);
      checkField(retrieved!.rcdTime5x, resultData.rcdTime5x);
      checkField(retrieved!.rcdResultPass, resultData.rcdResultPass);
      checkField(retrieved!.peResistance, resultData.peResistance);
      checkField(retrieved!.peResultPass, resultData.peResultPass);
      checkField(retrieved!.earthingResistance, resultData.earthingResistance);
      checkField(retrieved!.earthingResultPass, resultData.earthingResultPass);
      checkField(retrieved!.polarityOk, resultData.polarityOk);
      checkField(retrieved!.phaseSequenceOk, resultData.phaseSequenceOk);
      checkField(retrieved!.breakerCheckOk, resultData.breakerCheckOk);
      checkField(retrieved!.lpsEarthingResistance, resultData.lpsEarthingResistance);
      checkField(retrieved!.lpsContinuityOk, resultData.lpsContinuityOk);
      checkField(retrieved!.lpsVisualOk, resultData.lpsVisualOk);
      checkField(retrieved!.comments, resultData.comments);
    }),
    { numRuns: 100 }
  );
});

}); // End of describe block
