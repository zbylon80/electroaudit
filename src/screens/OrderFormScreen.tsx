import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { RootStackParamList } from '../navigation/types';
import { FormField } from '../components/forms/FormField';
import { FormSection } from '../components/forms/FormSection';
import { Button } from '../components/common/Button';
import { Picker, PickerItem } from '../components/common/Picker';
import { Checkbox } from '../components/common/Checkbox';
import { Client, OrderInput, OrderStatus } from '../types';
import { createOrder, updateOrder, getOrder } from '../services/order';
import { getAllClients, getClient } from '../services/client';
import { validateRequired } from '../utils/validators';

type OrderFormScreenRouteProp = RouteProp<RootStackParamList, 'OrderFormScreen'>;
type OrderFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderFormScreen'>;

interface OrderFormData {
  clientId: string;
  objectName: string;
  address: string;
  scheduledDate: string;
  notes: string;
  measureLoopImpedance: boolean;
  measureInsulation: boolean;
  measureRcd: boolean;
  measurePeContinuity: boolean;
  measureEarthing: boolean;
  measurePolarity: boolean;
  measurePhaseSequence: boolean;
  measureBreakersCheck: boolean;
  measureLps: boolean;
  visualInspection: boolean;
}

export const OrderFormScreen: React.FC = () => {
  const route = useRoute<OrderFormScreenRouteProp>();
  const navigation = useNavigation<OrderFormScreenNavigationProp>();
  const { orderId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!orderId);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrderFormData>({
    defaultValues: {
      clientId: '',
      objectName: '',
      address: '',
      scheduledDate: '',
      notes: '',
      measureLoopImpedance: false,
      measureInsulation: false,
      measureRcd: false,
      measurePeContinuity: false,
      measureEarthing: false,
      measurePolarity: false,
      measurePhaseSequence: false,
      measureBreakersCheck: false,
      measureLps: false,
      visualInspection: false,
    },
  });

  const selectedClientId = watch('clientId');

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientsLoading(true);
        const allClients = await getAllClients();
        setClients(allClients);
      } catch (error) {
        console.error('Error loading clients:', error);
        Alert.alert('Error', 'Failed to load clients');
      } finally {
        setClientsLoading(false);
      }
    };

    loadClients();
  }, []);

  // Load existing order data if editing
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;

      try {
        setInitialLoading(true);
        const order = await getOrder(orderId);
        
        if (order) {
          setValue('clientId', order.clientId);
          setValue('objectName', order.objectName);
          setValue('address', order.address);
          setValue('scheduledDate', order.scheduledDate || '');
          setValue('notes', order.notes || '');
          setValue('measureLoopImpedance', order.measureLoopImpedance);
          setValue('measureInsulation', order.measureInsulation);
          setValue('measureRcd', order.measureRcd);
          setValue('measurePeContinuity', order.measurePeContinuity);
          setValue('measureEarthing', order.measureEarthing);
          setValue('measurePolarity', order.measurePolarity);
          setValue('measurePhaseSequence', order.measurePhaseSequence);
          setValue('measureBreakersCheck', order.measureBreakersCheck);
          setValue('measureLps', order.measureLps);
          setValue('visualInspection', order.visualInspection);
        } else {
          Alert.alert('Error', 'Order not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading order:', error);
        Alert.alert('Error', 'Failed to load order data');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigation, setValue]);

  // Auto-fill address when client is selected
  useEffect(() => {
    const fillClientAddress = async () => {
      if (selectedClientId && !orderId) {
        try {
          const client = await getClient(selectedClientId);
          if (client) {
            setValue('address', client.address);
          }
        } catch (error) {
          console.error('Error loading client address:', error);
        }
      }
    };

    fillClientAddress();
  }, [selectedClientId, orderId, setValue]);

  const handleAddClient = () => {
    navigation.navigate('ClientFormScreen', {});
  };

  const onSubmit = async (data: OrderFormData, status: OrderStatus) => {
    try {
      setLoading(true);

      // Prepare order input
      const orderInput: OrderInput = {
        clientId: data.clientId,
        objectName: data.objectName.trim(),
        address: data.address.trim(),
        scheduledDate: data.scheduledDate.trim() || undefined,
        status: status,
        notes: data.notes.trim() || undefined,
        measureLoopImpedance: data.measureLoopImpedance,
        measureInsulation: data.measureInsulation,
        measureRcd: data.measureRcd,
        measurePeContinuity: data.measurePeContinuity,
        measureEarthing: data.measureEarthing,
        measurePolarity: data.measurePolarity,
        measurePhaseSequence: data.measurePhaseSequence,
        measureBreakersCheck: data.measureBreakersCheck,
        measureLps: data.measureLps,
        visualInspection: data.visualInspection,
      };

      let createdOrderId: string;

      if (orderId) {
        // Update existing order
        await updateOrder(orderId, orderInput);
        createdOrderId = orderId;
      } else {
        // Create new order
        const newOrder = await createOrder(orderInput);
        createdOrderId = newOrder.id;
      }

      // Navigate to OrderDetailsScreen on success
      navigation.replace('OrderDetailsScreen', { orderId: createdOrderId });
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert(
        'Error',
        `Failed to ${orderId ? 'update' : 'create'} order. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = handleSubmit((data) => onSubmit(data, OrderStatus.DRAFT));
  const handleStartMeasurements = handleSubmit((data) => onSubmit(data, OrderStatus.IN_PROGRESS));

  if (initialLoading || clientsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const clientPickerItems: PickerItem[] = clients.map((client) => ({
    label: client.name,
    value: client.id,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.form}>
        {/* Client Selection Section */}
        <FormSection title="Client Selection">
          <Controller
            control={control}
            name="clientId"
            rules={{
              validate: (value) => validateRequired(value) || 'Client is required',
            }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Picker
                  label="Client"
                  value={value}
                  items={clientPickerItems}
                  onValueChange={onChange}
                  placeholder="Select a client"
                />
                {errors.clientId && (
                  <FormField
                    label=""
                    value=""
                    onChangeText={() => {}}
                    error={errors.clientId.message}
                    style={{ height: 0, marginTop: -8 }}
                  />
                )}
              </View>
            )}
          />

          <Button
            mode="outlined"
            onPress={handleAddClient}
            style={styles.addClientButton}
          >
            Add New Client
          </Button>
        </FormSection>

        {/* Object Info Section */}
        <FormSection title="Object Information">
          <Controller
            control={control}
            name="objectName"
            rules={{
              validate: (value) => validateRequired(value) || 'Object name is required',
            }}
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Object Name"
                value={value}
                onChangeText={onChange}
                error={errors.objectName?.message}
                placeholder="Enter object name"
                required
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            rules={{
              validate: (value) => validateRequired(value) || 'Address is required',
            }}
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Address"
                value={value}
                onChangeText={onChange}
                error={errors.address?.message}
                placeholder="Enter address"
                multiline
                numberOfLines={2}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="scheduledDate"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Scheduled Date"
                value={value}
                onChangeText={onChange}
                error={errors.scheduledDate?.message}
                placeholder="YYYY-MM-DD"
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
                placeholder="Enter any additional notes"
                multiline
                numberOfLines={3}
              />
            )}
          />
        </FormSection>

        {/* Measurement Scope Section */}
        <FormSection title="Measurement Scope">
          <Controller
            control={control}
            name="measureLoopImpedance"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Loop Impedance"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measureInsulation"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Insulation Resistance"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measureRcd"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="RCD Testing"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measurePeContinuity"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="PE Continuity"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measureEarthing"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Earthing Resistance"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measurePolarity"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Polarity Check"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measurePhaseSequence"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Phase Sequence"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measureBreakersCheck"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Breakers Check"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="measureLps"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Lightning Protection System (LPS)"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />

          <Controller
            control={control}
            name="visualInspection"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label="Visual Inspection"
                checked={value}
                onPress={() => onChange(!value)}
              />
            )}
          />
        </FormSection>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleSaveDraft}
            disabled={loading}
            loading={loading}
            mode="outlined"
            style={styles.button}
          >
            {orderId ? 'Update Order' : 'Save as Draft'}
          </Button>

          <Button
            onPress={handleStartMeasurements}
            disabled={loading}
            loading={loading}
            style={styles.button}
          >
            {orderId ? 'Update & Start' : 'Start Measurements'}
          </Button>
        </View>
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
  addClientButton: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
});
