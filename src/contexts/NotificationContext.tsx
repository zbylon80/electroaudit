import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration: number = 3000) => {
      setNotification({ message, type, duration });
      setVisible(true);
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, duration: number = 3000) => {
      showNotification(message, 'success', duration);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, duration: number = 4000) => {
      showNotification(message, 'error', duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration: number = 3000) => {
      showNotification(message, 'info', duration);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration: number = 3500) => {
      showNotification(message, 'warning', duration);
    },
    [showNotification]
  );

  const onDismiss = () => setVisible(false);

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
      default:
        return '#2196f3';
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={notification.duration}
        style={[styles.snackbar, { backgroundColor: getBackgroundColor() }]}
        action={{
          label: 'Zamknij',
          onPress: onDismiss,
          textColor: '#fff',
        }}
      >
        {notification.message}
      </Snackbar>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 20,
  },
});
