// Mock expo-print and expo-sharing before importing
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import { generateProtocolHTML } from './protocolExport';
import { ProtocolData } from './protocol';
import { OrderStatus, PointStatus, PointType } from '../types';

describe('Protocol Export Service', () => {
  const mockProtocolData: ProtocolData = {
    inspector: {
      name: 'Test Inspector',
      licenseNumber: '12345',
      company: 'Test Company',
    },
    client: {
      id: 'client-1',
      name: 'Test Client',
      address: '123 Test St',
      contactPerson: 'John Doe',
      phone: '555-1234',
      email: 'test@example.com',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    object: {
      name: 'Test Building',
      address: '456 Building Ave',
      scheduledDate: '2025-01-15T00:00:00.000Z',
    },
    scope: {
      loopImpedance: true,
      insulation: true,
      rcd: false,
      peContinuity: true,
      earthing: false,
      polarity: false,
      phaseSequence: false,
      breakersCheck: false,
      lps: false,
      visualInspection: true,
    },
    resultsByRoom: [
      {
        roomName: 'Living Room',
        roomId: 'room-1',
        points: [
          {
            point: {
              id: 'point-1',
              inspectionOrderId: 'order-1',
              roomId: 'room-1',
              label: 'Socket 1',
              type: PointType.SOCKET_1P,
              circuitSymbol: 'L1',
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z',
            },
            result: {
              id: 'result-1',
              measurementPointId: 'point-1',
              loopImpedance: 0.5,
              loopResultPass: true,
              insulationLn: 500,
              insulationLpe: 500,
              insulationNpe: 500,
              insulationResultPass: true,
              peResistance: 0.2,
              peResultPass: true,
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z',
            },
            status: PointStatus.OK,
            roomName: 'Living Room',
          },
        ],
      },
    ],
    visualInspection: {
      id: 'visual-1',
      inspectionOrderId: 'order-1',
      summary: 'Overall installation is in good condition',
      defectsFound: 'Minor wear on cable insulation',
      recommendations: 'Replace worn cables within 6 months',
      visualResultPass: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    signature: {
      date: undefined,
      inspectorSignature: undefined,
    },
    order: {
      id: 'order-1',
      clientId: 'client-1',
      objectName: 'Test Building',
      address: '456 Building Ave',
      createdAt: '2025-01-01T00:00:00.000Z',
      scheduledDate: '2025-01-15T00:00:00.000Z',
      status: OrderStatus.IN_PROGRESS,
      measureLoopImpedance: true,
      measureInsulation: true,
      measureRcd: false,
      measurePeContinuity: true,
      measureEarthing: false,
      measurePolarity: false,
      measurePhaseSequence: false,
      measureBreakersCheck: false,
      measureLps: false,
      visualInspection: true,
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  };

  describe('generateProtocolHTML', () => {
    it('should generate valid HTML from protocol data', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      // Check that HTML is generated
      expect(html).toBeTruthy();
      expect(typeof html).toBe('string');
      
      // Check for HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
    });

    it('should include inspector information', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Inspector Information');
      expect(html).toContain('Test Inspector');
      expect(html).toContain('12345');
      expect(html).toContain('Test Company');
    });

    it('should include client information', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Client Information');
      expect(html).toContain('Test Client');
      expect(html).toContain('123 Test St');
      expect(html).toContain('John Doe');
      expect(html).toContain('555-1234');
      expect(html).toContain('test@example.com');
    });

    it('should include object information', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Inspected Object');
      expect(html).toContain('Test Building');
      expect(html).toContain('456 Building Ave');
    });

    it('should include measurement scope', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Measurement Scope');
      expect(html).toContain('Loop Impedance Measurement');
      expect(html).toContain('Insulation Resistance Testing');
      expect(html).toContain('PE Continuity Testing');
      expect(html).toContain('Visual Inspection');
      
      // Should not include disabled measurements
      expect(html).not.toContain('RCD Testing');
      expect(html).not.toContain('Earthing Resistance Measurement');
    });

    it('should include measurement results table', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Measurement Results');
      expect(html).toContain('Living Room');
      expect(html).toContain('Socket 1');
      expect(html).toContain('Socket 1P');
      expect(html).toContain('Loop: 0.5Ω');
      expect(html).toContain('PASS');
    });

    it('should include visual inspection when present', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Visual Inspection');
      expect(html).toContain('Overall installation is in good condition');
      expect(html).toContain('Minor wear on cable insulation');
      expect(html).toContain('Replace worn cables within 6 months');
    });

    it('should not include visual inspection when not present', () => {
      const dataWithoutVisual = {
        ...mockProtocolData,
        visualInspection: undefined,
      };
      
      const html = generateProtocolHTML(dataWithoutVisual);
      
      // Should not have visual inspection section
      expect(html).not.toContain('Overall installation is in good condition');
    });

    it('should include signature section', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('Signature');
      expect(html).toContain('Date:');
      expect(html).toContain('Inspector Signature:');
    });

    it('should include print-friendly CSS', () => {
      const html = generateProtocolHTML(mockProtocolData);
      
      expect(html).toContain('<style>');
      expect(html).toContain('@media print');
      expect(html).toContain('</style>');
    });

    it('should handle LPS section when present', () => {
      const dataWithLPS = {
        ...mockProtocolData,
        lpsSection: {
          points: [
            {
              point: {
                id: 'lps-1',
                inspectionOrderId: 'order-1',
                label: 'LPS Point 1',
                type: PointType.LPS,
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-01T00:00:00.000Z',
              },
              result: {
                id: 'lps-result-1',
                measurementPointId: 'lps-1',
                lpsEarthingResistance: 10,
                lpsContinuityOk: true,
                lpsVisualOk: true,
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-01T00:00:00.000Z',
              },
              status: PointStatus.OK,
            },
          ],
        },
      };
      
      const html = generateProtocolHTML(dataWithLPS);
      
      expect(html).toContain('Lightning Protection System (LPS)');
      expect(html).toContain('LPS Point 1');
      expect(html).toContain('Earthing: 10Ω');
    });

    it('should handle points without results', () => {
      const dataWithUnmeasuredPoint = {
        ...mockProtocolData,
        resultsByRoom: [
          {
            roomName: 'Kitchen',
            roomId: 'room-2',
            points: [
              {
                point: {
                  id: 'point-2',
                  inspectionOrderId: 'order-1',
                  roomId: 'room-2',
                  label: 'Socket 2',
                  type: PointType.SOCKET_1P,
                  createdAt: '2025-01-01T00:00:00.000Z',
                  updatedAt: '2025-01-01T00:00:00.000Z',
                },
                result: null,
                status: PointStatus.UNMEASURED,
                roomName: 'Kitchen',
              },
            ],
          },
        ],
      };
      
      const html = generateProtocolHTML(dataWithUnmeasuredPoint);
      
      expect(html).toContain('Kitchen');
      expect(html).toContain('Socket 2');
      expect(html).toContain('No measurements recorded');
      expect(html).toContain('N/A');
    });
  });
});
