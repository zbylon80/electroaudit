import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// UUID generation utility
export const generateUUID = (): string => {
  return uuidv4();
};

// Boolean conversion utilities for SQLite
export const boolToInt = (value: boolean): number => {
  return value ? 1 : 0;
};

export const intToBool = (value: number): boolean => {
  return value === 1;
};

// Export all validators
export * from './validators';

// Export seed data utility
export { seedDatabase } from './seedData';
