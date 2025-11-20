import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const OrdersScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Orders Screen</Text>
      <Text style={styles.subtext}>Order list will be implemented here</Text>
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
