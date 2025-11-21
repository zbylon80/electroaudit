import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ProtocolData, PointWithResult } from './protocol';
import { PointStatus } from '../types';

/**
 * Protocol Export Service
 * Handles platform-specific protocol export functionality
 */

/**
 * Generate HTML string from protocol data for PDF generation or printing
 */
export function generateProtocolHTML(protocolData: ProtocolData): string {
  const getStatusColor = (status: PointStatus): string => {
    switch (status) {
      case PointStatus.OK:
        return '#66BB6A';
      case PointStatus.NOT_OK:
        return '#EF5350';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: PointStatus): string => {
    switch (status) {
      case PointStatus.OK:
        return 'PASS';
      case PointStatus.NOT_OK:
        return 'FAIL';
      default:
        return 'N/A';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'socket_1p':
        return 'Socket 1P';
      case 'socket_3p':
        return 'Socket 3P';
      case 'lighting':
        return 'Lighting';
      case 'rcd':
        return 'RCD';
      case 'earthing':
        return 'Earthing';
      case 'lps':
        return 'LPS';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const formatMeasurementResults = (pwr: PointWithResult): string => {
    const result = pwr.result;
    if (!result) return 'No measurements recorded';
    
    const parts: string[] = [];
    const scope = protocolData.scope;
    
    if (scope.loopImpedance && result.loopImpedance !== null && result.loopImpedance !== undefined) {
      parts.push(`Loop: ${result.loopImpedance}Ω`);
    }
    
    if (scope.insulation) {
      const insulationParts: string[] = [];
      if (result.insulationLn !== null && result.insulationLn !== undefined) {
        insulationParts.push(`L-N: ${result.insulationLn}MΩ`);
      }
      if (result.insulationLpe !== null && result.insulationLpe !== undefined) {
        insulationParts.push(`L-PE: ${result.insulationLpe}MΩ`);
      }
      if (result.insulationNpe !== null && result.insulationNpe !== undefined) {
        insulationParts.push(`N-PE: ${result.insulationNpe}MΩ`);
      }
      if (insulationParts.length > 0) {
        parts.push(`Insulation: ${insulationParts.join(', ')}`);
      }
    }
    
    if (scope.rcd && result.rcdType) {
      parts.push(`RCD: ${result.rcdType}, ${result.rcdRatedCurrent}mA, 1x: ${result.rcdTime1x}ms, 5x: ${result.rcdTime5x}ms`);
    }
    
    if (scope.peContinuity && result.peResistance !== null && result.peResistance !== undefined) {
      parts.push(`PE: ${result.peResistance}Ω`);
    }
    
    if (scope.earthing && result.earthingResistance !== null && result.earthingResistance !== undefined) {
      parts.push(`Earthing: ${result.earthingResistance}Ω`);
    }
    
    if (scope.polarity && result.polarityOk !== null && result.polarityOk !== undefined) {
      parts.push(`Polarity: ${result.polarityOk ? 'OK' : 'NOT OK'}`);
    }
    
    if (scope.phaseSequence && result.phaseSequenceOk !== null && result.phaseSequenceOk !== undefined) {
      parts.push(`Phase Seq: ${result.phaseSequenceOk ? 'OK' : 'NOT OK'}`);
    }
    
    if (scope.breakersCheck && result.breakerCheckOk !== null && result.breakerCheckOk !== undefined) {
      parts.push(`Breakers: ${result.breakerCheckOk ? 'OK' : 'NOT OK'}`);
    }
    
    if (result.comments) {
      parts.push(`Comments: ${result.comments}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No measurements recorded';
  };

  const formatLPSResults = (pwr: PointWithResult): string => {
    const result = pwr.result;
    if (!result) return 'No measurements recorded';
    
    const parts: string[] = [];
    
    if (result.lpsEarthingResistance !== null && result.lpsEarthingResistance !== undefined) {
      parts.push(`Earthing: ${result.lpsEarthingResistance}Ω`);
    }
    if (result.lpsContinuityOk !== null && result.lpsContinuityOk !== undefined) {
      parts.push(`Continuity: ${result.lpsContinuityOk ? 'OK' : 'NOT OK'}`);
    }
    if (result.lpsVisualOk !== null && result.lpsVisualOk !== undefined) {
      parts.push(`Visual: ${result.lpsVisualOk ? 'OK' : 'NOT OK'}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No measurements recorded';
  };

  // Generate scope items HTML
  const scopeItems: string[] = [];
  if (protocolData.scope.loopImpedance) scopeItems.push('✓ Loop Impedance Measurement');
  if (protocolData.scope.insulation) scopeItems.push('✓ Insulation Resistance Testing');
  if (protocolData.scope.rcd) scopeItems.push('✓ RCD Testing');
  if (protocolData.scope.peContinuity) scopeItems.push('✓ PE Continuity Testing');
  if (protocolData.scope.earthing) scopeItems.push('✓ Earthing Resistance Measurement');
  if (protocolData.scope.polarity) scopeItems.push('✓ Polarity Check');
  if (protocolData.scope.phaseSequence) scopeItems.push('✓ Phase Sequence Check');
  if (protocolData.scope.breakersCheck) scopeItems.push('✓ Circuit Breakers Check');
  if (protocolData.scope.lps) scopeItems.push('✓ Lightning Protection System');
  if (protocolData.scope.visualInspection) scopeItems.push('✓ Visual Inspection');

  // Generate results table rows
  const resultsTableRows = protocolData.resultsByRoom.map((roomSection) => {
    return roomSection.points.map((pwr, index) => {
      const roomName = index === 0 ? roomSection.roomName : '';
      return `
        <tr>
          <td>${roomName}</td>
          <td>${pwr.point.label}</td>
          <td>${getTypeLabel(pwr.point.type)}</td>
          <td style="font-size: 10px;">${formatMeasurementResults(pwr)}</td>
          <td>
            <span class="status-badge" style="background-color: ${getStatusColor(pwr.status)};">
              ${getStatusLabel(pwr.status)}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }).join('');

  // Generate LPS table rows if applicable
  const lpsTableRows = protocolData.lpsSection?.points.map((pwr) => `
    <tr>
      <td>${pwr.point.label}</td>
      <td style="font-size: 10px;">${formatLPSResults(pwr)}</td>
      <td>
        <span class="status-badge" style="background-color: ${getStatusColor(pwr.status)};">
          ${getStatusLabel(pwr.status)}
        </span>
      </td>
    </tr>
  `).join('') || '';

  // Generate visual inspection section if applicable
  const visualInspectionHTML = protocolData.visualInspection ? `
    <div class="section">
      <h2>Visual Inspection</h2>
      <div class="content">
        <p><strong>Summary:</strong></p>
        <p>${protocolData.visualInspection.summary}</p>
        
        ${protocolData.visualInspection.defectsFound ? `
          <p style="margin-top: 12px;"><strong>Defects Found:</strong></p>
          <p>${protocolData.visualInspection.defectsFound}</p>
        ` : ''}
        
        ${protocolData.visualInspection.recommendations ? `
          <p style="margin-top: 12px;"><strong>Recommendations:</strong></p>
          <p>${protocolData.visualInspection.recommendations}</p>
        ` : ''}
        
        <p style="margin-top: 12px;">
          <strong>Overall Result:</strong>
          <span class="status-badge" style="background-color: ${protocolData.visualInspection.visualResultPass ? '#66BB6A' : '#EF5350'}; margin-left: 8px;">
            ${protocolData.visualInspection.visualResultPass ? 'PASS' : 'FAIL'}
          </span>
        </p>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Electrical Inspection Protocol</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none;
          }
          .page-break {
            page-break-before: always;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
        }
        
        h1 {
          text-align: center;
          color: #2196F3;
          font-size: 28px;
          margin-bottom: 30px;
          border-bottom: 3px solid #2196F3;
          padding-bottom: 10px;
        }
        
        h2 {
          color: #2196F3;
          font-size: 20px;
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 8px;
        }
        
        .section {
          background-color: #f5f5f5;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          break-inside: avoid;
        }
        
        .content {
          background-color: #fff;
          padding: 15px;
          border-radius: 4px;
        }
        
        p {
          margin: 6px 0;
          font-size: 14px;
        }
        
        strong {
          color: #666;
        }
        
        .scope-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .scope-list li {
          padding: 4px 0;
          font-size: 14px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          background-color: #fff;
          font-size: 12px;
        }
        
        th {
          background-color: #2196F3;
          color: #fff;
          padding: 10px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
        }
        
        td {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: top;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          color: #fff;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
        }
        
        .signature-line {
          margin-top: 20px;
          padding-top: 40px;
          border-top: 1px solid #333;
          width: 300px;
        }
        
        .signature-container {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <h1>Electrical Inspection Protocol</h1>
      
      <!-- Inspector Information -->
      <div class="section">
        <h2>Inspector Information</h2>
        <div class="content">
          <p><strong>Name:</strong> ${protocolData.inspector.name}</p>
          ${protocolData.inspector.licenseNumber ? `<p><strong>License Number:</strong> ${protocolData.inspector.licenseNumber}</p>` : ''}
          ${protocolData.inspector.company ? `<p><strong>Company:</strong> ${protocolData.inspector.company}</p>` : ''}
        </div>
      </div>
      
      <!-- Client Information -->
      <div class="section">
        <h2>Client Information</h2>
        <div class="content">
          <p><strong>Name:</strong> ${protocolData.client.name}</p>
          <p><strong>Address:</strong> ${protocolData.client.address}</p>
          ${protocolData.client.contactPerson ? `<p><strong>Contact Person:</strong> ${protocolData.client.contactPerson}</p>` : ''}
          ${protocolData.client.phone ? `<p><strong>Phone:</strong> ${protocolData.client.phone}</p>` : ''}
          ${protocolData.client.email ? `<p><strong>Email:</strong> ${protocolData.client.email}</p>` : ''}
        </div>
      </div>
      
      <!-- Inspected Object -->
      <div class="section">
        <h2>Inspected Object</h2>
        <div class="content">
          <p><strong>Object Name:</strong> ${protocolData.object.name}</p>
          <p><strong>Address:</strong> ${protocolData.object.address}</p>
          ${protocolData.object.scheduledDate ? `<p><strong>Inspection Date:</strong> ${new Date(protocolData.object.scheduledDate).toLocaleDateString()}</p>` : ''}
        </div>
      </div>
      
      <!-- Measurement Scope -->
      <div class="section">
        <h2>Measurement Scope</h2>
        <div class="content">
          <ul class="scope-list">
            ${scopeItems.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <!-- Measurement Results -->
      <div class="section">
        <h2>Measurement Results</h2>
        <div class="content">
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Room</th>
                <th style="width: 20%;">Point</th>
                <th style="width: 15%;">Type</th>
                <th style="width: 40%;">Results</th>
                <th style="width: 10%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${resultsTableRows}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- LPS Section -->
      ${protocolData.lpsSection && protocolData.lpsSection.points.length > 0 ? `
        <div class="section">
          <h2>Lightning Protection System (LPS)</h2>
          <div class="content">
            <table>
              <thead>
                <tr>
                  <th style="width: 30%;">Point</th>
                  <th style="width: 60%;">Results</th>
                  <th style="width: 10%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${lpsTableRows}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      <!-- Visual Inspection -->
      ${visualInspectionHTML}
      
      <!-- Signature -->
      <div class="section">
        <h2>Signature</h2>
        <div class="content">
          <div class="signature-container">
            <div>
              <p><strong>Date:</strong> ${protocolData.signature?.date || new Date().toISOString().split('T')[0]}</p>
              <div class="signature-line"></div>
            </div>
            <div>
              <p><strong>Inspector Signature:</strong></p>
              <div class="signature-line"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Print protocol on web platform using window.print()
 */
export async function printProtocol(protocolData: ProtocolData): Promise<void> {
  if (Platform.OS !== 'web') {
    throw new Error('printProtocol is only available on web platform');
  }

  try {
    // Generate HTML
    const html = generateProtocolHTML(protocolData);
    
    // Create a new window with the protocol HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please check your popup blocker settings.');
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  } catch (error) {
    console.error('Error printing protocol:', error);
    throw error;
  }
}

/**
 * Export protocol as PDF on mobile platform using expo-print
 */
export async function exportProtocolPDF(protocolData: ProtocolData): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('exportProtocolPDF is only available on mobile platforms');
  }

  try {
    // Generate HTML
    const html = generateProtocolHTML(protocolData);
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({ html });
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Share the PDF using system share sheet
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Inspection Protocol',
        UTI: 'com.adobe.pdf',
      });
    } else {
      // Sharing not available, show alert
      Alert.alert(
        'PDF Generated',
        `Protocol PDF has been saved to: ${uri}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error exporting protocol PDF:', error);
    throw error;
  }
}

/**
 * Export protocol with automatic platform detection
 */
export async function exportProtocol(protocolData: ProtocolData): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await printProtocol(protocolData);
    } else {
      await exportProtocolPDF(protocolData);
    }
  } catch (error) {
    console.error('Error exporting protocol:', error);
    
    // Show user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (Platform.OS === 'web') {
      window.alert(`Failed to print protocol: ${errorMessage}`);
    } else {
      Alert.alert(
        'Export Failed',
        `Failed to export protocol: ${errorMessage}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => exportProtocol(protocolData) },
        ]
      );
    }
    
    throw error;
  }
}
