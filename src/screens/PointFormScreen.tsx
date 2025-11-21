import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { RootStackParamList } from '../navigation/types';
import { FormField } from '../components/forms/FormField';
import { Picker, PickerItem } from '../components/common/Picker';
import { Button } from '../components/common/Button';
import { MeasurementPoint, PointInput, PointType, Room } from '../types';
import { createPoint, updatePoint, getPoint, getPointsByOrder } from '../services/point';
import { getRoomsByOrder } from '../services/room';
import { 
  webGetPoint, 
  webCreatePoint, 
  webUpdatePoint, 
  webGetRoomsByOrder,
  webGetPointsByOrder,
  initWebStorage 
} from '../services/webStorage';
import { validateRequired } from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';

type PointFormScreenRouteProp = RouteProp<RootStackParamList, 'PointFormScreen'>;
type PointFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PointFormScreen'>;

interface PointFormData {
  label: string;
  type: PointType;
  roomId: string;
  circuitSymbol: string;
  notes: string;
}

// Map point types to Polish labels
const getTypeLabel = (type: PointType): string => {
  const labels: Record<PointType, string> = {
    [PointType.SOCKET_1P]: 'Gniazdo 1F',
    [PointType.SOCKET_3P]: 'Gniazdo 3F',
    [PointType.LIGHTING]: 'Oświetlenie',
    [PointType.RCD]: 'RCD',
    [PointType.EARTHING]: 'Uziemienie',
    [PointType.LPS]: 'LPS',
    [PointType.OTHER]: 'Inne',
  };
  return labels[type];
};

