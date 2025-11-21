import { MeasurementResult, ResultInput, PointType } from '../types';
import { generateUUID, boolToInt, intToBool } from '../utils';
import { querySql, executeSql } from './database';
import { getPoint } from './point';

/**
 * ResultService - Handles all CRUD operations for measurement results
 */

/**
 * Sanitize result data based on point type - removes fields that are not relevant
 * @param resultData - Raw result data
 * @param pointType - Type of measurement point
 * @returns Sanitized result data with only relevant fields
 */
const sanitizeResultData = (resultData: ResultInput, pointType: PointType): ResultInput => {
  const sanitized: ResultInput = {
    measurementPointId: resultData.measurementPointId,
    comments: resultData.comments,
  };

  // Common fields for socket types and lighting
  if (pointType === PointType.SOCKET_1P || pointType === PointType.SOCKET_3P || pointType === PointType.LIGHTING) {
    sanitized.loopImpedance = resultData.loopImpedance;
    sanitized.loopResultPass = resultData.loopResultPass;
  }

  // Type-specific fields
  switch (pointType) {
    case PointType.SOCKET_1P:
      // 1-phase socket: only polarity
      sanitized.polarityOk = resultData.polarityOk;
      break;

    case PointType.SOCKET_3P:
      // 3-phase socket: only phase sequence
      sanitized.phaseSequenceOk = resultData.phaseSequenceOk;
      break;

    case PointType.LIGHTING:
      // Lighting: only polarity
      sanitized.polarityOk = resultData.polarityOk;
      break;

    case PointType.RCD:
      // RCD: specific RCD fields
      sanitized.rcdType = resultData.rcdType;
      sanitized.rcdRatedCurrent = resultData.rcdRatedCurrent;
      sanitized.rcdTime1x = resultData.rcdTime1x;
      sanitized.rcdTime5x = resultData.rcdTime5x;
      sanitized.rcdResultPass = resultData.rcdResultPass;
      break;

    case PointType.EARTHING:
      // Earthing: specific earthing fields
      sanitized.earthingResistance = resultData.earthingResistance;
      sanitized.earthingResultPass = resultData.earthingResultPass;
      break;

    case PointType.LPS:
      // LPS: specific LPS fields
      sanitized.lpsEarthingResistance = resultData.lpsEarthingResistance;
      sanitized.lpsContinuityOk = resultData.lpsContinuityOk;
      sanitized.lpsVisualOk = resultData.lpsVisualOk;
      break;

    case PointType.OTHER:
      // OTHER: allow all fields (no filtering)
      return resultData;
  }

  return sanitized;
};

/**
 * Create or update a measurement result (UPSERT logic)
 * Uses INSERT OR REPLACE to handle both creation and updates
 * @param resultData - Result data without id, createdAt, updatedAt
 * @returns Created or updated measurement result
 */
export const createOrUpdateResult = async (resultData: ResultInput): Promise<MeasurementResult> => {
  try {
    // Get the measurement point to determine its type
    const point = await getPoint(resultData.measurementPointId);
    if (!point) {
      throw new Error(`Measurement point not found: ${resultData.measurementPointId}`);
    }

    // Sanitize the result data based on point type
    const sanitizedData = sanitizeResultData(resultData, point.type);

    // Check if a result already exists for this measurement point
    const existing = await getResultByPoint(sanitizedData.measurementPointId);
    
    const id = existing?.id ?? generateUUID();
    const now = new Date().toISOString();
    const createdAt = existing?.createdAt ?? now;
    
    const result: MeasurementResult = {
      id,
      ...sanitizedData,
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
