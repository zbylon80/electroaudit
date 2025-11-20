import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Platform } from 'react-native';
import { FAB, Chip, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { InspectionOrder, OrderStatus } from '../types';
import { getAllOrders } from '../services/order';
import { getClient } from '../services/client';
import { Card, EmptyState } from '../components';

type OrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrdersScreen'>;

interface OrderWithClient extends InspectionOrder {
  clientName: string;
}

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithClient[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  const loadOrders = async () => {
    try {
      if (isWeb) {
        // On web, show empty state since SQLite is not available
        setOrders([]);
        setFilteredOrders([]);
        setLoading(false);
        return;
      }

      const allOrders = await getAllOrders();
      
      // Fetch client names for each order
      const ordersWithClients = await Promise.all(
        allOrders.map(async (order) => {
          const client = await getClient(order.clientId);
          return {
            ...order,
            clientName: client?.name || 'Unknown Client',
          };
        })
      );
      
      setOrders(ordersWithClients);
      filterOrders(ordersWithClients, selectedStatus);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (ordersList: OrderWithClient[], status: OrderStatus | 'all') => {
    if (status === 'all') {
      setFilteredOrders(ordersList);
    } else {
      setFilteredOrders(ordersList.filter(order => order.status === status));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setSelectedStatus(status);
    filterOrders(orders, status);
  };

  const handleAddOrder = () => {
    navigation.navigate('OrderFormScreen', {});
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetailsScreen', { orderId });
  };

  // Load orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.DRAFT:
        return '#FFA726';
      case OrderStatus.IN_PROGRESS:
        return '#42A5F5';
      case OrderStatus.DONE:
        return '#66BB6A';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.DRAFT:
        return 'Draft';
      case OrderStatus.IN_PROGRESS:
        return 'In Progress';
      case OrderStatus.DONE:
        return 'Done';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderOrderCard = ({ item }: { item: OrderWithClient }) => (
    <Card onPress={() => handleOrderPress(item.id)} style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Chip
          mode="flat"
          style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
          textStyle={styles.statusChipText}
        >
          {getStatusLabel(item.status)}
        </Chip>
      </View>
      <Text style={styles.objectName}>{item.objectName}</Text>
      <Text style={styles.address}>{item.address}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Created: {formatDate(item.createdAt)}
        </Text>
        {item.scheduledDate && (
          <Text style={styles.dateText}>
            Scheduled: {formatDate(item.scheduledDate)}
          </Text>
        )}
      </View>
    </Card>
  );

  if (isWeb) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Web Platform"
          message="Database features are not available on web. Please use Android emulator or device."
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={selectedStatus === 'all'}
          onPress={() => handleStatusFilter('all')}
          style={styles.filterChip}
        >
          All ({orders.length})
        </Chip>
        <Chip
          selected={selectedStatus === OrderStatus.DRAFT}
          onPress={() => handleStatusFilter(OrderStatus.DRAFT)}
          style={styles.filterChip}
        >
          Draft ({orders.filter(o => o.status === OrderStatus.DRAFT).length})
        </Chip>
        <Chip
          selected={selectedStatus === OrderStatus.IN_PROGRESS}
          onPress={() => handleStatusFilter(OrderStatus.IN_PROGRESS)}
          style={styles.filterChip}
        >
          In Progress ({orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length})
        </Chip>
        <Chip
          selected={selectedStatus === OrderStatus.DONE}
          onPress={() => handleStatusFilter(OrderStatus.DONE)}
          style={styles.filterChip}
        >
          Done ({orders.filter(o => o.status === OrderStatus.DONE).length})
        </Chip>
      </View>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Orders"
          message={
            selectedStatus === 'all'
              ? 'Create your first inspection order to get started'
              : `No orders with status "${getStatusLabel(selectedStatus as OrderStatus)}"`
          }
          actionLabel="Add Order"
          onAction={handleAddOrder}
          icon="plus"
        />
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
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
        onPress={handleAddOrder}
        label="Add Order"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 80,
  },
  orderCard: {
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  objectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
