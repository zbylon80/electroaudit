import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { RootStackParamList } from './types';
import {
  OrdersScreen,
  ClientsScreen,
  OrderFormScreen,
  ClientFormScreen,
  OrderDetailsScreen,
  RoomFormScreen,
  PointFormScreen,
  MeasurementFormScreen,
} from '../screens';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main screens
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="OrdersScreen"
        component={OrdersScreen}
        options={{
          title: 'Inspection Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Icon source="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ClientsScreen"
        component={ClientsScreen}
        options={{
          title: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-group" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
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
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false, // Hide header for tabs, tabs will show their own headers
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
