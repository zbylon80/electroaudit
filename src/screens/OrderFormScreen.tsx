import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type OrderFormScreenRouteProp = RouteProp<RootStackParamList, 'OrderFormScreen'>;

export const OrderFormScreen: React.FC = () => {
  const route = useRoute<OrderFormScreenRouteProp>();
  const { orderId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {orderId ? 'Edit Order' : 'Create Order'}
      </Text>
      <Text style={styles.subtext}>Order form will be implemented here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});
