import { InspectionOrder, Client, Room, MeasurementPoint, MeasurementResult, VisualInspection, PointStatus } from '../types';
import { getOrder } from './order';
import { getClient } from './client';
import { getRoomsByOrder } from './room';
import { getPointsByOrder, getPointStatus } from './point';
import { getResultByPoint } from './result';
import { getVisualInspectionByOrder } from './visualInspection';

// Protocol data structure
export interface ProtocolData {
  // Inspector info (can be hardcoded or from config)
  inspector: {
    name: string;
    licenseNumber?: string;
    company?: string;
  };
  
  // Client information
  client: Client;
  
  // Object information
  object: {
    name: string;
    address: string;
    scheduledDate?: string;
  };
  
  // Measurement scope
  scope: {
    loopImpedance: boolean;
    insulation: boolean;
    rcd: boolean;
    peContinuity: boolean;
    earthing: boolean;
    polarity: boolean;
    phaseSequence: boolean;
    breakersCheck: boolean;
    lps: boolean;
    visualInspection: boolean;
  };
  
  // Results organized by room
  resultsByRoom: {
    roomName: string;
    roomId?: string;
    points: PointWithResult[];
  }[];
  
  // LPS section (if applicable)
  lpsSection?: {
    points: PointWithResult[];
  };
  
  // Visual inspection (if applicable)
  visualInspection?: VisualInspection;
  
  // Signature placeholder
  signature: {
    date?: string;
    inspectorSignature?: string;
  };
  
  // Order metadata
  order: InspectionOrder;
}

export interface PointWithResult {
  point: MeasurementPoint;
  result: MeasurementResult | null;
  status: PointStatus;
  roomName?: string;
}

/**
 * Generate protocol data by aggregating all order-related information
 */
export async function generateProtocolData(orderId: string): Promise<ProtocolData> {
  // Load order details
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Load client information
  const client = await getClient(order.clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  
  // Load all rooms for the order
  const rooms = await getRoomsByOrder(orderId);
  
  // Load all measurement points with their results
  const points = await getPointsByOrder(orderId);
  
  // Load results and status for each point
  const pointsWithResults: PointWithResult[] = await Promise.all(
    points.map(async (point) => {
      const result = await getResultByPoint(point.id);
      const status = await getPointStatus(point.id);
      const room = point.roomId ? rooms.find(r => r.id === point.roomId) : undefined;
      
      return {
        point,
        result,
        status,
        roomName: room?.name,
      };
    })
  );
  
  // Load visual inspection if applicable
  let visualInspection: VisualInspection | undefined;
  if (order.visualInspection) {
    const vi = await getVisualInspectionByOrder(orderId);
    if (vi) {
      visualInspection = vi;
    }
  }
  
  // Organize results by room
  const resultsByRoom: ProtocolData['resultsByRoom'] = [];
  
  // Group points by room
  const roomMap = new Map<string, PointWithResult[]>();
  const unassignedPoints: PointWithResult[] = [];
  const lpsPoints: PointWithResult[] = [];
  
  for (const pwr of pointsWithResults) {
    // Separate LPS points
    if (pwr.point.type === 'lps') {
      lpsPoints.push(pwr);
      continue;
    }
    
    // Group by room or unassigned
    if (pwr.point.roomId) {
      const existing = roomMap.get(pwr.point.roomId) || [];
      existing.push(pwr);
      roomMap.set(pwr.point.roomId, existing);
    } else {
      unassignedPoints.push(pwr);
    }
  }
  
  // Build resultsByRoom array
  for (const room of rooms) {
    const roomPoints = roomMap.get(room.id) || [];
    if (roomPoints.length > 0) {
      resultsByRoom.push({
        roomName: room.name,
        roomId: room.id,
        points: roomPoints,
      });
    }
  }
  
  // Add unassigned points if any
  if (unassignedPoints.length > 0) {
    resultsByRoom.push({
      roomName: 'Unassigned',
      points: unassignedPoints,
    });
  }
  
  // Build protocol data
  const protocolData: ProtocolData = {
    inspector: {
      name: 'Inspector Name', // TODO: Make this configurable
      licenseNumber: undefined,
      company: undefined,
    },
    client,
    object: {
      name: order.objectName,
      address: order.address,
      scheduledDate: order.scheduledDate,
    },
    scope: {
      loopImpedance: order.measureLoopImpedance,
      insulation: order.measureInsulation,
      rcd: order.measureRcd,
      peContinuity: order.measurePeContinuity,
      earthing: order.measureEarthing,
      polarity: order.measurePolarity,
      phaseSequence: order.measurePhaseSequence,
      breakersCheck: order.measureBreakersCheck,
      lps: order.measureLps,
      visualInspection: order.visualInspection,
    },
    resultsByRoom,
    lpsSection: lpsPoints.length > 0 ? { points: lpsPoints } : undefined,
    visualInspection,
    signature: {
      date: undefined,
      inspectorSignature: undefined,
    },
    order,
  };
  
  return protocolData;
}
