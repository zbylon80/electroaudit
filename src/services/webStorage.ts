/**
 * Web Storage - localStorage-based implementation for web platform
 * This provides the same interface as SQLite services but uses localStorage
 */

import { Client, InspectionOrder, Room } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'electroaudit_clients',
  ORDERS: 'electroaudit_orders',
  ROOMS: 'electroaudit_rooms',
  POINTS: 'electroaudit_points',
  RESULTS: 'electroaudit_results',
  VISUAL_INSPECTIONS: 'electroaudit_visual_inspections',
};

// Helper functions
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

// Client operations
export const webGetAllClients = (): Client[] => {
  return getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
};

export const webGetClient = (id: string): Client | null => {
  const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
  return clients.find(c => c.id === id) || null;
};

export const webCreateClient = (client: Client): void => {
  const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
  clients.push(client);
  saveToStorage(STORAGE_KEYS.CLIENTS, clients);
};

export const webUpdateClient = (id: string, updatedClient: Partial<Client>): void => {
  const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = { ...clients[index], ...updatedClient };
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
  }
};

export const webDeleteClient = (id: string): void => {
  const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
  const filtered = clients.filter(c => c.id !== id);
  saveToStorage(STORAGE_KEYS.CLIENTS, filtered);
};

// Order operations
export const webGetAllOrders = (statusFilter?: string): InspectionOrder[] => {
  const orders = getFromStorage<InspectionOrder>(STORAGE_KEYS.ORDERS);
  if (statusFilter) {
    return orders.filter(o => o.status === statusFilter);
  }
  return orders;
};

export const webGetOrder = (id: string): InspectionOrder | null => {
  const orders = getFromStorage<InspectionOrder>(STORAGE_KEYS.ORDERS);
  return orders.find(o => o.id === id) || null;
};

export const webCreateOrder = (order: InspectionOrder): void => {
  const orders = getFromStorage<InspectionOrder>(STORAGE_KEYS.ORDERS);
  orders.push(order);
  saveToStorage(STORAGE_KEYS.ORDERS, orders);
};

export const webUpdateOrder = (id: string, updatedOrder: Partial<InspectionOrder>): void => {
  const orders = getFromStorage<InspectionOrder>(STORAGE_KEYS.ORDERS);
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updatedOrder };
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  }
};

export const webDeleteOrder = (id: string): void => {
  const orders = getFromStorage<InspectionOrder>(STORAGE_KEYS.ORDERS);
  const filtered = orders.filter(o => o.id !== id);
  saveToStorage(STORAGE_KEYS.ORDERS, filtered);
};

// Initialize web storage with empty arrays
export const initWebStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    saveToStorage(STORAGE_KEYS.CLIENTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    saveToStorage(STORAGE_KEYS.ORDERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    saveToStorage(STORAGE_KEYS.ROOMS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POINTS)) {
    saveToStorage(STORAGE_KEYS.POINTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) {
    saveToStorage(STORAGE_KEYS.RESULTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.VISUAL_INSPECTIONS)) {
    saveToStorage(STORAGE_KEYS.VISUAL_INSPECTIONS, []);
  }
  console.log('Web storage initialized successfully');
};

// Room operations
export const webGetRoomsByOrder = (orderId: string): Room[] => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  return rooms.filter(r => r.inspectionOrderId === orderId).sort((a, b) => a.name.localeCompare(b.name));
};

export const webCreateRoom = (room: Room): void => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  rooms.push(room);
  saveToStorage(STORAGE_KEYS.ROOMS, rooms);
};

export const webUpdateRoom = (id: string, updatedRoom: Partial<Room>): void => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const index = rooms.findIndex(r => r.id === id);
  if (index !== -1) {
    rooms[index] = { ...rooms[index], ...updatedRoom };
    saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  }
};

export const webDeleteRoom = (id: string): void => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const filtered = rooms.filter(r => r.id !== id);
  saveToStorage(STORAGE_KEYS.ROOMS, filtered);
  
  // Set roomId to null for associated measurement points
  const points = getFromStorage<any>(STORAGE_KEYS.POINTS);
  const updatedPoints = points.map(p => 
    p.roomId === id ? { ...p, roomId: null } : p
  );
  saveToStorage(STORAGE_KEYS.POINTS, updatedPoints);
};

// Clear all data (useful for testing)
export const clearWebStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initWebStorage();
};
