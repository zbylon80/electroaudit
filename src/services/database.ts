import * as SQLite from 'expo-sqlite';
import { boolToInt, intToBool } from '../utils';

let db: SQLite.SQLiteDatabase | null = null;

// Database initialization
export const initDatabase = async (): Promise<void> => {
  try {
    // Open or create database
    db = await SQLite.openDatabaseAsync('electroaudit.db');
    
    // Check if schema needs migration
    const needsMigration = await checkSchemaMigration();
    if (needsMigration) {
      console.log('Schema migration needed - dropping and recreating tables...');
      await dropAllTables();
    }
    
    // Create tables
    await createTables();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Get database instance
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Check if schema migration is needed
const checkSchemaMigration = async (): Promise<boolean> => {
  try {
    const database = getDatabase();
    
    // Try to get the schema for measurement_points table
    const result = await database.getAllAsync(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='measurement_points'"
    );
    
    if (result.length === 0) {
      // Table doesn't exist, no migration needed (fresh install)
      return false;
    }
    
    const schema = (result[0] as any).sql as string;
    
    // Check if the old schema has incorrect CHECK constraint values
    // Old schema had: 'socket', 'lighting', 'rcd', 'earthing', 'lps', 'other'
    // New schema has: 'socket_1p', 'socket_3p', 'lighting', 'rcd', 'earthing', 'lps', 'other'
    if (schema.includes("'socket'") && !schema.includes("'socket_1p'")) {
      console.log('Old schema detected - migration needed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking schema migration:', error);
    // If we can't check, assume migration is needed to be safe
    return true;
  }
};

// Drop all tables (for schema migration)
const dropAllTables = async (): Promise<void> => {
  try {
    const database = getDatabase();
    
    // Disable foreign keys temporarily
    await database.execAsync('PRAGMA foreign_keys = OFF;');
    
    // Drop all tables
    await database.execAsync('DROP TABLE IF EXISTS measurement_results');
    await database.execAsync('DROP TABLE IF EXISTS visual_inspections');
    await database.execAsync('DROP TABLE IF EXISTS measurement_points');
    await database.execAsync('DROP TABLE IF EXISTS rooms');
    await database.execAsync('DROP TABLE IF EXISTS inspection_orders');
    await database.execAsync('DROP TABLE IF EXISTS clients');
    
    // Re-enable foreign keys
    await database.execAsync('PRAGMA foreign_keys = ON;');
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};

// Create all tables with proper foreign keys and constraints
const createTables = async (): Promise<void> => {
  const database = getDatabase();
  
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');
  
  // Create clients table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      contactPerson TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  
  // Create inspection_orders table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inspection_orders (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      objectName TEXT NOT NULL,
      address TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      scheduledDate TEXT,
      status TEXT NOT NULL CHECK(status IN ('draft', 'in_progress', 'done')),
      notes TEXT,
      measureLoopImpedance INTEGER NOT NULL DEFAULT 0,
      measureInsulation INTEGER NOT NULL DEFAULT 0,
      measureRcd INTEGER NOT NULL DEFAULT 0,
      measurePeContinuity INTEGER NOT NULL DEFAULT 0,
      measureEarthing INTEGER NOT NULL DEFAULT 0,
      measurePolarity INTEGER NOT NULL DEFAULT 0,
      measurePhaseSequence INTEGER NOT NULL DEFAULT 0,
      measureBreakersCheck INTEGER NOT NULL DEFAULT 0,
      measureLps INTEGER NOT NULL DEFAULT 0,
      visualInspection INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);
  
  // Create rooms table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      inspectionOrderId TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (inspectionOrderId) REFERENCES inspection_orders(id) ON DELETE CASCADE
    );
  `);
  
  // Create measurement_points table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS measurement_points (
      id TEXT PRIMARY KEY,
      inspectionOrderId TEXT NOT NULL,
      roomId TEXT,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('socket_1p', 'socket_3p', 'lighting', 'rcd', 'earthing', 'lps', 'other')),
      circuitSymbol TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (inspectionOrderId) REFERENCES inspection_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE SET NULL
    );
  `);
  
  // Create measurement_results table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS measurement_results (
      id TEXT PRIMARY KEY,
      measurementPointId TEXT NOT NULL UNIQUE,
      loopImpedance REAL,
      loopResultPass INTEGER,
      insulationLn REAL,
      insulationLpe REAL,
      insulationNpe REAL,
      insulationResultPass INTEGER,
      rcdType TEXT,
      rcdRatedCurrent REAL,
      rcdTime1x REAL,
      rcdTime5x REAL,
      rcdResultPass INTEGER,
      peResistance REAL,
      peResultPass INTEGER,
      earthingResistance REAL,
      earthingResultPass INTEGER,
      polarityOk INTEGER,
      phaseSequenceOk INTEGER,
      breakerCheckOk INTEGER,
      lpsEarthingResistance REAL,
      lpsContinuityOk INTEGER,
      lpsVisualOk INTEGER,
      comments TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (measurementPointId) REFERENCES measurement_points(id) ON DELETE CASCADE
    );
  `);
  
  // Create visual_inspections table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS visual_inspections (
      id TEXT PRIMARY KEY,
      inspectionOrderId TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      defectsFound TEXT,
      recommendations TEXT,
      visualResultPass INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (inspectionOrderId) REFERENCES inspection_orders(id) ON DELETE CASCADE
    );
  `);
  
  // Create indexes for foreign keys and frequently queried fields
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_orders_clientId ON inspection_orders(clientId);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON inspection_orders(status);
    CREATE INDEX IF NOT EXISTS idx_rooms_orderId ON rooms(inspectionOrderId);
    CREATE INDEX IF NOT EXISTS idx_points_orderId ON measurement_points(inspectionOrderId);
    CREATE INDEX IF NOT EXISTS idx_points_roomId ON measurement_points(roomId);
    CREATE INDEX IF NOT EXISTS idx_results_pointId ON measurement_results(measurementPointId);
    CREATE INDEX IF NOT EXISTS idx_visual_orderId ON visual_inspections(inspectionOrderId);
  `);
};

// Helper function to execute SQL with parameters
export const executeSql = async (
  sql: string,
  params: any[] = []
): Promise<any> => {
  const database = getDatabase();
  return await database.runAsync(sql, params);
};

// Helper function to query SQL with parameters
export const querySql = async (
  sql: string,
  params: any[] = []
): Promise<any[]> => {
  const database = getDatabase();
  return await database.getAllAsync(sql, params);
};

// Export helper functions
export { boolToInt, intToBool };

/**
 * Clear all data from the database (useful for testing/resetting)
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    const database = getDatabase();
    
    // Delete all data from tables in reverse order (to respect foreign keys)
    await database.execAsync('DELETE FROM measurement_results');
    await database.execAsync('DELETE FROM visual_inspections');
    await database.execAsync('DELETE FROM measurement_points');
    await database.execAsync('DELETE FROM rooms');
    await database.execAsync('DELETE FROM inspection_orders');
    await database.execAsync('DELETE FROM clients');
    
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
};
