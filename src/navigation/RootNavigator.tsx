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
import { translations as t } from '../constants';

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
          title: t.navigation.orders,
          tabBarLabel: t.navigation.orders,
          tabBarIcon: ({ color, size }) => (
            <Icon source="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ClientsScreen"
        component={ClientsScreen}
        options={{
          title: t.navigation.clients,
          tabBarLabel: t.navigation.clients,
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
            title: route.params?.orderId ? t.screens.orderForm.editOrder : t.screens.orderForm.newOrder,
          })}
        />
        <Stack.Screen
          name="ClientFormScreen"
          component={ClientFormScreen}
          options={({ route }) => ({
            title: route.params?.clientId ? t.screens.clientForm.editClient : t.screens.clientForm.newClient,
          })}
        />
        <Stack.Screen
          name="OrderDetailsScreen"
          component={OrderDetailsScreen}
          options={{
            title: t.screens.orderDetails.title,
          }}
        />
        <Stack.Screen
          name="RoomFormScreen"
          component={RoomFormScreen}
          options={({ route }) => ({
            title: route.params?.roomId ? t.screens.roomForm.editRoom : t.screens.roomForm.newRoom,
          })}
        />
        <Stack.Screen
          name="PointFormScreen"
          component={PointFormScreen}
          options={({ route }) => ({
            title: route.params?.pointId ? t.screens.pointForm.editPoint : t.screens.pointForm.newPoint,
          })}
        />
        <Stack.Screen
          name="MeasurementFormScreen"
          component={MeasurementFormScreen}
          options={{
            title: t.screens.measurementForm.title,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
