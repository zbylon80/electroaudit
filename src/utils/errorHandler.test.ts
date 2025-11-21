import {
  DatabaseError,
  ValidationError,
  NotFoundError,
  handleDatabaseOperation,
  handleAsyncOperation,
  getErrorMessage,
} from './errorHandler';

describe('Error Handler Utilities', () => {
  describe('Custom Error Classes', () => {
    it('should create DatabaseError with message and original error', () => {
      const originalError = new Error('Original error');
      const dbError = new DatabaseError('Database failed', originalError);
      
      expect(dbError.name).toBe('DatabaseError');
      expect(dbError.message).toBe('Database failed');
      expect(dbError.originalError).toBe(originalError);
    });

    it('should create ValidationError with message and field', () => {
      const validationError = new ValidationError('Invalid email', 'email');
      
      expect(validationError.name).toBe('ValidationError');
      expect(validationError.message).toBe('Invalid email');
      expect(validationError.field).toBe('email');
    });

    it('should create NotFoundError with message and entity info', () => {
      const notFoundError = new NotFoundError('Client not found', 'Client', '123');
      
      expect(notFoundError.name).toBe('NotFoundError');
      expect(notFoundError.message).toBe('Client not found');
      expect(notFoundError.entityType).toBe('Client');
      expect(notFoundError.entityId).toBe('123');
    });
  });

  describe('handleDatabaseOperation', () => {
    it('should return result on successful operation', async () => {
      const operation = async () => 'success';
      const result = await handleDatabaseOperation(operation);
      
      expect(result).toBe('success');
    });

    it('should throw DatabaseError on failure', async () => {
      const operation = async () => {
        throw new Error('DB error');
      };
      
      await expect(handleDatabaseOperation(operation, 'Custom error message'))
        .rejects
        .toThrow(DatabaseError);
    });
  });

  describe('handleAsyncOperation', () => {
    it('should return result on successful operation', async () => {
      const operation = async () => ({ data: 'test' });
      const result = await handleAsyncOperation(operation);
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should rethrow custom errors', async () => {
      const validationError = new ValidationError('Invalid input');
      const operation = async () => {
        throw validationError;
      };
      
      await expect(handleAsyncOperation(operation))
        .rejects
        .toThrow(ValidationError);
    });

    it('should wrap generic errors', async () => {
      const operation = async () => {
        throw new Error('Generic error');
      };
      
      await expect(handleAsyncOperation(operation, 'Operation failed'))
        .rejects
        .toThrow('Operation failed');
    });
  });

  describe('getErrorMessage', () => {
    it('should return ValidationError message', () => {
      const error = new ValidationError('Invalid email');
      expect(getErrorMessage(error)).toBe('Invalid email');
    });

    it('should return NotFoundError message', () => {
      const error = new NotFoundError('Client not found');
      expect(getErrorMessage(error)).toBe('Client not found');
    });

    it('should return generic message for DatabaseError', () => {
      const error = new DatabaseError('DB failed');
      expect(getErrorMessage(error)).toBe('Błąd bazy danych. Spróbuj ponownie.');
    });

    it('should return Error message for generic Error', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return default message for unknown error', () => {
      const error = 'string error';
      expect(getErrorMessage(error)).toBe('Wystąpił nieoczekiwany błąd');
    });
  });
});
