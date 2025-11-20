import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type MeasurementFormScreenRouteProp = RouteProp<RootStackParamList, 'MeasurementFormScreen'>;

export const MeasurementFormScreen: React.FC = () => {
  const route = useRoute<MeasurementFormScreenRouteProp>();
  const { orderId, pointId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Record Measurements</Text>
      <Text style={styles.subtext}>Order ID: {orderId}</Text>
      <Text style={styles.subtext}>Point ID: {pointId}</Text>
      <Text style={styles.subtext}>Measurement form will be implemented here</Text>
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
    marginTop: 4,
  },
});
