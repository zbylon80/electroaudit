// Enums
export enum OrderStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum PointType {
  SOCKET = 'socket',
  LIGHTING = 'lighting',
  RCD = 'rcd',
  EARTHING = 'earthing',
  LPS = 'lps',
  OTHER = 'other'
}

export enum PointStatus {
  UNMEASURED = 'unmeasured',
  OK = 'ok',
  NOT_OK = 'not_ok'
}

// Core Types
export interface Client {
  id: string;
  name: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionOrder {
  id: string;
  clientId: string;
  objectName: string;
  address: string;
  createdAt: string;
  scheduledDate?: string;
  status: OrderStatus;
  notes?: string;
  measureLoopImpedance: boolean;
  measureInsulation: boolean;
  measureRcd: boolean;
  measurePeContinuity: boolean;
  measureEarthing: boolean;
  measurePolarity: boolean;
  measurePhaseSequence: boolean;
  measureBreakersCheck: boolean;
  measureLps: boolean;
  visualInspection: boolean;
  updatedAt: string;
}

export interface Room {
  id: string;
  inspectionOrderId: string;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementPoint {
  id: string;
  inspectionOrderId: string;
  roomId?: string;
  label: string;
  type: PointType;
  circuitSymbol?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementResult {
  id: string;
  measurementPointId: string;
  loopImpedance?: number;
  loopResultPass?: boolean;
  insulationLn?: number;
  insulationLpe?: number;
  insulationNpe?: number;
  insulationResultPass?: boolean;
  rcdType?: string;
  rcdRatedCurrent?: number;
  rcdTime1x?: number;
  rcdTime5x?: number;
  rcdResultPass?: boolean;
  peResistance?: number;
  peResultPass?: boolean;
  earthingResistance?: number;
  earthingResultPass?: boolean;
  polarityOk?: boolean;
  phaseSequenceOk?: boolean;
  breakerCheckOk?: boolean;
  lpsEarthingResistance?: number;
  lpsContinuityOk?: boolean;
  lpsVisualOk?: boolean;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisualInspection {
  id: string;
  inspectionOrderId: string;
  summary: string;
  defectsFound?: string;
  recommendations?: string;
  visualResultPass?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input Types (for creation/update)
export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type OrderInput = Omit<InspectionOrder, 'id' | 'createdAt' | 'updatedAt'>;
export type RoomInput = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type PointInput = Omit<MeasurementPoint, 'id' | 'createdAt' | 'updatedAt'>;
export type ResultInput = Omit<MeasurementResult, 'id' | 'createdAt' | 'updatedAt'>;
export type VisualInspectionInput = Omit<VisualInspection, 'id' | 'createdAt' | 'updatedAt'>;
