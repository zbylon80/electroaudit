import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Platform } from 'react-native';
import { FAB, Chip, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { InspectionOrder, OrderStatus } from '../types';
import { getAllOrders } from '../services/order';
import { getClient } from '../services/client';
import { Card, EmptyState, Button } from '../components';
import { seedDatabase } from '../utils';
import { 
  webGetAllOrders, 
  webGetClient, 
  webCreateClient, 
  webCreateOrder,
  webCreateRoom,
  webCreatePoint,
  webCreateResult,
  initWebStorage 
} from '../services/webStorage';
import { OrderStatus as OrderStatusEnum, PointType } from '../types';
import { generateUUID } from '../utils';

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
      let allOrders: InspectionOrder[];
      
      if (isWeb) {
        // On web, use localStorage
        initWebStorage();
        allOrders = webGetAllOrders();
      } else {
        // On mobile, use SQLite
        allOrders = await getAllOrders();
      }
      
      // Fetch client names for each order
      const ordersWithClients = isWeb
        ? allOrders.map((order) => {
            const client = webGetClient(order.clientId);
            return {
              ...order,
              clientName: client?.name || 'Unknown Client',
            };
          })
        : await Promise.all(
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

  const handleSeedData = async () => {
    try {
      if (isWeb) {
        // Seed web storage with sample data
        const client1 = {
          id: 'web-client-1',
          name: 'ABC Company',
          address: 'ul. Główna 123, 00-001 Warszawa',
          contactPerson: 'Jan Kowalski',
          phone: '+48 123 456 789',
          email: 'jan.kowalski@abc.pl',
          notes: 'Stały klient',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const client2 = {
          id: 'web-client-2',
          name: 'XYZ Corporation',
          address: 'ul. Przemysłowa 45, 30-002 Kraków',
          contactPerson: 'Anna Nowak',
          phone: '+48 987 654 321',
          email: 'anna.nowak@xyz.pl',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const client3 = {
          id: 'web-client-3',
          name: 'Tech Solutions Sp. z o.o.',
          address: 'al. Niepodległości 78, 50-003 Wrocław',
          phone: '+48 555 123 456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        webCreateClient(client1);
        webCreateClient(client2);
        webCreateClient(client3);
        
        webCreateOrder({
          id: 'web-order-1',
          clientId: client1.id,
          objectName: 'Biurowiec ABC Tower',
          address: 'ul. Główna 123, 00-001 Warszawa',
          scheduledDate: new Date(2024, 11, 15).toISOString(),
          status: OrderStatusEnum.DRAFT,
          notes: 'Przegląd roczny instalacji elektrycznej',
          measureLoopImpedance: true,
          measureInsulation: true,
          measureRcd: true,
          measurePeContinuity: true,
          measureEarthing: true,
          measurePolarity: true,
          measurePhaseSequence: true,
          measureBreakersCheck: true,
          measureLps: false,
          visualInspection: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        webCreateOrder({
          id: 'web-order-2',
          clientId: client2.id,
          objectName: 'Hala produkcyjna XYZ',
          address: 'ul. Przemysłowa 45, 30-002 Kraków',
          scheduledDate: new Date(2024, 11, 20).toISOString(),
          status: OrderStatusEnum.IN_PROGRESS,
          notes: 'Pomiary po modernizacji',
          measureLoopImpedance: true,
          measureInsulation: true,
          measureRcd: true,
          measurePeContinuity: true,
          measureEarthing: true,
          measurePolarity: false,
          measurePhaseSequence: false,
          measureBreakersCheck: true,
          measureLps: true,
          visualInspection: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        webCreateOrder({
          id: 'web-order-3',
          clientId: client3.id,
          objectName: 'Centrum Danych Tech Solutions',
          address: 'al. Niepodległości 78, 50-003 Wrocław',
          scheduledDate: new Date(2024, 10, 10).toISOString(),
          status: OrderStatusEnum.DONE,
          notes: 'Przegląd okresowy - zakończony',
          measureLoopImpedance: true,
          measureInsulation: true,
          measureRcd: true,
          measurePeContinuity: true,
          measureEarthing: true,
          measurePolarity: true,
          measurePhaseSequence: true,
          measureBreakersCheck: true,
          measureLps: true,
          visualInspection: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        webCreateOrder({
          id: 'web-order-4',
          clientId: client1.id,
          objectName: 'Magazyn ABC',
          address: 'ul. Składowa 5, 00-001 Warszawa',
          scheduledDate: new Date(2024, 11, 25).toISOString(),
          status: OrderStatusEnum.DRAFT,
          measureLoopImpedance: true,
          measureInsulation: true,
          measureRcd: false,
          measurePeContinuity: true,
          measureEarthing: true,
          measurePolarity: false,
          measurePhaseSequence: false,
          measureBreakersCheck: true,
          measureLps: false,
          visualInspection: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create rooms for order 1
        webCreateRoom({
          id: 'web-room-1',
          inspectionOrderId: 'web-order-1',
          name: 'Biuro 101',
          notes: 'Pokój konferencyjny',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateRoom({
          id: 'web-room-2',
          inspectionOrderId: 'web-order-1',
          name: 'Biuro 102',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateRoom({
          id: 'web-room-3',
          inspectionOrderId: 'web-order-1',
          name: 'Kuchnia',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create points for order 1
        webCreatePoint({
          id: 'web-point-1',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-1',
          label: 'Gniazdo 1',
          type: PointType.SOCKET,
          circuitSymbol: 'L1.1',
          notes: 'Gniazdo przy biurku',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-2',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-1',
          label: 'Gniazdo 2',
          type: PointType.SOCKET,
          circuitSymbol: 'L1.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-3',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-1',
          label: 'Oświetlenie główne',
          type: PointType.LIGHTING,
          circuitSymbol: 'L2.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-4',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-2',
          label: 'Gniazdo 1',
          type: PointType.SOCKET,
          circuitSymbol: 'L1.3',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-5',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-2',
          label: 'Oświetlenie',
          type: PointType.LIGHTING,
          circuitSymbol: 'L2.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-6',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-3',
          label: 'Gniazdo kuchenne',
          type: PointType.SOCKET,
          circuitSymbol: 'L1.4',
          notes: 'Gniazdo przy blacie',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-7',
          inspectionOrderId: 'web-order-1',
          roomId: 'web-room-3',
          label: 'RCD kuchnia',
          type: PointType.RCD,
          circuitSymbol: 'RCD1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Unassigned point
        webCreatePoint({
          id: 'web-point-8',
          inspectionOrderId: 'web-order-1',
          label: 'Uziemienie główne',
          type: PointType.EARTHING,
          circuitSymbol: 'PE',
          notes: 'Szyna uziemiająca w rozdzielnicy głównej',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create rooms for order 2
        webCreateRoom({
          id: 'web-room-4',
          inspectionOrderId: 'web-order-2',
          name: 'Hala A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateRoom({
          id: 'web-room-5',
          inspectionOrderId: 'web-order-2',
          name: 'Hala B',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create points for order 2
        webCreatePoint({
          id: 'web-point-9',
          inspectionOrderId: 'web-order-2',
          roomId: 'web-room-4',
          label: 'Gniazdo siłowe 1',
          type: PointType.SOCKET,
          circuitSymbol: 'L3.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-10',
          inspectionOrderId: 'web-order-2',
          roomId: 'web-room-4',
          label: 'Oświetlenie halowe',
          type: PointType.LIGHTING,
          circuitSymbol: 'L4.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-11',
          inspectionOrderId: 'web-order-2',
          roomId: 'web-room-5',
          label: 'Gniazdo siłowe 2',
          type: PointType.SOCKET,
          circuitSymbol: 'L3.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-12',
          inspectionOrderId: 'web-order-2',
          label: 'LPS - odgromienie',
          type: PointType.LPS,
          circuitSymbol: 'LPS1',
          notes: 'System odgromowy na dachu',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create rooms, points and results for order 3 (DONE status)
        webCreateRoom({
          id: 'web-room-6',
          inspectionOrderId: 'web-order-3',
          name: 'Serwerownia A',
          notes: 'Główna serwerownia',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateRoom({
          id: 'web-room-7',
          inspectionOrderId: 'web-order-3',
          name: 'Serwerownia B',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateRoom({
          id: 'web-room-8',
          inspectionOrderId: 'web-order-3',
          name: 'UPS Room',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Points with results for order 3
        webCreatePoint({
          id: 'web-point-13',
          inspectionOrderId: 'web-order-3',
          roomId: 'web-room-6',
          label: 'Gniazdo rack 1',
          type: PointType.SOCKET,
          circuitSymbol: 'L5.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateResult({
          id: generateUUID(),
          measurementPointId: 'web-point-13',
          loopImpedance: 0.15,
          loopResultPass: true,
          insulationLn: 450.0,
          insulationLpe: 480.0,
          insulationNpe: 470.0,
          insulationResultPass: true,
          peResistance: 0.08,
          peResultPass: true,
          polarityOk: true,
          phaseSequenceOk: true,
          breakerCheckOk: true,
          comments: 'Wszystkie pomiary w normie',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-14',
          inspectionOrderId: 'web-order-3',
          roomId: 'web-room-6',
          label: 'RCD Serwerownia A',
          type: PointType.RCD,
          circuitSymbol: 'RCD2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateResult({
          id: generateUUID(),
          measurementPointId: 'web-point-14',
          rcdType: 'A',
          rcdRatedCurrent: 30,
          rcdTime1x: 18,
          rcdTime5x: 12,
          rcdResultPass: true,
          comments: 'RCD działa prawidłowo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-15',
          inspectionOrderId: 'web-order-3',
          roomId: 'web-room-7',
          label: 'Gniazdo rack 3',
          type: PointType.SOCKET,
          circuitSymbol: 'L5.3',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateResult({
          id: generateUUID(),
          measurementPointId: 'web-point-15',
          loopImpedance: 0.22,
          loopResultPass: false, // Failed measurement - will show as NOT OK
          insulationLn: 380.0,
          insulationLpe: 390.0,
          insulationNpe: 385.0,
          insulationResultPass: true,
          peResistance: 0.12,
          peResultPass: true,
          polarityOk: true,
          phaseSequenceOk: true,
          breakerCheckOk: true,
          comments: 'Impedancja pętli zwarcia powyżej normy - wymaga naprawy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreatePoint({
          id: 'web-point-16',
          inspectionOrderId: 'web-order-3',
          roomId: 'web-room-8',
          label: 'Zasilanie UPS 1',
          type: PointType.SOCKET,
          circuitSymbol: 'L7.1',
          notes: 'Główny UPS 100kVA',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateResult({
          id: generateUUID(),
          measurementPointId: 'web-point-16',
          loopImpedance: 0.11,
          loopResultPass: true,
          insulationLn: 520.0,
          insulationLpe: 530.0,
          insulationNpe: 525.0,
          insulationResultPass: true,
          peResistance: 0.06,
          peResultPass: true,
          polarityOk: true,
          phaseSequenceOk: true,
          breakerCheckOk: true,
          comments: 'Doskonałe parametry',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Unassigned points with results
        webCreatePoint({
          id: 'web-point-17',
          inspectionOrderId: 'web-order-3',
          label: 'Uziemienie główne DC',
          type: PointType.EARTHING,
          circuitSymbol: 'PE-DC',
          notes: 'Główna szyna uziemiająca centrum danych',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        webCreateResult({
          id: generateUUID(),
          measurementPointId: 'web-point-17',
          earthingResistance: 2.5,
          earthingResultPass: true,
          comments: 'Rezystancja uziemienia w normie',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        console.log('✅ Web storage seeded successfully with rooms, points and measurement results!');
      } else {
        await seedDatabase();
      }
      await loadOrders();
    } catch (error) {
      console.error('Error seeding data:', error);
    }
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
        <View style={styles.emptyContainer}>
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
          {selectedStatus === 'all' && orders.length === 0 && (
            <Button mode="outlined" onPress={handleSeedData} style={styles.seedButton}>
              Load Sample Data (for testing)
            </Button>
          )}
        </View>
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

      {/* Floating Action Button - only show when there are orders */}
      {filteredOrders.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddOrder}
          label="Add Order"
        />
      )}
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
    bottom: 80,
  },
  emptyContainer: {
    flex: 1,
  },
  seedButton: {
    marginHorizontal: 32,
    marginTop: 16,
    marginBottom: 80,
  },
});
