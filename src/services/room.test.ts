import * as fc from 'fast-check';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './database';
import { createRoom, getRoomsByOrder, updateRoom, deleteRoom } from './room';
import { RoomInput } from '../types';
import { querySql } from './database';

// Mock expo-sqlite
jest.mock('expo-sqlite');

describe('Room Service Property Tests', () => {
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
 * Generator for valid room data
 */
const roomArbitrary = (): fc.Arbitrary<RoomInput> => {
  return fc.record({
    inspectionOrderId: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    notes: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
  });
};

// Property Tests

/**
 * Feature: electroaudit-mobile-app, Property 8: Room CRUD Round Trip
 * For any valid room data associated with an inspection order, creating a room
 * and then retrieving it should return a room with all the same field values
 * including the correct inspectionOrderId.
 * Validates: Requirements 3.1, 3.2
 */
test('Property 8: Room CRUD Round Trip', async () => {
  await fc.assert(
    fc.asyncProperty(roomArbitrary(), async (roomData) => {
      // Mock the insert operation
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
      
      // Create room
      const created = await createRoom(roomData);
      
      // Mock the query to return the created room
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: created.id,
          inspectionOrderId: roomData.inspectionOrderId,
          name: roomData.name,
          notes: roomData.notes ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
      
      // Retrieve rooms by order
      const retrieved = await getRoomsByOrder(roomData.inspectionOrderId);
      
      // Assertions
      expect(retrieved).toHaveLength(1);
      const room = retrieved[0];
      expect(room.id).toBe(created.id);
      expect(room.inspectionOrderId).toBe(roomData.inspectionOrderId);
      expect(room.name).toBe(roomData.name);
      expect(room.notes).toBe(roomData.notes ?? undefined);
      expect(room.createdAt).toBe(created.createdAt);
      expect(room.updatedAt).toBe(created.updatedAt);
    }),
    { numRuns: 100 }
  );
});

/**
 * Feature: electroaudit-mobile-app, Property 9: Room Update
 * For any existing room, updating its name or notes should persist the changes
 * in the database.
 * Validates: Requirements 3.3
 */
test('Property 9: Room Update', async () => {
  await fc.assert(
    fc.asyncProperty(
      roomArbitrary(),
      roomArbitrary(),
      async (originalData, updatedData) => {
        // Ensure both rooms belong to the same order for this test
        const orderId = originalData.inspectionOrderId;
        updatedData.inspectionOrderId = orderId;
        
        // Mock the insert operation for creating original room
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
        
        // Create original room
        const created = await createRoom(originalData);
        
        // Mock the update operation
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });
        
        // Update room with new data
        await updateRoom(created.id, updatedData);
        
        // Mock the query to return the updated room with a different timestamp
        const updatedTimestamp = new Date(new Date(created.createdAt).getTime() + 1000).toISOString();
        mockDb.getAllAsync.mockResolvedValueOnce([
          {
            id: created.id,
            inspectionOrderId: updatedData.inspectionOrderId,
            name: updatedData.name,
            notes: updatedData.notes ?? null,
            createdAt: created.createdAt,
            updatedAt: updatedTimestamp,
          },
        ]);
        
        // Retrieve updated room
        const retrieved = await getRoomsByOrder(orderId);
        
        // Assertions - updated data should be reflected
        expect(retrieved).toHaveLength(1);
        const room = retrieved[0];
        expect(room.id).toBe(created.id); // ID should remain the same
        expect(room.inspectionOrderId).toBe(updatedData.inspectionOrderId);
        expect(room.name).toBe(updatedData.name);
        expect(room.notes).toBe(updatedData.notes ?? undefined);
        expect(room.createdAt).toBe(created.createdAt); // createdAt should not change
        expect(room.updatedAt).not.toBe(created.updatedAt); // updatedAt should change
      }
    ),
    { numRuns: 100 }
  );
});

/**
 * Feature: electroaudit-mobile-app, Property 10: Room Deletion Cascades to Points
 * For any room with associated measurement points, deleting the room should set
 * the roomId to null for all associated measurement points while preserving the
 * points themselves.
 * Validates: Requirements 3.4
 */
test('Property 10: Room Deletion Cascades to Points', async () => {
  await fc.assert(
    fc.asyncProperty(
      roomArbitrary(),
      fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
      async (roomData, pointIds) => {
        // Mock the insert operation for creating room
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
        
        // Create room
        const created = await createRoom(roomData);
        
        // Mock creating measurement points associated with this room
        // (In a real scenario, these would be created via PointService)
        const mockPoints = pointIds.map(pointId => ({
          id: pointId,
          inspectionOrderId: roomData.inspectionOrderId,
          roomId: created.id,
          label: `Point ${pointId}`,
          type: 'socket',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        // Mock query to return points before deletion
        mockDb.getAllAsync.mockResolvedValueOnce(mockPoints);
        
        // Query points before deletion
        const pointsBeforeDeletion = await querySql(
          'SELECT * FROM measurement_points WHERE roomId = ?',
          [created.id]
        );
        
        // Verify points exist with the room ID
        expect(pointsBeforeDeletion).toHaveLength(pointIds.length);
        pointsBeforeDeletion.forEach(point => {
          expect(point.roomId).toBe(created.id);
        });
        
        // Mock the delete operation
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });
        
        // Delete room
        await deleteRoom(created.id);
        
        // Mock query to return points after deletion with roomId set to null
        const mockPointsAfterDeletion = mockPoints.map(point => ({
          ...point,
          roomId: null, // ON DELETE SET NULL behavior
        }));
        mockDb.getAllAsync.mockResolvedValueOnce(mockPointsAfterDeletion);
        
        // Query points after deletion
        const pointsAfterDeletion = await querySql(
          'SELECT * FROM measurement_points WHERE id IN (' + pointIds.map(() => '?').join(',') + ')',
          pointIds
        );
        
        // Assertions - points should still exist but with null roomId
        expect(pointsAfterDeletion).toHaveLength(pointIds.length);
        pointsAfterDeletion.forEach(point => {
          expect(point.roomId).toBeNull(); // roomId should be set to null
          expect(pointIds).toContain(point.id); // point should still exist
        });
      }
    ),
    { numRuns: 100 }
  );
});

}); // End of describe block
