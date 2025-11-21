import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { RootStackParamList } from '../navigation/types';
import { FormField } from '../components/forms/FormField';
import { Button } from '../components/common/Button';
import { Client, ClientInput } from '../types';
import { createClient, updateClient, getClient } from '../services/client';
import { webGetClient, webCreateClient, webUpdateClient, initWebStorage } from '../services/webStorage';
import { validateRequired, validateEmail } from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from '../contexts/NotificationContext';
import { getErrorMessage } from '../utils/errorHandler';

type ClientFormScreenRouteProp = RouteProp<RootStackParamList, 'ClientFormScreen'>;
type ClientFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientFormScreen'>;

interface ClientFormData {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes: string;
}

export const ClientFormScreen: React.FC = () => {
  const route = useRoute<ClientFormScreenRouteProp>();
  const navigation = useNavigation<ClientFormScreenNavigationProp>();
  const { clientId } = route.params || {};
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!clientId);
  const isWeb = Platform.OS === 'web';

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  // Load existing client data if editing
  useEffect(() => {
    const loadClient = async () => {
      if (!clientId) return;

      try {
        setInitialLoading(true);
        
        let client: Client | null = null;
        if (isWeb) {
          initWebStorage();
          client = webGetClient(clientId);
        } else {
          client = await getClient(clientId);
        }
        
        if (client) {
          setValue('name', client.name);
          setValue('address', client.address);
          setValue('contactPerson', client.contactPerson || '');
          setValue('phone', client.phone || '');
          setValue('email', client.email || '');
          setValue('notes', client.notes || '');
        } else {
          showError('Klient nie został znaleziony');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading client:', error);
        showError('Nie udało się załadować danych klienta');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    loadClient();
  }, [clientId, navigation, setValue, isWeb]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      setLoading(true);

      // Prepare client input - convert empty strings to undefined for optional fields
      const clientInput: ClientInput = {
        name: data.name.trim(),
        address: data.address.trim(),
        contactPerson: data.contactPerson.trim() || undefined,
        phone: data.phone.trim() || undefined,
        email: data.email.trim() || undefined,
        notes: data.notes.trim() || undefined,
      };

      if (isWeb) {
        initWebStorage();
        const now = new Date().toISOString();
        
        if (clientId) {
          // Update existing client on web
          webUpdateClient(clientId, {
            ...clientInput,
            updatedAt: now,
          });
        } else {
          // Create new client on web
          const newClient: Client = {
            id: uuidv4(),
            ...clientInput,
            createdAt: now,
            updatedAt: now,
          };
          webCreateClient(newClient);
        }
      } else {
        // Use SQLite on mobile
        if (clientId) {
          await updateClient(clientId, clientInput);
        } else {
          await createClient(clientInput);
        }
      }

      // Show success message and navigate back
      showSuccess(clientId ? 'Klient zaktualizowany pomyślnie' : 'Klient utworzony pomyślnie');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving client:', error);
      showError(getErrorMessage(error));
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
              label="Name"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              placeholder="Enter client name"
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
              placeholder="Enter client address"
              multiline
              numberOfLines={2}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="contactPerson"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Contact Person"
              value={value}
              onChangeText={onChange}
              error={errors.contactPerson?.message}
              placeholder="Enter contact person name"
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Phone"
              value={value}
              onChangeText={onChange}
              error={errors.phone?.message}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{
            validate: (value) => {
              // Email is optional, but if provided, must be valid
              if (!value || value.trim() === '') {
                return true;
              }
              return validateEmail(value) || 'Invalid email format';
            },
          }}
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Email"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              placeholder="Enter email address"
              keyboardType="email-address"
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
          {clientId ? 'Update Client' : 'Save Client'}
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
