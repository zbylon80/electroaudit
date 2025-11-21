/**
 * Script to clear and reseed the database with clean test data
 * Run with: npx ts-node scripts/reseedDatabase.ts
 */

import { initDatabase, clearDatabase } from '../src/services/database';
import { seedDatabase } from '../src/utils/seedData';

const reseedDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    await initDatabase();
    
    console.log('🗑️  Clearing existing data...');
    await clearDatabase();
    
    console.log('🌱 Seeding database with clean test data...');
    await seedDatabase();
    
    console.log('✅ Database reseeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reseeding database:', error);
    process.exit(1);
  }
};

reseedDatabase();
