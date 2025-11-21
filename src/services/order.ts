import { InspectionOrder, OrderInput, OrderStatus } from '../types';
import { generateUUID, boolToInt, intToBool } from '../utils';
import { querySql, executeSql } from './database';

/**
 * OrderService - Handles all CRUD operations for inspection orders
 */

/**
 * Create a new inspection order
 * @param orderData - Order data without id, createdAt, updatedAt
 * @returns Created order with generated id and timestamps
 */
export const createOrder = async (orderData: OrderInput): Promise<InspectionOrder> => {
  try {
    console.log('createOrder called with data:', orderData);
    const id = generateUUID();
    console.log('Generated order UUID:', id);
    const now = new Date().toISOString();
    
    // Initialize new orders with status "draft" by default (Requirement 2.2)
    // but allow override for testing/seeding purposes
    const order: InspectionOrder = {
      id,
      ...orderData,
      status: orderData.status ?? OrderStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('Executing SQL insert for order:', order);
    await executeSql(
      `INSERT INTO inspection_orders (
        id, clientId, objectName, address, createdAt, scheduledDate, status, notes,
        measureLoopImpedance, measureInsulation, measureRcd, measurePeContinuity,
        measureEarthing, measurePolarity, measurePhaseSequence, measureBreakersCheck,
        measureLps, visualInspection, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.clientId,
        order.objectName,
        order.address,
        order.createdAt,
        order.scheduledDate ?? null,
        order.status,
        order.notes ?? null,
        boolToInt(order.measureLoopImpedance),
        boolToInt(order.measureInsulation),
        boolToInt(order.measureRcd),
        boolToInt(order.measurePeContinuity),
        boolToInt(order.measureEarthing),
        boolToInt(order.measurePolarity),
        boolToInt(order.measurePhaseSequence),
        boolToInt(order.measureBreakersCheck),
        boolToInt(order.measureLps),
        boolToInt(order.visualInspection),
        order.updatedAt,
      ]
    );
    
    console.log('Order created successfully:', order.id);
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get an order by ID
 * @param id - Order ID
 * @returns Order or null if not found
 */
export const getOrder = async (id: string): Promise<InspectionOrder | null> => {
  try {
    const results = await querySql(
      'SELECT * FROM inspection_orders WHERE id = ?',
      [id]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const row = results[0];
    return rowToOrder(row);
  } catch (error) {
    console.error('Error getting order:', error);
    throw new Error(`Failed to get order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all orders, optionally filtered by status
 * @param statusFilter - Optional status to filter by
 * @returns Array of orders
 */
export const getAllOrders = async (statusFilter?: OrderStatus): Promise<InspectionOrder[]> => {
  try {
    let sql = 'SELECT * FROM inspection_orders';
    const params: any[] = [];
    
    if (statusFilter) {
      sql += ' WHERE status = ?';
      params.push(statusFilter);
    }
    
    sql += ' ORDER BY createdAt DESC';
    
    const results = await querySql(sql, params);
    
    return results.map(row => rowToOrder(row));
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw new Error(`Failed to get all orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing order
 * @param id - Order ID
 * @param orderData - Updated order data
 */
export const updateOrder = async (id: string, orderData: OrderInput): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    await executeSql(
      `UPDATE inspection_orders 
       SET clientId = ?, objectName = ?, address = ?, scheduledDate = ?, status = ?, notes = ?,
           measureLoopImpedance = ?, measureInsulation = ?, measureRcd = ?, measurePeContinuity = ?,
           measureEarthing = ?, measurePolarity = ?, measurePhaseSequence = ?, measureBreakersCheck = ?,
           measureLps = ?, visualInspection = ?, updatedAt = ?
       WHERE id = ?`,
      [
        orderData.clientId,
        orderData.objectName,
        orderData.address,
        orderData.scheduledDate ?? null,
        orderData.status,
        orderData.notes ?? null,
        boolToInt(orderData.measureLoopImpedance),
        boolToInt(orderData.measureInsulation),
        boolToInt(orderData.measureRcd),
        boolToInt(orderData.measurePeContinuity),
        boolToInt(orderData.measureEarthing),
        boolToInt(orderData.measurePolarity),
        boolToInt(orderData.measurePhaseSequence),
        boolToInt(orderData.measureBreakersCheck),
        boolToInt(orderData.measureLps),
        boolToInt(orderData.visualInspection),
        now,
        id,
      ]
    );
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update order status
 * @param id - Order ID
 * @param status - New status
 */
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    await executeSql(
      'UPDATE inspection_orders SET status = ?, updatedAt = ? WHERE id = ?',
      [status, now, id]
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete an order
 * @param id - Order ID
 */
export const deleteOrder = async (id: string): Promise<void> => {
  try {
    await executeSql('DELETE FROM inspection_orders WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw new Error(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Helper function to convert database row to InspectionOrder
 */
const rowToOrder = (row: any): InspectionOrder => {
  return {
    id: row.id,
    clientId: row.clientId,
    objectName: row.objectName,
    address: row.address,
    createdAt: row.createdAt,
    scheduledDate: row.scheduledDate ?? undefined,
    status: row.status as OrderStatus,
    notes: row.notes ?? undefined,
    measureLoopImpedance: intToBool(row.measureLoopImpedance),
    measureInsulation: intToBool(row.measureInsulation),
    measureRcd: intToBool(row.measureRcd),
    measurePeContinuity: intToBool(row.measurePeContinuity),
    measureEarthing: intToBool(row.measureEarthing),
    measurePolarity: intToBool(row.measurePolarity),
    measurePhaseSequence: intToBool(row.measurePhaseSequence),
    measureBreakersCheck: intToBool(row.measureBreakersCheck),
    measureLps: intToBool(row.measureLps),
    visualInspection: intToBool(row.visualInspection),
    updatedAt: row.updatedAt,
  };
};
