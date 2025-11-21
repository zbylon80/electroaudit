import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert, ScrollView, FlatList } from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { IconButton, FAB, Dialog, Portal, Paragraph } from 'react-native-paper';
import { RootStackParamList } from '../navigation/types';
import { InspectionOrder, Client, Room, MeasurementPoint, PointType, PointStatus } from '../types';
import { getOrder, deleteOrder } from '../services/order';
import { getClient } from '../services/client';
import { getRoomsByOrder, deleteRoom, createRoom } from '../services/room';
import { getPointsByOrder, getPointStatus } from '../services/point';
import { generateUUID } from '../utils';
import { webGetOrder, webGetClient, webDeleteOrder, webGetRoomsByOrder, webDeleteRoom, webCreateRoom, webGetPointsByOrder, webGetPointStatus, initWebStorage } from '../services/webStorage';
import { EmptyState } from '../components/lists/EmptyState';
import { Button } from '../components/common/Button';
import { Picker, PickerItem } from '../components/common/Picker';

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

// RoomsTab component
const RoomsTab: React.FC = () => {
  const { order, refreshOrder } = useOrderContext();
  const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null);
  const isWeb = Platform.OS === 'web';

  const loadRooms = async () => {
    try {
      setLoading(true);
      let roomsData: Room[] = [];
      
      if (isWeb) {
        initWebStorage();
        roomsData = webGetRoomsByOrder(order.id);
      } else {
        roomsData = await getRoomsByOrder(order.id);
      }
      
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to reload rooms when returning from RoomFormScreen
  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [order.id])
  );

  const handleQuickAdd = async (roomName: string) => {
    try {
      const roomData = {
        inspectionOrderId: order.id,
        name: roomName,
      };

      if (isWeb) {
        initWebStorage();
        const newRoom: Room = {
          id: generateUUID(),
          ...roomData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        webCreateRoom(newRoom);
      } else {
        await createRoom(roomData);
      }
      
      await loadRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      if (isWeb) {
        window.alert('Failed to create room');
      } else {
        Alert.alert('Error', 'Failed to create room');
      }
    }
  };

  const handleAddCustomRoom = () => {
    navigation.navigate('RoomFormScreen', { orderId: order.id });
  };

  const handleEditRoom = (roomId: string) => {
    navigation.navigate('RoomFormScreen', { orderId: order.id, roomId });
  };

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    setRoomToDelete({ id: roomId, name: roomName });
    setDeleteDialogVisible(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      if (isWeb) {
        initWebStorage();
        webDeleteRoom(roomToDelete.id);
      } else {
        await deleteRoom(roomToDelete.id);
      }
      await loadRooms();
      setDeleteDialogVisible(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error('Error deleting room:', error);
      setDeleteDialogVisible(false);
      setRoomToDelete(null);
      
      if (isWeb) {
        window.alert('Failed to delete room');
      } else {
        Alert.alert('Error', 'Failed to delete room');
      }
    }
  };

  const cancelDeleteRoom = () => {
    setDeleteDialogVisible(false);
    setRoomToDelete(null);
  };

  const renderRoomItem = ({ item }: { item: Room }) => (
    <View style={styles.roomItem}>
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        {item.notes && <Text style={styles.roomNotes}>{item.notes}</Text>}
      </View>
      <View style={styles.roomActions}>
        <IconButton
          icon="pencil"
          size={20}
          onPress={() => handleEditRoom(item.id)}
        />
        <IconButton
          icon="delete"
          iconColor="#d32f2f"
          size={20}
          onPress={() => handleDeleteRoom(item.id, item.name)}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.tabContentContainer}>
      <ScrollView style={styles.scrollView}>
        {/* Quick-add buttons */}
        <View style={styles.quickAddContainer}>
          <Text style={styles.quickAddTitle}>Quick Add:</Text>
          <View style={styles.quickAddButtons}>
            <Button
              mode="outlined"
              onPress={() => handleQuickAdd('Room')}
              style={styles.quickAddButton}
            >
              Room
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleQuickAdd('Kitchen')}
              style={styles.quickAddButton}
            >
              Kitchen
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleQuickAdd('Bathroom')}
              style={styles.quickAddButton}
            >
              Bathroom
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleQuickAdd('Hallway')}
              style={styles.quickAddButton}
            >
              Hallway
            </Button>
          </View>
        </View>

        {/* Room list */}
        {rooms.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            message="Add rooms to organize your measurement points"
            actionLabel="Add Custom Room"
            onAction={handleAddCustomRoom}
            icon="plus"
          />
        ) : (
          <FlatList
            data={rooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.roomList}
          />
        )}
      </ScrollView>

      {/* Floating action button for custom room */}
      {rooms.length > 0 && (
        <FAB
          icon="plus"
          label="Add Custom Room"
          style={styles.fab}
          onPress={handleAddCustomRoom}
        />
      )}

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={cancelDeleteRoom}>
          <Dialog.Title>Delete Room</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete "{roomToDelete?.name}"? Measurement points in this room will become unassigned.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="text" onPress={cancelDeleteRoom}>
              Cancel
            </Button>
            <Button mode="text" onPress={confirmDeleteRoom}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const PointsTab: React.FC = () => {
  const { order, refreshOrder } = useOrderContext();
  const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [pointStatuses, setPointStatuses] = useState<Record<string, PointStatus>>({});
  const isWeb = Platform.OS === 'web';

  const loadData = async () => {
    try {
      setLoading(true);
      let pointsData: MeasurementPoint[] = [];
      let roomsData: Room[] = [];
      
      if (isWeb) {
        initWebStorage();
        pointsData = webGetPointsByOrder(order.id);
        roomsData = webGetRoomsByOrder(order.id);
      } else {
        pointsData = await getPointsByOrder(order.id);
        roomsData = await getRoomsByOrder(order.id);
      }
      
      setPoints(pointsData);
      setRooms(roomsData);
      
      // Load status for each point
      const statuses: Record<string, PointStatus> = {};
      for (const point of pointsData) {
        if (isWeb) {
          statuses[point.id] = webGetPointStatus(point.id);
        } else {
          statuses[point.id] = await getPointStatus(point.id);
        }
      }
      setPointStatuses(statuses);
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to reload points when returning from PointFormScreen or MeasurementFormScreen
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [order.id])
  );

  const handleAddPoint = () => {
    navigation.navigate('PointFormScreen', { orderId: order.id });
  };

  const handlePointPress = (pointId: string) => {
    navigation.navigate('MeasurementFormScreen', { orderId: order.id, pointId });
  };

  const getStatusColor = (status: PointStatus): string => {
    switch (status) {
      case PointStatus.UNMEASURED:
        return '#999';
      case PointStatus.OK:
        return '#66BB6A';
      case PointStatus.NOT_OK:
        return '#EF5350';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: PointStatus): string => {
    switch (status) {
      case PointStatus.UNMEASURED:
        return 'Unmeasured';
      case PointStatus.OK:
        return 'OK';
      case PointStatus.NOT_OK:
        return 'NOT OK';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: PointType): string => {
    switch (type) {
      case PointType.SOCKET:
        return 'power-socket';
      case PointType.LIGHTING:
        return 'lightbulb';
      case PointType.RCD:
        return 'electric-switch';
      case PointType.EARTHING:
        return 'earth';
      case PointType.LPS:
        return 'lightning-bolt';
      case PointType.OTHER:
        return 'dots-horizontal';
      default:
        return 'help-circle';
    }
  };

  const getTypeLabel = (type: PointType): string => {
    switch (type) {
      case PointType.SOCKET:
        return 'Socket';
      case PointType.LIGHTING:
        return 'Lighting';
      case PointType.RCD:
        return 'RCD';
      case PointType.EARTHING:
        return 'Earthing';
      case PointType.LPS:
        return 'LPS';
      case PointType.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  // Filter points based on selected room
  const filteredPoints = selectedRoomId === 'all' 
    ? points 
    : selectedRoomId === 'unassigned'
    ? points.filter(p => !p.roomId)
    : points.filter(p => p.roomId === selectedRoomId);

  // Group points by room for display
  const unassignedPoints = points.filter(p => !p.roomId);

  const renderPointItem = ({ item }: { item: MeasurementPoint }) => {
    const status = pointStatuses[item.id] || PointStatus.UNMEASURED;
    const room = item.roomId ? rooms.find(r => r.id === item.roomId) : null;
    
    return (
      <View style={styles.pointItem} onTouchEnd={() => handlePointPress(item.id)}>
        <View style={styles.pointIconContainer}>
          <IconButton
            icon={getTypeIcon(item.type)}
            size={24}
            iconColor="#2196F3"
          />
        </View>
        <View style={styles.pointInfo}>
          <Text style={styles.pointLabel}>{item.label}</Text>
          <View style={styles.pointDetails}>
            <Text style={styles.pointType}>{getTypeLabel(item.type)}</Text>
            {item.circuitSymbol && (
              <>
                <Text style={styles.pointSeparator}>•</Text>
                <Text style={styles.pointCircuit}>{item.circuitSymbol}</Text>
              </>
            )}
            {room && (
              <>
                <Text style={styles.pointSeparator}>•</Text>
                <Text style={styles.pointRoom}>{room.name}</Text>
              </>
            )}
            {!room && item.roomId === undefined && (
              <>
                <Text style={styles.pointSeparator}>•</Text>
                <Text style={styles.pointRoomUnassigned}>Unassigned</Text>
              </>
            )}
          </View>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.pointStatusText}>{getStatusLabel(status)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Prepare room picker items
  const roomPickerItems: PickerItem[] = [
    { label: 'All Rooms', value: 'all' },
    ...rooms.map(room => ({ label: room.name, value: room.id })),
  ];
  
  // Add unassigned option if there are unassigned points
  if (unassignedPoints.length > 0) {
    roomPickerItems.push({ label: 'Unassigned', value: 'unassigned' });
  }

  return (
    <View style={styles.tabContentContainer}>
      {/* Room selector */}
      <View style={styles.roomSelectorContainer}>
        <Picker
          label="Filter by Room"
          value={selectedRoomId}
          items={roomPickerItems}
          onValueChange={setSelectedRoomId}
          style={styles.roomPicker}
        />
      </View>

      {/* Points list */}
      {points.length === 0 ? (
        <EmptyState
          title="No measurement points yet"
          message="Add measurement points to record electrical test results"
          actionLabel="Add Point"
          onAction={handleAddPoint}
          icon="plus"
        />
      ) : filteredPoints.length === 0 ? (
        <View style={styles.emptyFilterContainer}>
          <Text style={styles.emptyFilterText}>No points in this room</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPoints}
          renderItem={renderPointItem}
          keyExtractor={(item) => item.id}
          style={styles.pointsList}
        />
      )}

      {/* Floating action button - only show when there are points */}
      {points.length > 0 && (
        <FAB
          icon="plus"
          label="Add Point"
          style={styles.fab}
          onPress={handleAddPoint}
        />
      )}
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
  const [deleteOrderDialogVisible, setDeleteOrderDialogVisible] = useState(false);
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

  const handleDelete = () => {
    setDeleteOrderDialogVisible(true);
  };

  const confirmDeleteOrder = async () => {
    try {
      if (isWeb) {
        initWebStorage();
        webDeleteOrder(orderId);
      } else {
        await deleteOrder(orderId);
      }
      setDeleteOrderDialogVisible(false);
      navigation.goBack();
    } catch (err) {
      console.error('Error deleting order:', err);
      setDeleteOrderDialogVisible(false);
      
      if (isWeb) {
        window.alert('Failed to delete order');
      } else {
        Alert.alert('Error', 'Failed to delete order');
      }
    }
  };

  const cancelDeleteOrder = () => {
    setDeleteOrderDialogVisible(false);
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

        {/* Delete order confirmation dialog */}
        <Portal>
          <Dialog visible={deleteOrderDialogVisible} onDismiss={cancelDeleteOrder}>
            <Dialog.Title>Delete Order</Dialog.Title>
            <Dialog.Content>
              <Paragraph>
                Are you sure you want to delete this order? This action cannot be undone.
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button mode="text" onPress={cancelDeleteOrder}>
                Cancel
              </Button>
              <Button mode="text" onPress={confirmDeleteOrder}>
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  tabContentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  quickAddContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickAddTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickAddButton: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '48%',
  },
  roomList: {
    flex: 1,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  roomNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  roomActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#2196F3',
  },
  roomSelectorContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  roomPicker: {
    marginVertical: 0,
  },
  pointsList: {
    flex: 1,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  pointIconContainer: {
    marginRight: 8,
  },
  pointInfo: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pointDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointType: {
    fontSize: 14,
    color: '#666',
  },
  pointSeparator: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 6,
  },
  pointCircuit: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  pointRoom: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  pointRoomUnassigned: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  pointStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyFilterText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
