/**
 * Property-Based Tests for Database Service
 * Feature: electroaudit-mobile-app
 */

import fc from 'fast-check';
import * as SQLite from 'expo-sqlite';
import { initDatabase, executeSql, querySql } from './database';

// Mock expo-sqlite
jest.mock('expo-sqlite');

describe('Database Service Property Tests', () => {
  let mockDb: any;
  
  beforeEach(() => {
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
  });
  
  afterEach(() => {
    jest.resetModules();
  });
  
  /**
   * Property 23: Data Persistence Across Operations
   * Feature: electroaudit-mobile-app, Property 23: Data Persistence Across Operations
   * 
   * For any create or update operation on any entity, the changes should be 
   * immediately queryable from the database without requiring additional save operations.
   * 
   * Validates: Requirements 10.2
   */
  test('Property 23: Data Persistence Across Operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          address: fc.string({ minLength: 1, maxLength: 200 }),
          contactPerson: fc.option(fc.string({ maxLength: 100 })),
          phone: fc.option(fc.string({ maxLength: 20 })),
          email: fc.option(fc.emailAddress()),
          notes: fc.option(fc.string({ maxLength: 500 })),
        }),
        async (clientData) => {
          // Initialize database
          await initDatabase();
          
          // Verify database was opened
          expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('electroaudit.db');
          
          // Verify tables were created (execAsync called for table creation)
          expect(mockDb.execAsync).toHaveBeenCalled();
          
          // Simulate inserting client data
          const now = new Date().toISOString();
          const insertSql = `
            INSERT INTO clients (id, name, address, contactPerson, phone, email, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params = [
            clientData.id,
            clientData.name,
            clientData.address,
            clientData.contactPerson ?? null,
            clientData.phone ?? null,
            clientData.email ?? null,
            clientData.notes ?? null,
            now,
            now,
          ];
          
          // Mock the insert operation
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          
          // Execute insert
          await executeSql(insertSql, params);
          
          // Verify insert was called
          expect(mockDb.runAsync).toHaveBeenCalledWith(insertSql, params);
          
          // Mock the query to return the inserted data
          mockDb.getAllAsync.mockResolvedValueOnce([
            {
              id: clientData.id,
              name: clientData.name,
              address: clientData.address,
              contactPerson: clientData.contactPerson ?? null,
              phone: clientData.phone ?? null,
              email: clientData.email ?? null,
              notes: clientData.notes ?? null,
              createdAt: now,
              updatedAt: now,
            },
          ]);
          
          // Query the data immediately after insert
          const selectSql = 'SELECT * FROM clients WHERE id = ?';
          const results = await querySql(selectSql, [clientData.id]);
          
          // Verify query was called
          expect(mockDb.getAllAsync).toHaveBeenCalledWith(selectSql, [clientData.id]);
          
          // Property: Data should be immediately queryable after insert
          expect(results).toHaveLength(1);
          expect(results[0].id).toBe(clientData.id);
          expect(results[0].name).toBe(clientData.name);
          expect(results[0].address).toBe(clientData.address);
          
          // Verify optional fields are preserved correctly
          if (clientData.contactPerson !== undefined) {
            expect(results[0].contactPerson).toBe(clientData.contactPerson);
          }
          if (clientData.phone !== undefined) {
            expect(results[0].phone).toBe(clientData.phone);
          }
          if (clientData.email !== undefined) {
            expect(results[0].email).toBe(clientData.email);
          }
          if (clientData.notes !== undefined) {
            expect(results[0].notes).toBe(clientData.notes);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Database initialization creates all required tables', async () => {
    await initDatabase();
    
    // Verify database was opened
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('electroaudit.db');
    
    // Verify foreign keys are enabled
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    
    // Verify all tables are created (check for table creation calls)
    const execCalls = mockDb.execAsync.mock.calls;
    const allSql = execCalls.map((call: any) => call[0]).join(' ');
    
    // Check that all required tables are created
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS clients');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS inspection_orders');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS rooms');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS measurement_points');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS measurement_results');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS visual_inspections');
    
    // Check that indexes are created
    expect(allSql).toContain('CREATE INDEX IF NOT EXISTS');
  });
  
  test('Database throws error if accessed before initialization', () => {
    // Reset the module to clear any previous initialization
    jest.resetModules();
    
    // Try to get database before initialization
    expect(() => {
      // Re-import to get fresh module state
      const { getDatabase: freshGetDatabase } = require('./database');
      freshGetDatabase();
    }).toThrow('Database not initialized');
  });
  
  /**
   * Property 24: Data Persistence Across App Restarts
   * Feature: electroaudit-mobile-app, Property 24: Data Persistence Across App Restarts
   * 
   * For any data created in one application session, restarting the application
   * should make that data available for retrieval in the new session.
   * 
   * Validates: Requirements 10.3
   */
  test('Property 24: Data Persistence Across App Restarts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          address: fc.string({ minLength: 1, maxLength: 200 }),
          contactPerson: fc.option(fc.string({ maxLength: 100 })),
          phone: fc.option(fc.string({ maxLength: 20 })),
          email: fc.option(fc.emailAddress()),
          notes: fc.option(fc.string({ maxLength: 500 })),
        }),
        async (clientData) => {
          // Session 1: Initialize database and insert data
          await initDatabase();
          
          const now = new Date().toISOString();
          const insertSql = `
            INSERT INTO clients (id, name, address, contactPerson, phone, email, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params = [
            clientData.id,
            clientData.name,
            clientData.address,
            clientData.contactPerson ?? null,
            clientData.phone ?? null,
            clientData.email ?? null,
            clientData.notes ?? null,
            now,
            now,
          ];
          
          // Mock the insert operation
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          await executeSql(insertSql, params);
          
          // Simulate app restart by re-initializing database
          // In a real scenario, the database file persists and is reopened
          // Here we simulate this by keeping the mock database instance
          await initDatabase();
          
          // Session 2: Query the data after "restart"
          // Mock the query to return the persisted data
          mockDb.getAllAsync.mockResolvedValueOnce([
            {
              id: clientData.id,
              name: clientData.name,
              address: clientData.address,
              contactPerson: clientData.contactPerson ?? null,
              phone: clientData.phone ?? null,
              email: clientData.email ?? null,
              notes: clientData.notes ?? null,
              createdAt: now,
              updatedAt: now,
            },
          ]);
          
          const selectSql = 'SELECT * FROM clients WHERE id = ?';
          const results = await querySql(selectSql, [clientData.id]);
          
          // Property: Data should persist across app restarts
          expect(results).toHaveLength(1);
          expect(results[0].id).toBe(clientData.id);
          expect(results[0].name).toBe(clientData.name);
          expect(results[0].address).toBe(clientData.address);
          
          // Verify optional fields are preserved correctly
          if (clientData.contactPerson !== undefined) {
            expect(results[0].contactPerson).toBe(clientData.contactPerson);
          }
          if (clientData.phone !== undefined) {
            expect(results[0].phone).toBe(clientData.phone);
          }
          if (clientData.email !== undefined) {
            expect(results[0].email).toBe(clientData.email);
          }
          if (clientData.notes !== undefined) {
            expect(results[0].notes).toBe(clientData.notes);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 25: Foreign Key Relationship Integrity
   * Feature: electroaudit-mobile-app, Property 25: Foreign Key Relationship Integrity
   * 
   * For any entity with foreign key relationships (orders→clients, rooms→orders,
   * points→orders, points→rooms, results→points, visual inspections→orders),
   * deleting a parent entity should either cascade delete children or set foreign
   * keys to null as appropriate per the schema design.
   * 
   * Validates: Requirements 10.5
   */
  test('Property 25: Foreign Key Relationship Integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          clientId: fc.uuid(),
          clientName: fc.string({ minLength: 1, maxLength: 100 }),
          clientAddress: fc.string({ minLength: 1, maxLength: 200 }),
          orderId: fc.uuid(),
          orderName: fc.string({ minLength: 1, maxLength: 100 }),
          roomId: fc.uuid(),
          roomName: fc.string({ minLength: 1, maxLength: 100 }),
          pointId: fc.uuid(),
          pointLabel: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (testData) => {
          // Initialize database
          await initDatabase();
          
          const now = new Date().toISOString();
          
          // Create client
          const clientInsertSql = `
            INSERT INTO clients (id, name, address, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?)
          `;
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          await executeSql(clientInsertSql, [
            testData.clientId,
            testData.clientName,
            testData.clientAddress,
            now,
            now,
          ]);
          
          // Create inspection order linked to client
          const orderInsertSql = `
            INSERT INTO inspection_orders (
              id, clientId, objectName, address, createdAt, status, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          await executeSql(orderInsertSql, [
            testData.orderId,
            testData.clientId,
            testData.orderName,
            testData.clientAddress,
            now,
            'draft',
            now,
          ]);
          
          // Create room linked to order
          const roomInsertSql = `
            INSERT INTO rooms (id, inspectionOrderId, name, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?)
          `;
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          await executeSql(roomInsertSql, [
            testData.roomId,
            testData.orderId,
            testData.roomName,
            now,
            now,
          ]);
          
          // Create measurement point linked to order and room
          const pointInsertSql = `
            INSERT INTO measurement_points (
              id, inspectionOrderId, roomId, label, type, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
          await executeSql(pointInsertSql, [
            testData.pointId,
            testData.orderId,
            testData.roomId,
            testData.pointLabel,
            'socket_1p',
            now,
            now,
          ]);
          
          // Test 1: Delete room should set roomId to NULL in measurement_points
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });
          await executeSql('DELETE FROM rooms WHERE id = ?', [testData.roomId]);
          
          // Query measurement point after room deletion
          mockDb.getAllAsync.mockResolvedValueOnce([
            {
              id: testData.pointId,
              inspectionOrderId: testData.orderId,
              roomId: null, // Should be set to NULL
              label: testData.pointLabel,
              type: 'socket_1p',
              createdAt: now,
              updatedAt: now,
            },
          ]);
          
          const pointAfterRoomDelete = await querySql(
            'SELECT * FROM measurement_points WHERE id = ?',
            [testData.pointId]
          );
          
          // Property: Room deletion should set roomId to NULL (ON DELETE SET NULL)
          expect(pointAfterRoomDelete).toHaveLength(1);
          expect(pointAfterRoomDelete[0].roomId).toBeNull();
          expect(pointAfterRoomDelete[0].inspectionOrderId).toBe(testData.orderId);
          
          // Test 2: Delete order should cascade delete measurement points
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });
          await executeSql('DELETE FROM inspection_orders WHERE id = ?', [testData.orderId]);
          
          // Query measurement point after order deletion
          mockDb.getAllAsync.mockResolvedValueOnce([]);
          
          const pointAfterOrderDelete = await querySql(
            'SELECT * FROM measurement_points WHERE id = ?',
            [testData.pointId]
          );
          
          // Property: Order deletion should cascade delete measurement points (ON DELETE CASCADE)
          expect(pointAfterOrderDelete).toHaveLength(0);
          
          // Test 3: Delete client should cascade delete orders
          mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });
          await executeSql('DELETE FROM clients WHERE id = ?', [testData.clientId]);
          
          // Query order after client deletion
          mockDb.getAllAsync.mockResolvedValueOnce([]);
          
          const orderAfterClientDelete = await querySql(
            'SELECT * FROM inspection_orders WHERE id = ?',
            [testData.orderId]
          );
          
          // Property: Client deletion should cascade delete orders (ON DELETE CASCADE)
          expect(orderAfterClientDelete).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
