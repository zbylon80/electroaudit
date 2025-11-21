import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator params
export type RootStackParamList = {
  OrdersScreen: undefined;
  OrderFormScreen: { orderId?: string };
  ClientFormScreen: { clientId?: string };
  OrderDetailsScreen: { orderId: string };
  RoomFormScreen: { orderId: string; roomId?: string };
  PointFormScreen: { orderId: string; pointId?: string; roomId?: string };
  MeasurementFormScreen: { orderId: string; pointId: string };
};

// Type-safe navigation props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
