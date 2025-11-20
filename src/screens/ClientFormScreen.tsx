import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type ClientFormScreenRouteProp = RouteProp<RootStackParamList, 'ClientFormScreen'>;

export const ClientFormScreen: React.FC = () => {
  const route = useRoute<ClientFormScreenRouteProp>();
  const { clientId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {clientId ? 'Edit Client' : 'Create Client'}
      </Text>
      <Text style={styles.subtext}>Client form will be implemented here</Text>
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
