/**
 * Global error handler utilities for database and async operations
 */

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public entityType?: string, public entityId?: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Wraps a database operation with error handling
 */
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operacja bazy danych nie powiodła się'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database operation failed: ${errorMessage}`, error);
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Wraps an async operation with error handling and logging
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operacja nie powiodła się'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Async operation failed: ${errorMessage}`, error);
    
    if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Gets a user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof DatabaseError) {
    return 'Błąd bazy danych. Spróbuj ponownie.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Wystąpił nieoczekiwany błąd';
}

/**
 * Logs an error with context
 */
export function logError(context: string, error: unknown, additionalInfo?: any) {
  console.error(`[${context}]`, error, additionalInfo);
}
