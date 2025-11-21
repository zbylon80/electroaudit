import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { IconButton } from 'react-native-paper';
import { RootStackParamList } from '../navigation/types';
import { InspectionOrder, Client } from '../types';
import { getOrder, deleteOrder } from '../services/order';
import { getClient } from '../services/client';
import { webGetOrder, webGetClient, webDeleteOrder, initWebStorage } from '../services/webStorage';

type OrderDetailsScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetailsScreen'>;
type OrderDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetailsScreen'>;

// Context to share order data across tabs
interface OrderContextData {
  order: InspectionOrder;
  client: Client | null;
  refreshOrder: () => Promise<void>;
}

const OrderContext = createContext<OrderContextData | null>(null);

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within OrderDetailsScreen');
  }
  return context;
};

// Tab navigator
const Tab = createMaterialTopTabNavigator();

// Placeholder tab components (to be implemented in future tasks)
const RoomsTab: React.FC = () => {
  const { order } = useOrderContext();
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Rooms Tab</Text>
      <Text style={styles.tabSubtext}>Order ID: {order.id}</Text>
      <Text style={styles.tabSubtext}>This will be implemented in task 17</Text>
    </View>
  );
};

const PointsTab: React.FC = () => {
  const { order } = useOrderContext();
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Points Tab</Text>
      <Text style={styles.tabSubtext}>Order ID: {order.id}</Text>
      <Text style={styles.tabSubtext}>This will be implemented in task 19</Text>
    </View>
  );
};

const VisualTab: React.FC = () => {
  const { order } = useOrderContext();
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Visual Inspection Tab</Text>
      <Text style={styles.tabSubtext}>Order ID: {order.id}</Text>
      <Text style={styles.tabSubtext}>This will be implemented in task 22</Text>
    </View>
  );
};

const ProtocolTab: React.FC = () => {
  const { order } = useOrderContext();
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Protocol Tab</Text>
      <Text style={styles.tabSubtext}>Order ID: {order.id}</Text>
      <Text style={styles.tabSubtext}>This will be implemented in tasks 23-25</Text>
    </View>
  );
};

export const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsScreenRouteProp>();
  const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<InspectionOrder | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  const loadOrderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let orderData: InspectionOrder | null = null;
      let clientData: Client | null = null;

      if (isWeb) {
        initWebStorage();
        // Load order from web storage
        orderData = webGetOrder(orderId);
        if (!orderData) {
          setError('Order not found');
          return;
        }
        setOrder(orderData);

        // Load client from web storage
        clientData = webGetClient(orderData.clientId);
        setClient(clientData);
      } else {
        // Load order from SQLite
        orderData = await getOrder(orderId);
        if (!orderData) {
          setError('Order not found');
          return;
        }
        setOrder(orderData);

        // Load client from SQLite
        clientData = await getClient(orderData.clientId);
        setClient(clientData);
      }
    } catch (err) {
      console.error('Error loading order data:', err);
      setError('Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isWeb) {
      // Use native confirm dialog on web
      const confirmed = window.confirm(
        'Are you sure you want to delete this order? This action cannot be undone.'
      );
      if (!confirmed) return;

      try {
        initWebStorage();
        webDeleteOrder(orderId);
        navigation.goBack();
      } catch (err) {
        console.error('Error deleting order:', err);
        window.alert('Failed to delete order');
      }
    } else {
      // Use React Native Alert on mobile
      Alert.alert(
        'Delete Order',
        'Are you sure you want to delete this order? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteOrder(orderId);
                navigation.goBack();
              } catch (err) {
                console.error('Error deleting order:', err);
                Alert.alert('Error', 'Failed to delete order');
              }
            },
          },
        ]
      );
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
      </View>
    );
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return '#FFA726';
      case 'in_progress':
        return '#42A5F5';
      case 'done':
        return '#66BB6A';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const contextValue: OrderContextData = {
    order,
    client,
    refreshOrder: loadOrderData,
  };

  return (
    <OrderContext.Provider value={contextValue}>
      <View style={styles.container}>
        {/* Order Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerInfo}>
                <Text style={styles.clientName}>{client?.name || 'Unknown Client'}</Text>
                <Text style={styles.objectName}>{order.objectName}</Text>
              </View>
              <IconButton
                icon="delete"
                iconColor="#d32f2f"
                size={24}
                onPress={handleDelete}
              />
            </View>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) },
                ]}
              >
                <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Navigator */}
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: '#666',
            tabBarIndicatorStyle: {
              backgroundColor: '#2196F3',
              height: 3,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
              textTransform: 'none',
            },
            tabBarStyle: {
              backgroundColor: '#fff',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            },
          }}
        >
          <Tab.Screen name="Rooms" component={RoomsTab} />
          <Tab.Screen name="Points" component={PointsTab} />
          {/* Conditionally show Visual tab only if visualInspection is enabled */}
          {order.visualInspection && (
            <Tab.Screen name="Visual" component={VisualTab} />
          )}
          <Tab.Screen name="Protocol" component={ProtocolTab} />
        </Tab.Navigator>
      </View>
    </OrderContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  objectName: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  tabText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  tabSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
