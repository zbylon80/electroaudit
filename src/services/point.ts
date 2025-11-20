import { MeasurementPoint, PointInput, PointType, PointStatus } from '../types';
import { generateUUID } from '../utils';
import { querySql, executeSql } from './database';

/**
 * PointService - Handles all CRUD operations for measurement points
 */

/**
 * Create a new measurement point
 * @param pointData - Point data without id, createdAt, updatedAt
 * @returns Created point with generated id and timestamps
 */
export const createPoint = async (pointData: PointInput): Promise<MeasurementPoint> => {
  try {
    // Validate point type against enum values (Requirement 4.2)
    if (!Object.values(PointType).includes(pointData.type)) {
      throw new Error(`Invalid point type: ${pointData.type}. Must be one of: ${Object.values(PointType).join(', ')}`);
    }
    
    const id = generateUUID();
    const now = new Date().toISOString();
    
    const point: MeasurementPoint = {
      id,
      ...pointData,
      createdAt: now,
      updatedAt: now,
    };
    
    await executeSql(
      `INSERT INTO measurement_points (id, inspectionOrderId, roomId, label, type, circuitSymbol, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        point.id,
        point.inspectionOrderId,
        point.roomId ?? null,
        point.label,
        point.type,
        point.circuitSymbol ?? null,
        point.notes ?? null,
        point.createdAt,
        point.updatedAt,
      ]
    );
    
    return point;
  } catch (error) {
    console.error('Error creating measurement point:', error);
    throw new Error(`Failed to create measurement point: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all measurement points for a specific inspection order
 * @param orderId - Inspection order ID
 * @returns Array of measurement points for the order
 */
export const getPointsByOrder = async (orderId: string): Promise<MeasurementPoint[]> => {
  try {
    const results = await querySql(
      'SELECT * FROM measurement_points WHERE inspectionOrderId = ? ORDER BY label ASC',
      [orderId]
    );
    
    return results.map(row => rowToPoint(row));
  } catch (error) {
    console.error('Error getting points by order:', error);
    throw new Error(`Failed to get points by order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all measurement points for a specific room
 * @param roomId - Room ID
 * @returns Array of measurement points for the room
 */
export const getPointsByRoom = async (roomId: string): Promise<MeasurementPoint[]> => {
  try {
    const results = await querySql(
      'SELECT * FROM measurement_points WHERE roomId = ? ORDER BY label ASC',
      [roomId]
    );
    
    return results.map(row => rowToPoint(row));
  } catch (error) {
    console.error('Error getting points by room:', error);
    throw new Error(`Failed to get points by room: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing measurement point
 * @param id - Point ID
 * @param pointData - Updated point data
 */
export const updatePoint = async (id: string, pointData: PointInput): Promise<void> => {
  try {
    // Validate point type against enum values (Requirement 4.2)
    if (!Object.values(PointType).includes(pointData.type)) {
      throw new Error(`Invalid point type: ${pointData.type}. Must be one of: ${Object.values(PointType).join(', ')}`);
    }
    
    const now = new Date().toISOString();
    
    await executeSql(
      `UPDATE measurement_points 
       SET inspectionOrderId = ?, roomId = ?, label = ?, type = ?, circuitSymbol = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        pointData.inspectionOrderId,
        pointData.roomId ?? null,
        pointData.label,
        pointData.type,
        pointData.circuitSymbol ?? null,
        pointData.notes ?? null,
        now,
        id,
      ]
    );
  } catch (error) {
    console.error('Error updating measurement point:', error);
    throw new Error(`Failed to update measurement point: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a measurement point
 * @param id - Point ID
 */
export const deletePoint = async (id: string): Promise<void> => {
  try {
    await executeSql('DELETE FROM measurement_points WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting measurement point:', error);
    throw new Error(`Failed to delete measurement point: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get the status of a measurement point based on whether results exist and pass/fail flags
 * @param id - Point ID
 * @returns Point status (unmeasured/ok/not_ok)
 */
export const getPointStatus = async (id: string): Promise<PointStatus> => {
  try {
    // Query for measurement result associated with this point
    const results = await querySql(
      'SELECT * FROM measurement_results WHERE measurementPointId = ?',
      [id]
    );
    
    // If no result exists, status is unmeasured (Requirement 4.6)
    if (results.length === 0) {
      return PointStatus.UNMEASURED;
    }
    
    const result = results[0];
    
    // Check all pass/fail flags that are not null
    // If any flag is false (0 in SQLite), status is NOT_OK
    // If all flags are true (1 in SQLite) or null, status is OK
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
    
    // Filter out null values and check if any remaining flag is false (0)
    const hasFailure = passFlags.some(flag => flag !== null && flag === 0);
    
    return hasFailure ? PointStatus.NOT_OK : PointStatus.OK;
  } catch (error) {
    console.error('Error getting point status:', error);
    throw new Error(`Failed to get point status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Helper function to convert database row to MeasurementPoint
 */
const rowToPoint = (row: any): MeasurementPoint => {
  return {
    id: row.id,
    inspectionOrderId: row.inspectionOrderId,
    roomId: row.roomId ?? undefined,
    label: row.label,
    type: row.type as PointType,
    circuitSymbol: row.circuitSymbol ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
