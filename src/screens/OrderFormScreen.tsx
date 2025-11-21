import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { RootStackParamList } from '../navigation/types';
import { FormField } from '../components/forms/FormField';
import { FormSection } from '../components/forms/FormSection';
import { Button } from '../components/common/Button';
import { Picker, PickerItem } from '../components/common/Picker';
import { Checkbox } from '../components/common/Checkbox';
import { DatePicker } from '../components/common/DatePicker';
import { Client, InspectionOrder, OrderInput, OrderStatus } from '../types';
import { createOrder, updateOrder, getOrder } from '../services/order';
import { getAllClients, getClient } from '../services/client';
import { webGetAllClients, webGetClient, webGetOrder, webCreateOrder, webUpdateOrder, initWebStorage } from '../services/webStorage';
import { validateRequired } from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from '../contexts/NotificationContext';
import { getErrorMessage } from '../utils/errorHandler';
import { translations as t } from '../constants';

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
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!orderId);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

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

  // Load clients - refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadClients = async () => {
        try {
          setClientsLoading(true);
          
          let allClients: Client[];
          if (isWeb) {
            initWebStorage();
            allClients = webGetAllClients();
          } else {
            allClients = await getAllClients();
          }
          
          setClients(allClients);
        } catch (error) {
          console.error('Error loading clients:', error);
          showError('Nie udało się załadować klientów');
        } finally {
          setClientsLoading(false);
        }
      };

      loadClients();
    }, [isWeb])
  );

  // Load existing order data if editing
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;

      try {
        setInitialLoading(true);
        
        let order: InspectionOrder | null = null;
        if (isWeb) {
          initWebStorage();
          order = webGetOrder(orderId);
        } else {
          order = await getOrder(orderId);
        }
        
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
          showError('Zlecenie nie zostało znalezione');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading order:', error);
        showError('Nie udało się załadować danych zlecenia');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigation, setValue, isWeb]);

  // Auto-fill address when client is selected
  useEffect(() => {
    const fillClientAddress = async () => {
      if (selectedClientId && !orderId) {
        try {
          let client: Client | null = null;
          if (isWeb) {
            client = webGetClient(selectedClientId);
          } else {
            client = await getClient(selectedClientId);
          }
          
          if (client) {
            setValue('address', client.address);
          }
        } catch (error) {
          console.error('Error loading client address:', error);
        }
      }
    };

    fillClientAddress();
  }, [selectedClientId, orderId, setValue, isWeb]);

  const handleAddClient = () => {
    navigation.navigate('ClientFormScreen', {});
  };

  const onSubmit = async (data: OrderFormData, status: OrderStatus) => {
    try {
      console.log('onSubmit called with status:', status);
      console.log('Form data:', data);
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

      if (isWeb) {
        initWebStorage();
        const now = new Date().toISOString();
        
        if (orderId) {
          // Update existing order on web
          webUpdateOrder(orderId, {
            ...orderInput,
            updatedAt: now,
          });
          createdOrderId = orderId;
        } else {
          // Create new order on web - always start with draft status (Requirement 2.2)
          const newOrder: InspectionOrder = {
            id: uuidv4(),
            ...orderInput,
            status: OrderStatus.DRAFT,
            createdAt: now,
            updatedAt: now,
          };
          webCreateOrder(newOrder);
          createdOrderId = newOrder.id;
          
          // If user wants to start measurements immediately, update status
          if (status === OrderStatus.IN_PROGRESS) {
            webUpdateOrder(createdOrderId, { status: OrderStatus.IN_PROGRESS, updatedAt: new Date().toISOString() });
          }
        }
      } else {
        // Use SQLite on mobile
        if (orderId) {
          await updateOrder(orderId, orderInput);
          createdOrderId = orderId;
        } else {
          // Create new order - always starts with draft status (Requirement 2.2)
          const newOrder = await createOrder(orderInput);
          createdOrderId = newOrder.id;
          
          // If user wants to start measurements immediately, update status
          if (status === OrderStatus.IN_PROGRESS) {
            await updateOrder(createdOrderId, { ...orderInput, status: OrderStatus.IN_PROGRESS });
          }
        }
      }

      // Show success message and navigate to OrderDetailsScreen
      showSuccess(orderId ? 'Zlecenie zaktualizowane pomyślnie' : 'Zlecenie utworzone pomyślnie');
      navigation.replace('OrderDetailsScreen', { orderId: createdOrderId });
    } catch (error) {
      console.error('Error saving order:', error);
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = handleSubmit(
    (data) => {
      console.log('Save as Draft - Form valid, submitting:', data);
      return onSubmit(data, OrderStatus.DRAFT);
    },
    (errors) => {
      console.log('Save as Draft - Form validation failed:', errors);
      showError('Proszę wypełnić wszystkie wymagane pola');
    }
  );
  
  const handleStartMeasurements = handleSubmit(
    (data) => {
      console.log('Start Measurements - Form valid, submitting:', data);
      return onSubmit(data, OrderStatus.IN_PROGRESS);
    },
    (errors) => {
      console.log('Start Measurements - Form validation failed:', errors);
      showError('Proszę wypełnić wszystkie wymagane pola');
    }
  );

  if (initialLoading || clientsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const clientPickerItems: PickerItem[] = clients.map((client) => ({
    label: `${client.name} - ${client.address}`,
    value: client.id,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.form}>
        {/* Client Selection Section */}
        <FormSection title={t.screens.orderForm.clientSelection}>
          <Controller
            control={control}
            name="clientId"
            rules={{
              validate: (value) => validateRequired(value) || 'Client is required',
            }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Picker
                  label={t.fields.client}
                  value={value}
                  items={clientPickerItems}
                  onValueChange={onChange}
                  placeholder={t.placeholders.selectClient}
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
            {t.screens.orderForm.addClient}
          </Button>
        </FormSection>

        {/* Object Info Section */}
        <FormSection title={t.screens.orderForm.objectInfo}>
          <Controller
            control={control}
            name="objectName"
            rules={{
              validate: (value) => validateRequired(value) || t.screens.orderForm.objectNameRequired,
            }}
            render={({ field: { onChange, value } }) => (
              <FormField
                label={t.fields.objectName}
                value={value}
                onChangeText={onChange}
                error={errors.objectName?.message}
                placeholder={t.placeholders.enterObjectName}
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
                label={t.fields.address}
                value={value}
                onChangeText={onChange}
                error={errors.address?.message}
                placeholder={t.placeholders.enterAddress}
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
              <DatePicker
                label={t.fields.scheduledDate}
                value={value}
                onChangeDate={onChange}
                error={errors.scheduledDate?.message}
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
                numberOfLines={3}
              />
            )}
          />
        </FormSection>

        {/* Measurement Scope Section */}
        <FormSection title={t.screens.orderForm.measurementScope}>
          <Controller
            control={control}
            name="measureLoopImpedance"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                label={t.measurementTypes.loopImpedance}
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
                label={t.measurementTypes.insulation}
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
                label={t.measurementTypes.rcd}
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
                label={t.measurementTypes.peContinuity}
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
                label={t.measurementTypes.earthing}
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
                label={t.measurementTypes.polarity}
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
                label={t.measurementTypes.phaseSequence}
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
                label={t.measurementTypes.breakersCheck}
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
                label={t.measurementTypes.lps}
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
                label={t.measurementTypes.visualInspection}
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
            {orderId ? t.common.save : 'Zapisz jako szkic'}
          </Button>

          <Button
            onPress={handleStartMeasurements}
            disabled={loading}
            loading={loading}
            style={styles.button}
          >
            {orderId ? t.common.save : t.screens.orderForm.startMeasurements}
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
    elevation: 3,
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    }),
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
