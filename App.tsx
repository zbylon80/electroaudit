import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { initDatabase } from './src/services/database';
import { RootNavigator } from './src/navigation';

// Import web styles for proper scrolling
if (Platform.OS === 'web') {
  require('./web-styles.css');
}

// Custom theme to match the app's color scheme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#FFA726',
  },
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const initialize = async () => {
      try {
        // Skip database initialization on web (SQLite not supported)
        if (isWeb) {
          console.log('Running on web - database features disabled');
          setIsReady(true);
          return;
        }
        
        await initDatabase();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initialize();
  }, [isWeb]);

  if (error) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    );
  }

  if (!isReady) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Initializing database...</Text>
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#cc0000',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 18,
    color: '#ff9900',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  platformText: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
});
