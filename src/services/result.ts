import { MeasurementResult, ResultInput } from '../types';
import { generateUUID, boolToInt, intToBool } from '../utils';
import { querySql, executeSql } from './database';

/**
 * ResultService - Handles all CRUD operations for measurement results
 */

/**
 * Create or update a measurement result (UPSERT logic)
 * Uses INSERT OR REPLACE to handle both creation and updates
 * @param resultData - Result data without id, createdAt, updatedAt
 * @returns Created or updated measurement result
 */
export const createOrUpdateResult = async (resultData: ResultInput): Promise<MeasurementResult> => {
  try {
    // Check if a result already exists for this measurement point
    const existing = await getResultByPoint(resultData.measurementPointId);
    
    const id = existing?.id ?? generateUUID();
    const now = new Date().toISOString();
    const createdAt = existing?.createdAt ?? now;
    
    const result: MeasurementResult = {
      id,
      ...resultData,
      createdAt,
      updatedAt: now,
    };
    
    // Use INSERT OR REPLACE for UPSERT logic
    await executeSql(
      `INSERT OR REPLACE INTO measurement_results (
        id, measurementPointId,
        loopImpedance, loopResultPass,
        insulationLn, insulationLpe, insulationNpe, insulationResultPass,
        rcdType, rcdRatedCurrent, rcdTime1x, rcdTime5x, rcdResultPass,
        peResistance, peResultPass,
        earthingResistance, earthingResultPass,
        polarityOk, phaseSequenceOk,
        breakerCheckOk,
        lpsEarthingResistance, lpsContinuityOk, lpsVisualOk,
        comments,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.measurementPointId,
        result.loopImpedance ?? null,
        result.loopResultPass !== undefined ? boolToInt(result.loopResultPass) : null,
        result.insulationLn ?? null,
        result.insulationLpe ?? null,
        result.insulationNpe ?? null,
        result.insulationResultPass !== undefined ? boolToInt(result.insulationResultPass) : null,
        result.rcdType ?? null,
        result.rcdRatedCurrent ?? null,
        result.rcdTime1x ?? null,
        result.rcdTime5x ?? null,
        result.rcdResultPass !== undefined ? boolToInt(result.rcdResultPass) : null,
        result.peResistance ?? null,
        result.peResultPass !== undefined ? boolToInt(result.peResultPass) : null,
        result.earthingResistance ?? null,
        result.earthingResultPass !== undefined ? boolToInt(result.earthingResultPass) : null,
        result.polarityOk !== undefined ? boolToInt(result.polarityOk) : null,
        result.phaseSequenceOk !== undefined ? boolToInt(result.phaseSequenceOk) : null,
        result.breakerCheckOk !== undefined ? boolToInt(result.breakerCheckOk) : null,
        result.lpsEarthingResistance ?? null,
        result.lpsContinuityOk !== undefined ? boolToInt(result.lpsContinuityOk) : null,
        result.lpsVisualOk !== undefined ? boolToInt(result.lpsVisualOk) : null,
        result.comments ?? null,
        result.createdAt,
        result.updatedAt,
      ]
    );
    
    return result;
  } catch (error) {
    console.error('Error creating or updating measurement result:', error);
    throw new Error(`Failed to create or update measurement result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get measurement result by measurement point ID
 * @param pointId - Measurement point ID
 * @returns Measurement result or null if not found
 */
export const getResultByPoint = async (pointId: string): Promise<MeasurementResult | null> => {
  try {
    const results = await querySql(
      'SELECT * FROM measurement_results WHERE measurementPointId = ?',
      [pointId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    return rowToResult(results[0]);
  } catch (error) {
    console.error('Error getting result by point:', error);
    throw new Error(`Failed to get result by point: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a measurement result
 * @param id - Result ID
 */
export const deleteResult = async (id: string): Promise<void> => {
  try {
    await executeSql('DELETE FROM measurement_results WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting measurement result:', error);
    throw new Error(`Failed to delete measurement result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Helper function to convert database row to MeasurementResult
 */
const rowToResult = (row: any): MeasurementResult => {
  return {
    id: row.id,
    measurementPointId: row.measurementPointId,
    loopImpedance: row.loopImpedance ?? undefined,
    loopResultPass: row.loopResultPass !== null ? intToBool(row.loopResultPass) : undefined,
    insulationLn: row.insulationLn ?? undefined,
    insulationLpe: row.insulationLpe ?? undefined,
    insulationNpe: row.insulationNpe ?? undefined,
    insulationResultPass: row.insulationResultPass !== null ? intToBool(row.insulationResultPass) : undefined,
    rcdType: row.rcdType ?? undefined,
    rcdRatedCurrent: row.rcdRatedCurrent ?? undefined,
    rcdTime1x: row.rcdTime1x ?? undefined,
    rcdTime5x: row.rcdTime5x ?? undefined,
    rcdResultPass: row.rcdResultPass !== null ? intToBool(row.rcdResultPass) : undefined,
    peResistance: row.peResistance ?? undefined,
    peResultPass: row.peResultPass !== null ? intToBool(row.peResultPass) : undefined,
    earthingResistance: row.earthingResistance ?? undefined,
    earthingResultPass: row.earthingResultPass !== null ? intToBool(row.earthingResultPass) : undefined,
    polarityOk: row.polarityOk !== null ? intToBool(row.polarityOk) : undefined,
    phaseSequenceOk: row.phaseSequenceOk !== null ? intToBool(row.phaseSequenceOk) : undefined,
    breakerCheckOk: row.breakerCheckOk !== null ? intToBool(row.breakerCheckOk) : undefined,
    lpsEarthingResistance: row.lpsEarthingResistance ?? undefined,
    lpsContinuityOk: row.lpsContinuityOk !== null ? intToBool(row.lpsContinuityOk) : undefined,
    lpsVisualOk: row.lpsVisualOk !== null ? intToBool(row.lpsVisualOk) : undefined,
    comments: row.comments ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