// Generate auto label based on type and existing points
const generateAutoLabel = (type: PointType, points: MeasurementPoint[]): string => {
  const typeLabel = getTypeLabel(type);
  
  // Filter points of the same type
  const sameTypePoints = points.filter(p => p.type === type);
  
  // Find the highest number used for this type
  let maxNumber = 0;
  sameTypePoints.forEach(point => {
    // Try to extract number from label (e.g., "Gniazdo 5" -> 5)
    const match = point.label.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  // Return next number
  return `${typeLabel} ${maxNumber + 1}`;
};

export const PointFormScreen: React.FC = () => {
  const route = useRoute<PointFormScreenRouteProp>();
  const navigation = useNavigation<PointFormScreenNavigationProp>();
  const { orderId, pointId, roomId } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!pointId);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [existingPoints, setExistingPoints] = useState<MeasurementPoint[]>([]);
  const isWeb = Platform.OS === 'web';

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PointFormData>({
    defaultValues: {
      label: '',
      type: PointType.SOCKET_1P,
      roomId: '',
      circuitSymbol: '',
      notes: '',
    },
  });

  const selectedType = watch('type');

  // Load rooms and existing points for the order
  useEffect(() => {
    const loadData = async () => {
      try {
        let loadedRooms: Room[] = [];
        let loadedPoints: MeasurementPoint[] = [];
        
        if (isWeb) {
          initWebStorage();
          loadedRooms = webGetRoomsByOrder(orderId);
          loadedPoints = webGetPointsByOrder(orderId);
        } else {
          loadedRooms = await getRoomsByOrder(orderId);
          loadedPoints = await getPointsByOrder(orderId);
        }
        
        setRooms(loadedRooms);
        setExistingPoints(loadedPoints);
        
        // Auto-generate label for new points
        if (!pointId) {
          const autoLabel = generateAutoLabel(PointType.SOCKET_1P, loadedPoints);
          setValue('label', autoLabel);
          
          // Set roomId if passed from navigation (when user filtered by room)
          if (roomId) {
            setValue('roomId', roomId);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      }
    };

    loadData();
  }, [orderId, isWeb, pointId, roomId, setValue]);

  // Load existing point data if editing
  useEffect(() => {
    const loadPoint = async () => {
      if (!pointId) return;

      try {
        setInitialLoading(true);
        
        let point: MeasurementPoint | null = null;
        if (isWeb) {
          initWebStorage();
          point = webGetPoint(pointId);
        } else {
          point = await getPoint(pointId);
        }
        
        if (point) {
          setValue('label', point.label);
          setValue('type', point.type);
          setValue('roomId', point.roomId || '');
          setValue('circuitSymbol', point.circuitSymbol || '');
          setValue('notes', point.notes || '');
        } else {
          Alert.alert('Error', 'Measurement point not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading measurement point:', error);
        Alert.alert('Error', 'Failed to load measurement point data');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    loadPoint();
  }, [pointId, navigation, setValue, isWeb]);

  // Auto-update label when type changes (only for new points)
  useEffect(() => {
    if (!pointId && existingPoints.length > 0) {
      const autoLabel = generateAutoLabel(selectedType, existingPoints);
      setValue('label', autoLabel);
    }
  }, [selectedType, pointId, existingPoints, setValue]);

  const onSubmit = async (data: PointFormData) => {
    try {
      setLoading(true);

      // Prepare point input
      const pointInput: PointInput = {
        inspectionOrderId: orderId,
        label: data.label.trim(),
        type: data.type,
        roomId: data.roomId || undefined,
        circuitSymbol: data.circuitSymbol.trim() || undefined,
        notes: data.notes.trim() || undefined,
      };

      if (isWeb) {
        initWebStorage();
        const now = new Date().toISOString();
        
        if (pointId) {
          // Update existing point on web
          webUpdatePoint(pointId, {
            ...pointInput,
            updatedAt: now,
          });
        } else {
          // Create new point on web
          const newPoint: MeasurementPoint = {
            id: uuidv4(),
            ...pointInput,
            createdAt: now,
            updatedAt: now,
          };
          webCreatePoint(newPoint);
        }
      } else {
        // Use SQLite on mobile
        if (pointId) {
          await updatePoint(pointId, pointInput);
        } else {
          await createPoint(pointInput);
        }
      }

      // Navigate back on success
      navigation.goBack();
    } catch (error) {
      console.error('Error saving measurement point:', error);
      Alert.alert(
        'Error',
        `Failed to ${pointId ? 'update' : 'create'} measurement point. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Prepare type picker items
  const typeItems: PickerItem[] = [
    { label: 'Gniazdo 1-fazowe', value: PointType.SOCKET_1P },
    { label: 'Gniazdo 3-fazowe', value: PointType.SOCKET_3P },
    { label: 'Oświetlenie', value: PointType.LIGHTING },
    { label: 'RCD', value: PointType.RCD },
    { label: 'Uziemienie', value: PointType.EARTHING },
    { label: 'LPS', value: PointType.LPS },
    { label: 'Inne', value: PointType.OTHER },
  ];

  // Prepare room picker items (with "No Room" option)
  const roomItems: PickerItem[] = [
    { label: 'No Room', value: '' },
    ...rooms.map(room => ({
      label: room.name,
      value: room.id,
    })),
  ];

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="label"
          rules={{
            validate: (value) => validateRequired(value) || 'Label is required',
          }}
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Label"
              value={value}
              onChangeText={onChange}
              error={errors.label?.message}
              placeholder="Enter measurement point label"
              required
            />
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <Picker
              label="Type"
              value={value}
              items={typeItems}
              onValueChange={onChange}
              placeholder="Select point type"
            />
          )}
        />

        <Controller
          control={control}
          name="roomId"
          render={({ field: { onChange, value } }) => (
            <Picker
              label="Room (Optional)"
              value={value}
              items={roomItems}
              onValueChange={onChange}
              placeholder="Select room"
            />
          )}
        />

        <Controller
          control={control}
          name="circuitSymbol"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Circuit Symbol"
              value={value}
              onChangeText={onChange}
              error={errors.circuitSymbol?.message}
              placeholder="Enter circuit symbol"
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Notes"
              value={value}
              onChangeText={onChange}
              error={errors.notes?.message}
              placeholder="Enter any additional notes (max 200 characters)"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          loading={loading}
          style={styles.saveButton}
        >
          {pointId ? 'Update Point' : 'Save Point'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    marginTop: 16,
  },
});
