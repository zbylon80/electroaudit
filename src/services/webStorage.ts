/**
 * Web Storage - localStorage-based implementation for web platform
 * This provides the same interface as SQLite services but uses localStorage
 */

import { Client, InspectionOrder, Room, MeasurementPoint, MeasurementResult, PointStatus } from '../types';

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

  // Cascade delete related rooms, points, results and visual inspections to mirror SQLite FK behavior
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const remainingRooms = rooms.filter(r => r.inspectionOrderId !== id);
  const removedRoomIds = new Set(rooms.filter(r => r.inspectionOrderId === id).map(r => r.id));
  saveToStorage(STORAGE_KEYS.ROOMS, remainingRooms);

  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  const remainingPoints = points.filter(p => p.inspectionOrderId !== id);
  const removedPointIds = new Set(points.filter(p => p.inspectionOrderId === id).map(p => p.id));
  saveToStorage(STORAGE_KEYS.POINTS, remainingPoints);

  // Drop results for points that were removed
  const results = getFromStorage<MeasurementResult>(STORAGE_KEYS.RESULTS);
  const remainingResults = results.filter(r => !removedPointIds.has(r.measurementPointId));
  saveToStorage(STORAGE_KEYS.RESULTS, remainingResults);

  // Drop visual inspection for the order if present
  const visualInspections = getFromStorage<any>(STORAGE_KEYS.VISUAL_INSPECTIONS);
  const remainingVisualInspections = visualInspections.filter((vi: any) => vi.inspectionOrderId !== id);
  saveToStorage(STORAGE_KEYS.VISUAL_INSPECTIONS, remainingVisualInspections);
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
export const webGetRoom = (id: string): Room | null => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  return rooms.find(r => r.id === id) || null;
};

export const webGetRoomsByOrder = (orderId: string): Room[] => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  return rooms
    .filter(r => r.inspectionOrderId === orderId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

// Point operations
export const webGetPoint = (id: string): MeasurementPoint | null => {
  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  return points.find(p => p.id === id) || null;
};

export const webGetPointsByOrder = (orderId: string): MeasurementPoint[] => {
  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  return points
    .filter(p => p.inspectionOrderId === orderId)
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const webGetPointsByRoom = (roomId: string): MeasurementPoint[] => {
  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  return points
    .filter(p => p.roomId === roomId)
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const webCreatePoint = (point: MeasurementPoint): void => {
  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  points.push(point);
  saveToStorage(STORAGE_KEYS.POINTS, points);
};

export const webUpdatePoint = (id: string, updatedPoint: Partial<MeasurementPoint>): void => {
  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  const index = points.findIndex(p => p.id === id);
  if (index !== -1) {
    points[index] = { ...points[index], ...updatedPoint };
    saveToStorage(STORAGE_KEYS.POINTS, points);
  }
};

export const webDeletePoint = (id: string): void => {
  const points = getFromStorage<MeasurementPoint>(STORAGE_KEYS.POINTS);
  const filtered = points.filter(p => p.id !== id);
  saveToStorage(STORAGE_KEYS.POINTS, filtered);
  
  // Also delete associated measurement result
  const results = getFromStorage<any>(STORAGE_KEYS.RESULTS);
  const filteredResults = results.filter(r => r.measurementPointId !== id);
  saveToStorage(STORAGE_KEYS.RESULTS, filteredResults);
};

export const webGetPointStatus = (pointId: string): PointStatus => {
  const results = getFromStorage<any>(STORAGE_KEYS.RESULTS);
  const result = results.find(r => r.measurementPointId === pointId);
  
  if (!result) {
    return PointStatus.UNMEASURED;
  }
  
  // Check all pass/fail flags
  const passFlags = [
    result.loopResultPass,
    result.insulationResultPass,
    result.rcdResultPass,
    result.peResultPass,
    result.earthingResultPass,
    result.polarityOk,
    result.phaseSequenceOk,
    result.breakerCheckOk,
    result.lpsContinuityOk,
    result.lpsVisualOk,
  ];
  
  // Filter to only boolean values (ignore null/undefined)
  const definedFlags = passFlags.filter(flag => typeof flag === 'boolean');
  
  // If no flags are defined, consider it unmeasured
  if (definedFlags.length === 0) {
    return PointStatus.UNMEASURED;
  }
  
  // Check if any defined flag is false
  const hasFailure = definedFlags.some(flag => flag === false);
  
  return hasFailure ? PointStatus.NOT_OK : PointStatus.OK;
};

// Result operations
export const webGetResultByPoint = (pointId: string): MeasurementResult | null => {
  const results = getFromStorage<MeasurementResult>(STORAGE_KEYS.RESULTS);
  return results.find(r => r.measurementPointId === pointId) || null;
};

export const webCreateResult = (result: MeasurementResult): void => {
  const results = getFromStorage<MeasurementResult>(STORAGE_KEYS.RESULTS);
  // Remove existing result for this point if any (UPSERT behavior)
  const filtered = results.filter(r => r.measurementPointId !== result.measurementPointId);
  filtered.push(result);
  saveToStorage(STORAGE_KEYS.RESULTS, filtered);
};

// Visual Inspection operations
export const webGetVisualInspectionByOrder = (orderId: string): any | null => {
  const visualInspections = getFromStorage<any>(STORAGE_KEYS.VISUAL_INSPECTIONS);
  return visualInspections.find(vi => vi.inspectionOrderId === orderId) || null;
};

export const webCreateOrUpdateVisualInspection = (visualInspection: any): void => {
  const visualInspections = getFromStorage<any>(STORAGE_KEYS.VISUAL_INSPECTIONS);
  // Remove existing visual inspection for this order if any (UPSERT behavior)
  const filtered = visualInspections.filter(vi => vi.inspectionOrderId !== visualInspection.inspectionOrderId);
  filtered.push(visualInspection);
  saveToStorage(STORAGE_KEYS.VISUAL_INSPECTIONS, filtered);
};

// Clear all data (useful for testing)
export const clearWebStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initWebStorage();
};
