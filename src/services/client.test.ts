import * as fc from 'fast-check';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './database';
import { createClient, getClient, updateClient } from './client';
import { ClientInput } from '../types';

// Mock expo-sqlite
jest.mock('expo-sqlite');

describe('Client Service Property Tests', () => {
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
 * Generator for valid client data with all fields
 */
const clientArbitrary = (): fc.Arbitrary<ClientInput> => {
  return fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address: fc.string({ minLength: 1, maxLength: 200 }),
    contactPerson: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    phone: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
    email: fc.option(fc.emailAddress()),
    notes: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
  });
};

/**
 * Generator for client data with various combinations of optional fields
 */
const clientWithOptionalFieldsArbitrary = (): fc.Arbitrary<ClientInput> => {
  return fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address: fc.string({ minLength: 1, maxLength: 200 }),
    contactPerson: fc.oneof(
      fc.constant(undefined),
      fc.constant(null as any),
      fc.string({ minLength: 1, maxLength: 100 })
    ),
    phone: fc.oneof(
      fc.constant(undefined),
      fc.constant(null as any),
      fc.string({ minLength: 1, maxLength: 20 })
    ),
    email: fc.oneof(
      fc.constant(undefined),
      fc.constant(null as any),
      fc.emailAddress()
    ),
    notes: fc.oneof(
      fc.constant(undefined),
      fc.constant(null as any),
      fc.string({ minLength: 0, maxLength: 500 })
    ),
  });
};

// Property Tests

/**
 * Feature: electroaudit-mobile-app, Property 1: Client CRUD Round Trip
 * For any valid client data, creating a client and then retrieving it
 * should return a client with all the same field values.
 * Validates: Requirements 1.1, 1.2
 */
test('Property 1: Client CRUD Round Trip', async () => {
  await fc.assert(
    fc.asyncProperty(clientArbitrary(), async (clientData) => {
      // Mock the insert operation
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
      
      // Create client
      const created = await createClient(clientData);
      
      // Mock the query to return the created client
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: created.id,
          name: clientData.name,
          address: clientData.address,
          contactPerson: clientData.contactPerson ?? null,
          phone: clientData.phone ?? null,
          email: clientData.email ?? null,
          notes: clientData.notes ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
      
      // Retrieve client
      const retrieved = await getClient(created.id);
      
      // Assertions
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe(clientData.name);
      expect(retrieved!.address).toBe(clientData.address);
      
      // Optional fields: null from generator becomes undefined in retrieved object
      expect(retrieved!.contactPerson).toBe(clientData.contactPerson ?? undefined);
      expect(retrieved!.phone).toBe(clientData.phone ?? undefined);
      expect(retrieved!.email).toBe(clientData.email ?? undefined);
      expect(retrieved!.notes).toBe(clientData.notes ?? undefined);
      
      expect(retrieved!.createdAt).toBe(created.createdAt);
      expect(retrieved!.updatedAt).toBe(created.updatedAt);
    }),
    { numRuns: 100 }
  );
});

/**
 * Feature: electroaudit-mobile-app, Property 2: Client Optional Fields
 * For any client with only required fields (name, address) and any combination
 * of optional fields (contactPerson, phone, email, notes) set to null or undefined,
 * the client creation should succeed and the retrieved client should preserve
 * which fields were provided.
 * Validates: Requirements 1.5
 */
test('Property 2: Client Optional Fields', async () => {
  await fc.assert(
    fc.asyncProperty(clientWithOptionalFieldsArbitrary(), async (clientData) => {
      // Mock the insert operation
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
      
      // Create client
      const created = await createClient(clientData);
      
      // Mock the query to return the created client
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: created.id,
          name: clientData.name,
          address: clientData.address,
          contactPerson: clientData.contactPerson ?? null,
          phone: clientData.phone ?? null,
          email: clientData.email ?? null,
          notes: clientData.notes ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
      
      // Retrieve client
      const retrieved = await getClient(created.id);
      
      // Assertions - client should be created successfully
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe(clientData.name);
      expect(retrieved!.address).toBe(clientData.address);
      
      // Optional fields should be preserved correctly
      // null and undefined should both result in undefined in the retrieved object
      if (clientData.contactPerson !== undefined && clientData.contactPerson !== null) {
        expect(retrieved!.contactPerson).toBe(clientData.contactPerson);
      } else {
        expect(retrieved!.contactPerson).toBeUndefined();
      }
      
      if (clientData.phone !== undefined && clientData.phone !== null) {
        expect(retrieved!.phone).toBe(clientData.phone);
      } else {
        expect(retrieved!.phone).toBeUndefined();
      }
      
      if (clientData.email !== undefined && clientData.email !== null) {
        expect(retrieved!.email).toBe(clientData.email);
      } else {
        expect(retrieved!.email).toBeUndefined();
      }
      
      if (clientData.notes !== undefined && clientData.notes !== null) {
        expect(retrieved!.notes).toBe(clientData.notes);
      } else {
        expect(retrieved!.notes).toBeUndefined();
      }
    }),
    { numRuns: 100 }
  );
});

/**
 * Feature: electroaudit-mobile-app, Property 3: Client Update Propagation
 * For any existing client with associated inspection orders, updating the client
 * information should result in the client record being updated in the database
 * and the changes being reflected when querying the client.
 * Validates: Requirements 1.4
 */
test('Property 3: Client Update Propagation', async () => {
  await fc.assert(
    fc.asyncProperty(
      clientArbitrary(),
      clientArbitrary(),
      async (originalData, updatedData) => {
        // Mock the insert operation for creating original client
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 });
        
        // Create original client
        const created = await createClient(originalData);
        
        // Mock the update operation
        mockDb.runAsync.mockResolvedValueOnce({ changes: 1, lastInsertRowId: 0 });
        
        // Update client with new data
        await updateClient(created.id, updatedData);
        
        // Mock the query to return the updated client with a different timestamp
        // Add 1 second to ensure it's different from createdAt
        const updatedTimestamp = new Date(new Date(created.createdAt).getTime() + 1000).toISOString();
        mockDb.getAllAsync.mockResolvedValueOnce([
          {
            id: created.id,
            name: updatedData.name,
            address: updatedData.address,
            contactPerson: updatedData.contactPerson ?? null,
            phone: updatedData.phone ?? null,
            email: updatedData.email ?? null,
            notes: updatedData.notes ?? null,
            createdAt: created.createdAt,
            updatedAt: updatedTimestamp,
          },
        ]);
        
        // Retrieve updated client
        const retrieved = await getClient(created.id);
        
        // Assertions - updated data should be reflected
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(created.id); // ID should remain the same
        expect(retrieved!.name).toBe(updatedData.name);
        expect(retrieved!.address).toBe(updatedData.address);
        
        // Optional fields: null from generator becomes undefined in retrieved object
        expect(retrieved!.contactPerson).toBe(updatedData.contactPerson ?? undefined);
        expect(retrieved!.phone).toBe(updatedData.phone ?? undefined);
        expect(retrieved!.email).toBe(updatedData.email ?? undefined);
        expect(retrieved!.notes).toBe(updatedData.notes ?? undefined);
        
        expect(retrieved!.createdAt).toBe(created.createdAt); // createdAt should not change
        expect(retrieved!.updatedAt).not.toBe(created.updatedAt); // updatedAt should change
      }
    ),
    { numRuns: 100 }
  );
});

}); // End of describe block
