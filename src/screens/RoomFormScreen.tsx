import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { RootStackParamList } from '../navigation/types';
import { FormField } from '../components/forms/FormField';
import { Button } from '../components/common/Button';
import { Room, RoomInput } from '../types';
import { createRoom, updateRoom, getRoom } from '../services/room';
import { webGetRoom, webCreateRoom, webUpdateRoom, initWebStorage } from '../services/webStorage';
import { validateRequired } from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';
import { translations as t } from '../constants';

type RoomFormScreenRouteProp = RouteProp<RootStackParamList, 'RoomFormScreen'>;
type RoomFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RoomFormScreen'>;

interface RoomFormData {
  name: string;
  notes: string;
}

export const RoomFormScreen: React.FC = () => {
  const route = useRoute<RoomFormScreenRouteProp>();
  const navigation = useNavigation<RoomFormScreenNavigationProp>();
  const { orderId, roomId } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!roomId);
  const isWeb = Platform.OS === 'web';

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RoomFormData>({
    defaultValues: {
      name: '',
      notes: '',
    },
  });

  // Load existing room data if editing
  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return;

      try {
        setInitialLoading(true);
        
        let room: Room | null = null;
        if (isWeb) {
          initWebStorage();
          room = webGetRoom(roomId);
        } else {
          room = await getRoom(roomId);
        }
        
        if (room) {
          setValue('name', room.name);
          setValue('notes', room.notes || '');
        } else {
          Alert.alert('Error', 'Room not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading room:', error);
        Alert.alert('Error', 'Failed to load room data');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    loadRoom();
  }, [roomId, navigation, setValue, isWeb]);

  const onSubmit = async (data: RoomFormData) => {
    try {
      setLoading(true);

      // Prepare room input
      const roomInput: RoomInput = {
        inspectionOrderId: orderId,
        name: data.name.trim(),
        notes: data.notes.trim() || undefined,
      };

      if (isWeb) {
        initWebStorage();
        const now = new Date().toISOString();
        
        if (roomId) {
          // Update existing room on web
          webUpdateRoom(roomId, {
            ...roomInput,
            updatedAt: now,
          });
        } else {
          // Create new room on web
          const newRoom: Room = {
            id: uuidv4(),
            ...roomInput,
            createdAt: now,
            updatedAt: now,
          };
          webCreateRoom(newRoom);
        }
      } else {
        // Use SQLite on mobile
        if (roomId) {
          await updateRoom(roomId, roomInput);
        } else {
          await createRoom(roomInput);
        }
      }

      // Navigate back on success
      navigation.goBack();
    } catch (error) {
      console.error('Error saving room:', error);
      Alert.alert(
        'Error',
        `Failed to ${roomId ? 'update' : 'create'} room. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

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
          name="name"
          rules={{
            validate: (value) => validateRequired(value) || 'Name is required',
          }}
          render={({ field: { onChange, value } }) => (
            <FormField
              label={t.fields.name}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              placeholder={t.placeholders.enterRoomName}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <FormField
              label={t.fields.notes}
              value={value}
              onChangeText={onChange}
              error={errors.notes?.message}
              placeholder={t.placeholders.enterAdditionalNotes}
              multiline
              numberOfLines={4}
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          loading={loading}
          style={styles.saveButton}
        >
          {t.common.save}
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
