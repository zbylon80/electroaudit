import { VisualInspection, VisualInspectionInput } from '../types';
import { generateUUID, boolToInt, intToBool } from '../utils';
import { querySql, executeSql } from './database';

/**
 * VisualInspectionService - Handles all CRUD operations for visual inspections
 */

/**
 * Create or update a visual inspection (UPSERT logic)
 * Uses INSERT OR REPLACE to handle both creation and updates
 * @param inspectionData - Visual inspection data without id, createdAt, updatedAt
 * @returns Created or updated visual inspection
 */
export const createOrUpdateVisualInspection = async (
  inspectionData: VisualInspectionInput
): Promise<VisualInspection> => {
  try {
    // Check if a visual inspection already exists for this order
    const existing = await getVisualInspectionByOrder(inspectionData.inspectionOrderId);
    
    const id = existing?.id ?? generateUUID();
    const now = new Date().toISOString();
    const createdAt = existing?.createdAt ?? now;
    
    const inspection: VisualInspection = {
      id,
      ...inspectionData,
      createdAt,
      updatedAt: now,
    };
    
    // Use INSERT OR REPLACE for UPSERT logic
    await executeSql(
      `INSERT OR REPLACE INTO visual_inspections (
        id, inspectionOrderId, summary, defectsFound, recommendations,
        visualResultPass, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inspection.id,
        inspection.inspectionOrderId,
        inspection.summary,
        inspection.defectsFound ?? null,
        inspection.recommendations ?? null,
        inspection.visualResultPass !== undefined ? boolToInt(inspection.visualResultPass) : null,
        inspection.createdAt,
        inspection.updatedAt,
      ]
    );
    
    return inspection;
  } catch (error) {
    console.error('Error creating or updating visual inspection:', error);
    throw new Error(
      `Failed to create or update visual inspection: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get visual inspection by inspection order ID
 * @param orderId - Inspection order ID
 * @returns Visual inspection or null if not found
 */
export const getVisualInspectionByOrder = async (
  orderId: string
): Promise<VisualInspection | null> => {
  try {
    const results = await querySql(
      'SELECT * FROM visual_inspections WHERE inspectionOrderId = ?',
      [orderId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    return rowToVisualInspection(results[0]);
  } catch (error) {
    console.error('Error getting visual inspection by order:', error);
    throw new Error(
      `Failed to get visual inspection by order: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Helper function to convert database row to VisualInspection
 */
const rowToVisualInspection = (row: any): VisualInspection => {
  return {
    id: row.id,
    inspectionOrderId: row.inspectionOrderId,
    summary: row.summary,
    defectsFound: row.defectsFound ?? undefined,
    recommendations: row.recommendations ?? undefined,
    visualResultPass: row.visualResultPass !== null ? intToBool(row.visualResultPass) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
