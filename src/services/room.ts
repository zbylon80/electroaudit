import { Room, RoomInput } from '../types';
import { generateUUID } from '../utils';
import { querySql, executeSql } from './database';

/**
 * RoomService - Handles all CRUD operations for rooms
 */

/**
 * Create a new room
 * @param roomData - Room data without id, createdAt, updatedAt
 * @returns Created room with generated id and timestamps
 */
export const createRoom = async (roomData: RoomInput): Promise<Room> => {
  try {
    const id = generateUUID();
    const now = new Date().toISOString();
    
    const room: Room = {
      id,
      ...roomData,
      createdAt: now,
      updatedAt: now,
    };
    
    await executeSql(
      `INSERT INTO rooms (id, inspectionOrderId, name, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        room.id,
        room.inspectionOrderId,
        room.name,
        room.notes ?? null,
        room.createdAt,
        room.updatedAt,
      ]
    );
    
    return room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get a single room by ID
 * @param id - Room ID
 * @returns Room or null if not found
 */
export const getRoom = async (id: string): Promise<Room | null> => {
  try {
    const results = await querySql(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const row = results[0];
    return {
      id: row.id,
      inspectionOrderId: row.inspectionOrderId,
      name: row.name,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error getting room:', error);
    throw new Error(`Failed to get room: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all rooms for a specific inspection order
 * @param orderId - Inspection order ID
 * @returns Array of rooms for the order
 */
export const getRoomsByOrder = async (orderId: string): Promise<Room[]> => {
  try {
    const results = await querySql(
      'SELECT * FROM rooms WHERE inspectionOrderId = ? ORDER BY createdAt ASC',
      [orderId]
    );
    
    return results.map(row => ({
      id: row.id,
      inspectionOrderId: row.inspectionOrderId,
      name: row.name,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Error getting rooms by order:', error);
    throw new Error(`Failed to get rooms by order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing room
 * @param id - Room ID
 * @param roomData - Updated room data
 */
export const updateRoom = async (id: string, roomData: RoomInput): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    await executeSql(
      `UPDATE rooms 
       SET inspectionOrderId = ?, name = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        roomData.inspectionOrderId,
        roomData.name,
        roomData.notes ?? null,
        now,
        id,
      ]
    );
  } catch (error) {
    console.error('Error updating room:', error);
    throw new Error(`Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a room
 * When a room is deleted, associated measurement points will have their roomId set to null
 * due to the ON DELETE SET NULL constraint in the database schema
 * @param id - Room ID
 */
export const deleteRoom = async (id: string): Promise<void> => {
  try {
    await executeSql('DELETE FROM rooms WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
