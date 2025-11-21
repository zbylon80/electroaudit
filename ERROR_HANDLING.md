# Error Handling and Polish Features

This document describes the error handling, loading states, and notification features implemented in the ElectroAudit application.

## Features Implemented

### 1. Error Boundary Component

**Location:** `src/components/common/ErrorBoundary.tsx`

A React Error Boundary that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features:**
- Catches and logs component errors
- Displays user-friendly error message in Polish
- Shows error details for debugging
- Provides "Try Again" button to reset error state
- Prevents entire app crash when component errors occur

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

The Error Boundary is already wrapped around the entire app in `App.tsx`.

### 2. Notification Context (Toast/Snackbar)

**Location:** `src/contexts/NotificationContext.tsx`

A global notification system using React Native Paper's Snackbar component.

**Features:**
- Success notifications (green)
- Error notifications (red)
- Warning notifications (orange)
- Info notifications (blue)
- Auto-dismiss with configurable duration
- Manual dismiss option

**Usage:**
```tsx
import { useNotification } from '../contexts/NotificationContext';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Dane zapisane pomyślnie');
    } catch (error) {
      showError('Nie udało się zapisać danych');
    }
  };
}
```

### 3. Error Handler Utilities

**Location:** `src/utils/errorHandler.ts`

Utility functions and custom error classes for consistent error handling.

**Custom Error Classes:**
- `DatabaseError` - For database operation failures
- `ValidationError` - For validation failures
- `NotFoundError` - For entity not found errors

**Helper Functions:**
- `handleDatabaseOperation()` - Wraps database operations with error handling
- `handleAsyncOperation()` - Wraps async operations with error handling
- `getErrorMessage()` - Extracts user-friendly error messages
- `logError()` - Logs errors with context

**Usage:**
```tsx
import { handleDatabaseOperation, getErrorMessage } from '../utils/errorHandler';

try {
  const result = await handleDatabaseOperation(
    () => database.query('SELECT * FROM clients'),
    'Nie udało się pobrać klientów'
  );
} catch (error) {
  showError(getErrorMessage(error));
}
```

### 4. Loading States

All form screens now include:
- Initial loading state when fetching existing data
- Submit loading state during save operations
- Loading indicators (ActivityIndicator)
- Disabled buttons during loading

**Screens with loading states:**
- ClientFormScreen
- OrderFormScreen
- OrdersScreen
- ClientsScreen
- All other form screens

### 5. Form Validation Error Display

All forms display validation errors inline:
- Required field validation
- Email format validation
- Numeric input validation
- Range validation for measurements
- Real-time validation feedback

### 6. Polish Language Interface

All user-facing messages are in Polish:
- Success messages: "Klient utworzony pomyślnie"
- Error messages: "Nie udało się załadować danych"
- Validation messages: "Proszę wypełnić wszystkie wymagane pola"
- Button labels: "Zapisz", "Anuluj", "Dodaj"
- Form labels: "Nazwa", "Adres", "Telefon", "Email"

## Testing

Error handling utilities are fully tested in `src/utils/errorHandler.test.ts`:
- Custom error class creation
- Database operation error handling
- Async operation error handling
- Error message extraction

Run tests:
```bash
npm test
```

## Implementation Details

### App.tsx Structure

```tsx
<ErrorBoundary>
  <PaperProvider theme={theme}>
    <NotificationProvider>
      <RootNavigator />
    </NotificationProvider>
  </PaperProvider>
</ErrorBoundary>
```

This ensures:
1. Error Boundary catches all component errors
2. PaperProvider provides Material Design components
3. NotificationProvider makes notifications available globally
4. RootNavigator handles all navigation

### Database Error Handling

The database service already includes:
- Try-catch blocks around all operations
- Error logging
- Transaction rollback on failures
- Foreign key constraint handling

### Navigation Error Handling

Screens handle navigation errors by:
- Checking for entity existence before navigation
- Showing error notifications for missing entities
- Navigating back on errors
- Preventing navigation to invalid states

## Best Practices

1. **Always use notification context instead of Alert.alert:**
   ```tsx
   // ❌ Don't use
   Alert.alert('Error', 'Something went wrong');
   
   // ✅ Do use
   showError('Coś poszło nie tak');
   ```

2. **Wrap async operations in try-catch:**
   ```tsx
   const handleSubmit = async () => {
     try {
       setLoading(true);
       await saveData();
       showSuccess('Zapisano pomyślnie');
       navigation.goBack();
     } catch (error) {
       showError(getErrorMessage(error));
     } finally {
       setLoading(false);
     }
   };
   ```

3. **Show loading states during async operations:**
   ```tsx
   <Button
     onPress={handleSubmit}
     loading={loading}
     disabled={loading}
   >
     Zapisz
   </Button>
   ```

4. **Use Polish language for all user-facing text:**
   - Error messages
   - Success messages
   - Button labels
   - Form labels
   - Validation messages

## Requirements Satisfied

This implementation satisfies the following requirements:

- **9.4**: Validation error display - All forms show clear validation errors
- **11.3**: Expo web functionality - App works on Expo web
- **11.4**: Android emulator functionality - App works on Android emulator
- **13.1-13.10**: Polish language interface - All UI text is in Polish

## Future Improvements

Potential enhancements:
1. Add error reporting service (e.g., Sentry)
2. Implement offline error queue
3. Add retry logic for failed operations
4. Implement undo/redo functionality
5. Add more granular error types
6. Implement error analytics
