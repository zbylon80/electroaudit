import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { IconButton, FAB, Dialog, Portal, Paragraph } from 'react-native-paper';
import { RootStackParamList } from '../navigation/types';
import { InspectionOrder, Client, Room, MeasurementPoint, MeasurementResult, PointType, PointStatus } from '../types';
import { getOrder, deleteOrder } from '../services/order';
import { getClient } from '../services/client';
import { getRoomsByOrder, deleteRoom, createRoom } from '../services/room';
import { getPointsByOrder, getPointStatus, deletePoint } from '../services/point';
import { getResultByPoint } from '../services/result';
import { generateUUID } from '../utils';
import { webGetOrder, webGetClient, webDeleteOrder, webGetRoomsByOrder, webDeleteRoom, webCreateRoom, webGetPointsByOrder, webGetPointStatus, webDeletePoint, webGetResultByPoint, initWebStorage } from '../services/webStorage';
import { EmptyState } from '../components/lists/EmptyState';
import { Button } from '../components/common/Button';
import { Picker, PickerItem } from '../components/common/Picker';
import { FormField } from '../components/forms/FormField';
import { Switch } from '../components/common/Switch';

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
  const [pointResults, setPointResults] = useState<Record<string, MeasurementResult | null>>({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<{ id: string; label: string } | null>(null);
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
      
      // Load status and results for each point
      const statuses: Record<string, PointStatus> = {};
      const results: Record<string, MeasurementResult | null> = {};
      for (const point of pointsData) {
        if (isWeb) {
          statuses[point.id] = webGetPointStatus(point.id);
          results[point.id] = webGetResultByPoint(point.id);
        } else {
          statuses[point.id] = await getPointStatus(point.id);
          results[point.id] = await getResultByPoint(point.id);
        }
      }
      setPointStatuses(statuses);
      setPointResults(results);
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
    // Pass roomId if a specific room is selected (not 'all' or 'unassigned')
    const roomIdToPass = selectedRoomId !== 'all' && selectedRoomId !== 'unassigned' ? selectedRoomId : undefined;
    navigation.navigate('PointFormScreen', { orderId: order.id, roomId: roomIdToPass });
  };

  const handlePointPress = (pointId: string) => {
    navigation.navigate('MeasurementFormScreen', { orderId: order.id, pointId });
  };

  const handleEditPoint = (pointId: string) => {
    navigation.navigate('PointFormScreen', { orderId: order.id, pointId });
  };

  const handleDeletePoint = (pointId: string, pointLabel: string) => {
    setPointToDelete({ id: pointId, label: pointLabel });
    setDeleteDialogVisible(true);
  };

  const confirmDeletePoint = async () => {
    if (!pointToDelete) return;

    try {
      if (isWeb) {
        initWebStorage();
        webDeletePoint(pointToDelete.id);
      } else {
        await deletePoint(pointToDelete.id);
      }
      await loadData();
      setDeleteDialogVisible(false);
      setPointToDelete(null);
    } catch (error) {
      console.error('Error deleting point:', error);
      setDeleteDialogVisible(false);
      setPointToDelete(null);
      
      if (isWeb) {
        window.alert('Failed to delete measurement point');
      } else {
        Alert.alert('Error', 'Failed to delete measurement point');
      }
    }
  };

  const cancelDeletePoint = () => {
    setDeleteDialogVisible(false);
    setPointToDelete(null);
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
      case PointType.SOCKET_1P:
      case PointType.SOCKET_3P:
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
      case PointType.SOCKET_1P:
        return 'Socket 1P';
      case PointType.SOCKET_3P:
        return 'Socket 3P';
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
    const result = pointResults[item.id];
    const room = item.roomId ? rooms.find(r => r.id === item.roomId) : null;
    
    return (
      <View style={styles.pointItem}>
        <TouchableOpacity 
          style={styles.pointIconContainer} 
          onPress={() => handlePointPress(item.id)}
          activeOpacity={0.7}
        >
          <IconButton
            icon={getTypeIcon(item.type)}
            size={24}
            iconColor="#2196F3"
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.pointInfo} 
          onPress={() => handlePointPress(item.id)}
          activeOpacity={0.7}
        >
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
          {item.notes && (
            <Text style={styles.pointNotes}>{item.notes}</Text>
          )}
          {result?.comments && (
            <Text style={styles.pointComments}>💬 {result.comments}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} 
          onPress={() => handlePointPress(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.pointStatusText}>{getStatusLabel(status)}</Text>
        </TouchableOpacity>
        <View style={styles.pointActions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleEditPoint(item.id)}
          />
          <IconButton
            icon="delete"
            iconColor="#d32f2f"
            size={20}
            onPress={() => handleDeletePoint(item.id, item.label)}
          />
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

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={cancelDeletePoint}>
          <Dialog.Title>Delete Measurement Point</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete "{pointToDelete?.label}"? This will also delete any associated measurement results.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="text" onPress={cancelDeletePoint}>
              Cancel
            </Button>
            <Button mode="text" onPress={confirmDeletePoint}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const VisualTab: React.FC = () => {
  const { order, refreshOrder } = useOrderContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState('');
  const [defectsFound, setDefectsFound] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [visualResultPass, setVisualResultPass] = useState<boolean | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  // Load existing visual inspection data
  const loadVisualInspection = async () => {
    try {
      setLoading(true);
      let visualInspectionData = null;

      if (isWeb) {
        initWebStorage();
        const { webGetVisualInspectionByOrder } = require('../services/webStorage');
        visualInspectionData = webGetVisualInspectionByOrder(order.id);
      } else {
        const { getVisualInspectionByOrder } = require('../services/visualInspection');
        visualInspectionData = await getVisualInspectionByOrder(order.id);
      }

      if (visualInspectionData) {
        setSummary(visualInspectionData.summary || '');
        setDefectsFound(visualInspectionData.defectsFound || '');
        setRecommendations(visualInspectionData.recommendations || '');
        setVisualResultPass(visualInspectionData.visualResultPass);
        setLastSaved(visualInspectionData.updatedAt);
      }
    } catch (error) {
      console.error('Error loading visual inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVisualInspection();
    }, [order.id])
  );

  const handleSave = async () => {
    try {
      setSaving(true);

      const visualInspectionData = {
        inspectionOrderId: order.id,
        summary,
        defectsFound: defectsFound || undefined,
        recommendations: recommendations || undefined,
        visualResultPass,
      };

      if (isWeb) {
        initWebStorage();
        const { webCreateOrUpdateVisualInspection } = require('../services/webStorage');
        const { generateUUID } = require('../utils');
        
        const now = new Date().toISOString();
        const existing = require('../services/webStorage').webGetVisualInspectionByOrder(order.id);
        
        const visualInspection = {
          id: existing?.id ?? generateUUID(),
          ...visualInspectionData,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        
        webCreateOrUpdateVisualInspection(visualInspection);
        setLastSaved(now);
      } else {
        const { createOrUpdateVisualInspection } = require('../services/visualInspection');
        const result = await createOrUpdateVisualInspection(visualInspectionData);
        setLastSaved(result.updatedAt);
      }

      if (isWeb) {
        window.alert('Visual inspection saved successfully');
      } else {
        Alert.alert('Success', 'Visual inspection saved successfully');
      }
    } catch (error) {
      console.error('Error saving visual inspection:', error);
      if (isWeb) {
        window.alert('Failed to save visual inspection');
      } else {
        Alert.alert('Error', 'Failed to save visual inspection');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.tabContentContainer}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.visualFormContainer}>
        {/* Saved state indicator */}
        {lastSaved && (
          <View style={styles.savedIndicator}>
            <Text style={styles.savedText}>
              Last saved: {new Date(lastSaved).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Summary field */}
        <FormField
          label="Summary"
          value={summary}
          onChangeText={setSummary}
          placeholder="Enter visual inspection summary"
          multiline
          numberOfLines={4}
          required
        />

        {/* Defects Found field */}
        <FormField
          label="Defects Found"
          value={defectsFound}
          onChangeText={setDefectsFound}
          placeholder="Describe any defects found (optional)"
          multiline
          numberOfLines={4}
        />

        {/* Recommendations field */}
        <FormField
          label="Recommendations"
          value={recommendations}
          onChangeText={setRecommendations}
          placeholder="Enter recommendations (optional)"
          multiline
          numberOfLines={4}
        />

        {/* Visual Result Pass switch */}
        <View style={styles.switchContainer}>
          <Switch
            label="Visual Inspection Pass"
            value={visualResultPass ?? false}
            onValueChange={setVisualResultPass}
          />
        </View>

        {/* Save button */}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saving || !summary.trim()}
          loading={saving}
          style={styles.saveButton}
        >
          Save Visual Inspection
        </Button>
      </ScrollView>
    </View>
  );
};

const ProtocolTab: React.FC = () => {
  const { order } = useOrderContext();
  const [loading, setLoading] = useState(true);
  const [protocolData, setProtocolData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [inspectorName, setInspectorName] = useState('Inspector Name');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const isWeb = Platform.OS === 'web';

  const loadProtocolData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data = null;
      
      if (isWeb) {
        initWebStorage();
        const { webGenerateProtocolData } = require('../services/webStorage');
        data = webGenerateProtocolData(order.id);
      } else {
        const { generateProtocolData } = require('../services/protocol');
        data = await generateProtocolData(order.id);
      }
      
      setProtocolData(data);
      
      // Set inspector name from protocol data or default
      if (data) {
        setInspectorName(data.inspector.name || 'Inspector Name');
      }
    } catch (err) {
      console.error('Error loading protocol data:', err);
      setError('Failed to load protocol data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!protocolData) {
      Alert.alert('Error', 'Protocol data not available');
      return;
    }

    try {
      setExporting(true);
      
      // Update protocol data with editable fields
      const updatedProtocolData = {
        ...protocolData,
        inspector: {
          ...protocolData.inspector,
          name: inspectorName,
        },
        signature: {
          ...protocolData.signature,
          date: signatureDate,
        },
      };
      
      // Import the print service dynamically
      const { printProtocol } = require('../services/protocolExport');
      await printProtocol(updatedProtocolData);
    } catch (err) {
      console.error('Error printing protocol:', err);
      Alert.alert('Error', 'Failed to print protocol. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!protocolData) {
      Alert.alert('Error', 'Protocol data not available');
      return;
    }

    try {
      setExporting(true);
      
      // Update protocol data with editable fields
      const updatedProtocolData = {
        ...protocolData,
        inspector: {
          ...protocolData.inspector,
          name: inspectorName,
        },
        signature: {
          ...protocolData.signature,
          date: signatureDate,
        },
      };
      
      // Import the export service dynamically
      const { exportProtocolPDF } = require('../services/protocolExport');
      await exportProtocolPDF(updatedProtocolData);
    } catch (err) {
      console.error('Error exporting protocol:', err);
      // Error handling is done in the exportProtocol function
    } finally {
      setExporting(false);
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'socket_1p':
        return 'Socket 1P';
      case 'socket_3p':
        return 'Socket 3P';
      case 'lighting':
        return 'Lighting';
      case 'rcd':
        return 'RCD';
      case 'earthing':
        return 'Earthing';
      case 'lps':
        return 'LPS';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const formatMeasurementResults = (result: any, scope: any): string => {
    if (!result) return 'No measurements recorded';
    
    const parts: string[] = [];
    
    if (scope.loopImpedance && result.loopImpedance !== null && result.loopImpedance !== undefined) {
      parts.push(`Loop: ${result.loopImpedance}Ω`);
    }
    
    if (scope.insulation) {
      const insulationParts: string[] = [];
      if (result.insulationLn !== null && result.insulationLn !== undefined) {
        insulationParts.push(`L-N: ${result.insulationLn}MΩ`);
      }
      if (result.insulationLpe !== null && result.insulationLpe !== undefined) {
        insulationParts.push(`L-PE: ${result.insulationLpe}MΩ`);
      }
      if (result.insulationNpe !== null && result.insulationNpe !== undefined) {
        insulationParts.push(`N-PE: ${result.insulationNpe}MΩ`);
      }
      if (insulationParts.length > 0) {
        parts.push(`Insulation: ${insulationParts.join(', ')}`);
      }
    }
    
    if (scope.rcd && result.rcdType) {
      parts.push(`RCD: ${result.rcdType}, ${result.rcdRatedCurrent}mA, 1x: ${result.rcdTime1x}ms, 5x: ${result.rcdTime5x}ms`);
    }
    
    if (scope.peContinuity && result.peResistance !== null && result.peResistance !== undefined) {
      parts.push(`PE: ${result.peResistance}Ω`);
    }
    
    if (scope.earthing && result.earthingResistance !== null && result.earthingResistance !== undefined) {
      parts.push(`Earthing: ${result.earthingResistance}Ω`);
    }
    
    if (scope.polarity && result.polarityOk !== null && result.polarityOk !== undefined) {
      parts.push(`Polarity: ${result.polarityOk ? 'OK' : 'NOT OK'}`);
    }
    
    if (scope.phaseSequence && result.phaseSequenceOk !== null && result.phaseSequenceOk !== undefined) {
      parts.push(`Phase Seq: ${result.phaseSequenceOk ? 'OK' : 'NOT OK'}`);
    }
    
    if (scope.breakersCheck && result.breakerCheckOk !== null && result.breakerCheckOk !== undefined) {
      parts.push(`Breakers: ${result.breakerCheckOk ? 'OK' : 'NOT OK'}`);
    }
    
    if (result.comments) {
      parts.push(`Comments: ${result.comments}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No measurements recorded';
  };

  useFocusEffect(
    useCallback(() => {
      loadProtocolData();
    }, [order.id])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error || !protocolData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load protocol data'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContentContainer}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.protocolContainer}>
          <Text style={styles.protocolTitle}>Electrical Inspection Protocol</Text>
          
          {/* Inspector Info */}
          <View style={styles.protocolSection}>
            <Text style={styles.sectionTitle}>Inspector Information</Text>
            <FormField
              label="Inspector Name"
              value={inspectorName}
              onChangeText={setInspectorName}
              placeholder="Enter inspector name"
            />
            {protocolData.inspector.licenseNumber && (
              <Text style={styles.protocolText}>License Number: {protocolData.inspector.licenseNumber}</Text>
            )}
            {protocolData.inspector.company && (
              <Text style={styles.protocolText}>Company: {protocolData.inspector.company}</Text>
            )}
          </View>

          {/* Client Info */}
          <View style={styles.protocolSection}>
            <Text style={styles.sectionTitle}>Client Information</Text>
            <Text style={styles.protocolText}>Name: {protocolData.client.name}</Text>
            <Text style={styles.protocolText}>Address: {protocolData.client.address}</Text>
            {protocolData.client.contactPerson && (
              <Text style={styles.protocolText}>Contact Person: {protocolData.client.contactPerson}</Text>
            )}
            {protocolData.client.phone && (
              <Text style={styles.protocolText}>Phone: {protocolData.client.phone}</Text>
            )}
            {protocolData.client.email && (
              <Text style={styles.protocolText}>Email: {protocolData.client.email}</Text>
            )}
          </View>

          {/* Object Info */}
          <View style={styles.protocolSection}>
            <Text style={styles.sectionTitle}>Inspected Object</Text>
            <Text style={styles.protocolText}>Object Name: {protocolData.object.name}</Text>
            <Text style={styles.protocolText}>Address: {protocolData.object.address}</Text>
            <Text style={styles.protocolText}>Inspection Date: {protocolData.object.scheduledDate}</Text>
          </View>

          {/* Measurement Scope */}
          <View style={styles.protocolSection}>
            <Text style={styles.sectionTitle}>Measurement Scope</Text>
            <View style={styles.scopeList}>
              {protocolData.scope.loopImpedance && (
                <Text style={styles.scopeItem}>✓ Loop Impedance Measurement</Text>
              )}
              {protocolData.scope.insulation && (
                <Text style={styles.scopeItem}>✓ Insulation Resistance Testing</Text>
              )}
              {protocolData.scope.rcd && (
                <Text style={styles.scopeItem}>✓ RCD Testing</Text>
              )}
              {protocolData.scope.peContinuity && (
                <Text style={styles.scopeItem}>✓ PE Continuity Testing</Text>
              )}
              {protocolData.scope.earthing && (
                <Text style={styles.scopeItem}>✓ Earthing Resistance Measurement</Text>
              )}
              {protocolData.scope.polarity && (
                <Text style={styles.scopeItem}>✓ Polarity Check</Text>
              )}
              {protocolData.scope.phaseSequence && (
                <Text style={styles.scopeItem}>✓ Phase Sequence Check</Text>
              )}
              {protocolData.scope.breakersCheck && (
                <Text style={styles.scopeItem}>✓ Circuit Breakers Check</Text>
              )}
              {protocolData.scope.lps && (
                <Text style={styles.scopeItem}>✓ Lightning Protection System</Text>
              )}
              {protocolData.scope.visualInspection && (
                <Text style={styles.scopeItem}>✓ Visual Inspection</Text>
              )}
            </View>
          </View>

          {/* Results by Room - Table Format */}
          <View style={styles.protocolSection}>
            <Text style={styles.sectionTitle}>Measurement Results</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableRoomCell]}>Room</Text>
              <Text style={[styles.tableHeaderCell, styles.tablePointCell]}>Point</Text>
              <Text style={[styles.tableHeaderCell, styles.tableTypeCell]}>Type</Text>
              <Text style={[styles.tableHeaderCell, styles.tableResultsCell]}>Results</Text>
              <Text style={[styles.tableHeaderCell, styles.tableStatusCell]}>Status</Text>
            </View>
            
            {/* Table Rows */}
            {protocolData.resultsByRoom.map((roomSection: any, roomIndex: number) => (
              <View key={roomIndex}>
                {roomSection.points.map((pwr: any, pointIndex: number) => (
                  <View key={pwr.point.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableRoomCell]}>
                      {pointIndex === 0 ? roomSection.roomName : ''}
                    </Text>
                    <Text style={[styles.tableCell, styles.tablePointCell]}>{pwr.point.label}</Text>
                    <Text style={[styles.tableCell, styles.tableTypeCell]}>{getTypeLabel(pwr.point.type)}</Text>
                    <Text style={[styles.tableCell, styles.tableResultsCell, styles.tableResultsText]}>
                      {formatMeasurementResults(pwr.result, protocolData.scope)}
                    </Text>
                    <View style={[styles.tableCell, styles.tableStatusCell]}>
                      <View style={[
                        styles.statusBadgeSmall,
                        { backgroundColor: pwr.status === 'ok' ? '#66BB6A' : pwr.status === 'not_ok' ? '#EF5350' : '#999' }
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {pwr.status === 'ok' ? 'PASS' : pwr.status === 'not_ok' ? 'FAIL' : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* LPS Section */}
          {protocolData.lpsSection && protocolData.lpsSection.points.length > 0 && (
            <View style={styles.protocolSection}>
              <Text style={styles.sectionTitle}>Lightning Protection System (LPS)</Text>
              
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.tablePointCell]}>Point</Text>
                <Text style={[styles.tableHeaderCell, styles.tableResultsCell]}>Results</Text>
                <Text style={[styles.tableHeaderCell, styles.tableStatusCell]}>Status</Text>
              </View>
              
              {/* Table Rows */}
              {protocolData.lpsSection.points.map((pwr: any) => (
                <View key={pwr.point.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tablePointCell]}>{pwr.point.label}</Text>
                  <Text style={[styles.tableCell, styles.tableResultsCell, styles.tableResultsText]}>
                    {pwr.result ? (
                      <>
                        {pwr.result.lpsEarthingResistance !== null && pwr.result.lpsEarthingResistance !== undefined && 
                          `Earthing: ${pwr.result.lpsEarthingResistance}Ω`}
                        {pwr.result.lpsContinuityOk !== null && pwr.result.lpsContinuityOk !== undefined && 
                          ` | Continuity: ${pwr.result.lpsContinuityOk ? 'OK' : 'NOT OK'}`}
                        {pwr.result.lpsVisualOk !== null && pwr.result.lpsVisualOk !== undefined && 
                          ` | Visual: ${pwr.result.lpsVisualOk ? 'OK' : 'NOT OK'}`}
                      </>
                    ) : 'No measurements recorded'}
                  </Text>
                  <View style={[styles.tableCell, styles.tableStatusCell]}>
                    <View style={[
                      styles.statusBadgeSmall,
                      { backgroundColor: pwr.status === 'ok' ? '#66BB6A' : pwr.status === 'not_ok' ? '#EF5350' : '#999' }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {pwr.status === 'ok' ? 'PASS' : pwr.status === 'not_ok' ? 'FAIL' : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Visual Inspection */}
          {protocolData.visualInspection && (
            <View style={styles.protocolSection}>
              <Text style={styles.sectionTitle}>Visual Inspection</Text>
              <View style={styles.visualInspectionContent}>
                <Text style={styles.protocolLabel}>Summary:</Text>
                <Text style={styles.protocolText}>{protocolData.visualInspection.summary}</Text>
                
                {protocolData.visualInspection.defectsFound && (
                  <>
                    <Text style={[styles.protocolLabel, styles.marginTop]}>Defects Found:</Text>
                    <Text style={styles.protocolText}>{protocolData.visualInspection.defectsFound}</Text>
                  </>
                )}
                
                {protocolData.visualInspection.recommendations && (
                  <>
                    <Text style={[styles.protocolLabel, styles.marginTop]}>Recommendations:</Text>
                    <Text style={styles.protocolText}>{protocolData.visualInspection.recommendations}</Text>
                  </>
                )}
                
                <View style={[styles.visualResultContainer, styles.marginTop]}>
                  <Text style={styles.protocolLabel}>Overall Result:</Text>
                  <View style={[
                    styles.statusBadgeSmall,
                    { backgroundColor: protocolData.visualInspection.visualResultPass ? '#66BB6A' : '#EF5350' }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {protocolData.visualInspection.visualResultPass ? 'PASS' : 'FAIL'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Signature */}
          <View style={styles.protocolSection}>
            <Text style={styles.sectionTitle}>Signature</Text>
            <View style={styles.signatureContainer}>
              <FormField
                label="Signature Date"
                value={signatureDate}
                onChangeText={setSignatureDate}
                placeholder="YYYY-MM-DD"
              />
              <View style={styles.signatureLine}>
                <Text style={styles.protocolLabel}>Inspector Signature:</Text>
                <View style={styles.signatureUnderline} />
              </View>
            </View>
          </View>

          {/* Export Buttons */}
          <View style={styles.exportButtonContainer}>
            {isWeb ? (
              <Button
                mode="contained"
                onPress={handlePrint}
                disabled={exporting}
                loading={exporting}
                icon="printer"
                style={styles.exportButton}
              >
                Print Protocol
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleExportPDF}
                disabled={exporting}
                loading={exporting}
                icon="file-pdf-box"
                style={styles.exportButton}
              >
                Export PDF
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
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

  const handleEdit = () => {
    navigation.navigate('OrderFormScreen', { orderId });
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
              <View style={styles.headerActions}>
                <IconButton
                  icon="pencil"
                  iconColor="#2196F3"
                  size={24}
                  onPress={handleEdit}
                />
                <IconButton
                  icon="delete"
                  iconColor="#d32f2f"
                  size={24}
                  onPress={handleDelete}
                />
              </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  pointActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  pointNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  pointComments: {
    fontSize: 13,
    color: '#2196F3',
    marginTop: 4,
    fontStyle: 'italic',
  },
  visualFormContainer: {
    padding: 16,
  },
  savedIndicator: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#66BB6A',
  },
  savedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  switchContainer: {
    marginVertical: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  protocolContainer: {
    padding: 16,
  },
  protocolTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  protocolSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  protocolText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  roomSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  roomSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  pointResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 4,
  },
  pointResultLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pointResultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scopeList: {
    gap: 4,
  },
  scopeItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tableRoomCell: {
    width: '15%',
    fontWeight: '600',
  },
  tablePointCell: {
    width: '20%',
  },
  tableTypeCell: {
    width: '15%',
  },
  tableResultsCell: {
    width: '40%',
  },
  tableStatusCell: {
    width: '10%',
    alignItems: 'center',
  },
  tableResultsText: {
    fontSize: 11,
    lineHeight: 16,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  visualInspectionContent: {
    gap: 8,
  },
  protocolLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  marginTop: {
    marginTop: 12,
  },
  visualResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signatureContainer: {
    gap: 20,
  },
  signatureLine: {
    gap: 8,
  },
  signatureUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    height: 40,
  },
  exportButtonContainer: {
    marginTop: 32,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  exportButton: {
    paddingVertical: 8,
  },
});
