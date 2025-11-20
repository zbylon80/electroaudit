import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import {
  OrdersScreen,
  OrderFormScreen,
  ClientFormScreen,
  OrderDetailsScreen,
  RoomFormScreen,
  PointFormScreen,
  MeasurementFormScreen,
} from '../screens';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="OrdersScreen"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="OrdersScreen"
          component={OrdersScreen}
          options={{
            title: 'Inspection Orders',
            headerLeft: () => null, // No back button on main screen
          }}
        />
        <Stack.Screen
          name="OrderFormScreen"
          component={OrderFormScreen}
          options={({ route }) => ({
            title: route.params?.orderId ? 'Edit Order' : 'Create Order',
          })}
        />
        <Stack.Screen
          name="ClientFormScreen"
          component={ClientFormScreen}
          options={({ route }) => ({
            title: route.params?.clientId ? 'Edit Client' : 'Add Client',
          })}
        />
        <Stack.Screen
          name="OrderDetailsScreen"
          component={OrderDetailsScreen}
          options={{
            title: 'Order Details',
          }}
        />
        <Stack.Screen
          name="RoomFormScreen"
          component={RoomFormScreen}
          options={({ route }) => ({
            title: route.params?.roomId ? 'Edit Room' : 'Add Room',
          })}
        />
        <Stack.Screen
          name="PointFormScreen"
          component={PointFormScreen}
          options={({ route }) => ({
            title: route.params?.pointId ? 'Edit Point' : 'Add Point',
          })}
        />
        <Stack.Screen
          name="MeasurementFormScreen"
          component={MeasurementFormScreen}
          options={{
            title: 'Record Measurements',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
