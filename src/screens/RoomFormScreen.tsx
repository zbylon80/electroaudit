import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type RoomFormScreenRouteProp = RouteProp<RootStackParamList, 'RoomFormScreen'>;

export const RoomFormScreen: React.FC = () => {
  const route = useRoute<RoomFormScreenRouteProp>();
  const { orderId, roomId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {roomId ? 'Edit Room' : 'Add Room'}
      </Text>
      <Text style={styles.subtext}>Order ID: {orderId}</Text>
      <Text style={styles.subtext}>Room form will be implemented here</Text>
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
