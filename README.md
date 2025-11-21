# ElectroAudit

Mobile application for electrical measurement technicians to manage inspection orders and generate protocols.

## Project Structure

```
electroaudit/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── services/       # Business logic and database operations
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions and validators
│   ├── navigation/     # Navigation configuration
│   └── constants/      # App constants and enums
├── assets/             # Images and static assets
├── App.tsx            # Root component
└── index.ts           # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI

### Installation

```bash
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on web
npm run web

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Test on physical device using tunnel (useful when on different networks)
npx expo start --tunnel
```

**Note**: When testing on a physical device, you can use the `--tunnel` option if your computer and phone are on different networks. This creates a secure tunnel connection through Expo's servers. You'll need to install the Expo Go app on your device and scan the QR code displayed in the terminal.

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

## Technology Stack

- **Framework**: React Native with Expo SDK
- **Language**: TypeScript (strict mode)
- **Database**: Expo SQLite for local persistence
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **UI Components**: React Native Paper
- **Form Handling**: React Hook Form
- **Testing**: Jest + React Native Testing Library + fast-check (property-based testing)

## Features

- Client management
- Inspection order creation and tracking
- Room and measurement point organization
- Electrical measurement recording
- Visual inspection documentation
- Protocol generation and export
- Offline-first operation with local SQLite database
