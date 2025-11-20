import * as SQLite from 'expo-sqlite';
import { boolToInt, intToBool } from '../utils';

let db: SQLite.SQLiteDatabase | null = null;

// Database initialization
export const initDatabase = async (): Promise<void> => {
  try {
    // Open or create database
    db = await SQLite.openDatabaseAsync('electroaudit.db');
    
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
      type TEXT NOT NULL CHECK(type IN ('socket', 'lighting', 'rcd', 'earthing', 'lps', 'other')),
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
