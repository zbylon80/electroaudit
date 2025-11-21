import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Platform, Alert, TextInput as RNTextInput } from 'react-native';
import { FAB, Text, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Client } from '../types';
import { getAllClients, deleteClient } from '../services/client';
import { getAllOrders } from '../services/order';
import { Card, EmptyState } from '../components';
import { 
  webGetAllClients, 
  webDeleteClient, 
  webGetAllOrders,
  initWebStorage 
} from '../services/webStorage';

type ClientsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientsScreen'>;

export const ClientsScreen: React.FC = () => {
  const navigation = useNavigation<ClientsScreenNavigationProp>();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  const loadClients = async () => {
    try {
      let allClients: Client[];
      
      if (isWeb) {
        initWebStorage();
        allClients = webGetAllClients();
      } else {
        allClients = await getAllClients();
      }
      
      setClients(allClients);
      filterClients(allClients, searchQuery);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = (clientsList: Client[], query: string) => {
    if (!query || query.trim() === '') {
      setFilteredClients(clientsList);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = clientsList.filter(client => {
      const nameMatch = client.name.toLowerCase().includes(lowerQuery);
      const addressMatch = client.address.toLowerCase().includes(lowerQuery);
      const contactMatch = client.contactPerson?.toLowerCase().includes(lowerQuery) || false;
      
      return nameMatch || addressMatch || contactMatch;
    });
    
    setFilteredClients(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterClients(clients, query);
  };

  const handleAddClient = () => {
    navigation.navigate('ClientFormScreen', {});
  };

  const handleClientPress = (clientId: string) => {
    navigation.navigate('ClientFormScreen', { clientId });
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    try {
      // Check if client has associated orders
      let hasOrders = false;
      
      if (isWeb) {
        const orders = webGetAllOrders();
        hasOrders = orders.some(order => order.clientId === clientId);
      } else {
        const orders = await getAllOrders();
        hasOrders = orders.some(order => order.clientId === clientId);
      }

      if (hasOrders) {
        // Prevent deletion - show warning message
        Alert.alert(
          'Cannot Delete Client',
          `Cannot delete "${clientName}" because they have associated inspection orders. Please delete or reassign the orders first.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Delete Client',
        `Are you sure you want to delete "${clientName}"?`,
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
                if (isWeb) {
                  webDeleteClient(clientId);
                } else {
                  await deleteClient(clientId);
                }
                await loadClients();
              } catch (error) {
                console.error('Error deleting client:', error);
                Alert.alert('Error', 'Failed to delete client. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error checking client orders:', error);
      Alert.alert('Error', 'Failed to check client orders. Please try again.');
    }
  };

  // Load clients when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  useEffect(() => {
    loadClients();
  }, []);

  const renderClientCard = ({ item }: { item: Client }) => (
    <Card onPress={() => handleClientPress(item.id)} style={styles.clientCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardContent}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>
          {item.contactPerson && (
            <Text style={styles.contactInfo}>Contact: {item.contactPerson}</Text>
          )}
          {item.phone && (
            <Text style={styles.contactInfo}>Phone: {item.phone}</Text>
          )}
        </View>
        <IconButton
          icon="delete"
          iconColor="#d32f2f"
          size={24}
          onPress={() => handleDeleteClient(item.id, item.name)}
        />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading clients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <RNTextInput
          style={styles.searchInput}
          placeholder="Search by name, address, or contact person..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <IconButton
            icon="close"
            size={20}
            onPress={() => handleSearchChange('')}
            style={styles.clearButton}
          />
        )}
      </View>

      {/* Clients list */}
      {filteredClients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title={searchQuery ? 'No Clients Found' : 'No Clients'}
            message={
              searchQuery
                ? `No clients match "${searchQuery}"`
                : 'Create your first client to get started'
            }
            actionLabel={searchQuery ? undefined : 'Add Client'}
            onAction={searchQuery ? undefined : handleAddClient}
            icon={searchQuery ? 'magnify' : 'plus'}
          />
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddClient}
        label="Add Client"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  clearButton: {
    margin: 0,
  },
  listContent: {
    paddingBottom: 80,
  },
  clientCard: {
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
  emptyContainer: {
    flex: 1,
  },
});
