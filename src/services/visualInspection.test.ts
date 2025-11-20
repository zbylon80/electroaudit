import * as fc from 'fast-check';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './database';
import { createOrUpdateVisualInspection, getVisualInspectionByOrder } from './visualInspection';
import { VisualInspectionInput } from '../types';

// Mock expo-sqlite
jest.mock('expo-sqlite');

describe('VisualInspection Service Property Tests', () => {
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
  });

  // Arbitraries (generators) for property-based testing

  /**
   * Generator for visual inspection data
   * Creates visual inspections with various combinations of required and optional fields
   */
  const visualInspectionArbitrary = (): fc.Arbitrary<VisualInspectionInput> => {
    return fc.record({
      inspectionOrderId: fc.uuid(),
      summary: fc.string({ minLength: 1, maxLength: 1000 }),
      defectsFound: fc.option(fc.string({ minLength: 0, maxLength: 1000 })),
      recommendations: fc.option(fc.string({ minLength: 0, maxLength: 1000 })),
      visualResultPass: fc.option(fc.boolean()),
    });
  };

  // Property Tests

  /**
   * Feature: electroaudit-mobile-app, Property 18: Visual Inspection CRUD Round Trip
   * For any valid visual inspection data associated with an inspection order,
   * creating or updating the visual inspection should persist all fields
   * (summary, defectsFound, recommendations, visualResultPass) in the database
   * and subsequent retrieval should return the same values.
   * Validates: Requirements 6.2, 6.3, 6.4
   */
  test('Property 18: Visual Inspection CRUD Round Trip', async () => {
    await fc.assert(
      fc.asyncProperty(visualInspectionArbitrary(), async (inspectionData) => {
        // Mock the insert operation
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
        
        // First, mock getVisualInspectionByOrder to return null (no existing inspection)
        mockDb.getAllAsync.mockResolvedValueOnce([]);
        
        // Create visual inspection
        const created = await createOrUpdateVisualInspection(inspectionData);
        
        // Mock the query to return the created visual inspection
        // Helper to convert boolean to int, handling null
        const boolToIntOrNull = (val: boolean | null | undefined) => {
          if (val === null || val === undefined) return null;
          return val ? 1 : 0;
        };
        
        mockDb.getAllAsync.mockResolvedValueOnce([
          {
            id: created.id,
            inspectionOrderId: inspectionData.inspectionOrderId,
            summary: inspectionData.summary,
            defectsFound: inspectionData.defectsFound ?? null,
            recommendations: inspectionData.recommendations ?? null,
            visualResultPass: boolToIntOrNull(inspectionData.visualResultPass),
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          },
        ]);
        
        // Retrieve visual inspection
        const retrieved = await getVisualInspectionByOrder(inspectionData.inspectionOrderId);
        
        // Assertions - all provided fields should be persisted
        expect(retrieved).not.toBeNull();
        expect(retrieved!.inspectionOrderId).toBe(inspectionData.inspectionOrderId);
        expect(retrieved!.summary).toBe(inspectionData.summary);
        expect(retrieved!.defectsFound).toBe(inspectionData.defectsFound ?? undefined);
        expect(retrieved!.recommendations).toBe(inspectionData.recommendations ?? undefined);
        expect(retrieved!.visualResultPass).toBe(inspectionData.visualResultPass ?? undefined);
        
        // Verify timestamps are set
        expect(retrieved!.createdAt).toBeDefined();
        expect(retrieved!.updatedAt).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test UPSERT behavior - updating an existing visual inspection
   */
  test('Property 18 (Update): Visual Inspection UPSERT behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        visualInspectionArbitrary(),
        visualInspectionArbitrary(),
        async (initialData, updateData) => {
          // Ensure both inspections are for the same order
          const orderId = initialData.inspectionOrderId;
          updateData.inspectionOrderId = orderId;
          
          // Mock the first insert operation
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          
          // First, mock getVisualInspectionByOrder to return null (no existing inspection)
          mockDb.getAllAsync.mockResolvedValueOnce([]);
          
          // Create initial visual inspection
          const initial = await createOrUpdateVisualInspection(initialData);
          
          // Helper to convert boolean to int, handling null
          const boolToIntOrNull = (val: boolean | null | undefined) => {
            if (val === null || val === undefined) return null;
            return val ? 1 : 0;
          };
          
          // Mock the query to return the initial inspection (for the update check)
          mockDb.getAllAsync.mockResolvedValueOnce([
            {
              id: initial.id,
              inspectionOrderId: initialData.inspectionOrderId,
              summary: initialData.summary,
              defectsFound: initialData.defectsFound ?? null,
              recommendations: initialData.recommendations ?? null,
              visualResultPass: boolToIntOrNull(initialData.visualResultPass),
              createdAt: initial.createdAt,
              updatedAt: initial.updatedAt,
            },
          ]);
          
          // Mock the update operation
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          
          // Update the visual inspection with new data
          const updated = await createOrUpdateVisualInspection(updateData);
          
          // Mock the query to return the updated inspection
          mockDb.getAllAsync.mockResolvedValueOnce([
            {
              id: updated.id,
              inspectionOrderId: updateData.inspectionOrderId,
              summary: updateData.summary,
              defectsFound: updateData.defectsFound ?? null,
              recommendations: updateData.recommendations ?? null,
              visualResultPass: boolToIntOrNull(updateData.visualResultPass),
              createdAt: updated.createdAt,
              updatedAt: updated.updatedAt,
            },
          ]);
          
          // Retrieve the updated visual inspection
          const retrieved = await getVisualInspectionByOrder(orderId);
          
          // Assertions - should have the updated data
          expect(retrieved).not.toBeNull();
          expect(retrieved!.inspectionOrderId).toBe(orderId);
          expect(retrieved!.summary).toBe(updateData.summary);
          expect(retrieved!.defectsFound).toBe(updateData.defectsFound ?? undefined);
          expect(retrieved!.recommendations).toBe(updateData.recommendations ?? undefined);
          expect(retrieved!.visualResultPass).toBe(updateData.visualResultPass ?? undefined);
          
          // The ID should remain the same (UPSERT, not new record)
          expect(retrieved!.id).toBe(initial.id);
          
          // createdAt should remain the same, updatedAt should be newer
          expect(retrieved!.createdAt).toBe(initial.createdAt);
        }
      ),
      { numRuns: 100 }
    );
  });

}); // End of describe block
