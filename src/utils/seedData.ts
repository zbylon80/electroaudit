import { createClient } from '../services/client';
import { createOrder } from '../services/order';
import { createRoom } from '../services/room';
import { createPoint } from '../services/point';
import { createOrUpdateResult } from '../services/result';
import { OrderStatus, PointType } from '../types';

/**
 * Seed the database with sample data for testing
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Clearing existing data...');
    const { clearDatabase } = await import('../services/database');
    await clearDatabase();
    
    console.log('Seeding database with sample data...');

    // Create sample clients
    const client1 = await createClient({
      name: 'ABC Company',
      address: 'ul. Główna 123, 00-001 Warszawa',
      contactPerson: 'Jan Kowalski',
      phone: '+48 123 456 789',
      email: 'jan.kowalski@abc.pl',
      notes: 'Stały klient',
    });

    const client2 = await createClient({
      name: 'XYZ Corporation',
      address: 'ul. Przemysłowa 45, 30-002 Kraków',
      contactPerson: 'Anna Nowak',
      phone: '+48 987 654 321',
      email: 'anna.nowak@xyz.pl',
    });

    const client3 = await createClient({
      name: 'Tech Solutions Sp. z o.o.',
      address: 'al. Niepodległości 78, 50-003 Wrocław',
      phone: '+48 555 123 456',
    });

    // Create sample orders
    const order1 = await createOrder({
      clientId: client1.id,
      objectName: 'Biurowiec ABC Tower',
      address: 'ul. Główna 123, 00-001 Warszawa',
      scheduledDate: new Date(2024, 11, 15).toISOString(),
      status: OrderStatus.DRAFT,
      notes: 'Przegląd roczny instalacji elektrycznej',
      measureLoopImpedance: true,
      measureInsulation: true,
      measureRcd: true,
      measurePeContinuity: true,
      measureEarthing: true,
      measurePolarity: true,
      measurePhaseSequence: true,
      measureBreakersCheck: true,
      measureLps: false,
      visualInspection: true,
    });

    const order2 = await createOrder({
      clientId: client2.id,
      objectName: 'Hala produkcyjna XYZ',
      address: 'ul. Przemysłowa 45, 30-002 Kraków',
      scheduledDate: new Date(2024, 11, 20).toISOString(),
      status: OrderStatus.IN_PROGRESS,
      notes: 'Pomiary po modernizacji',
      measureLoopImpedance: true,
      measureInsulation: true,
      measureRcd: true,
      measurePeContinuity: true,
      measureEarthing: true,
      measurePolarity: false,
      measurePhaseSequence: false,
      measureBreakersCheck: true,
      measureLps: true,
      visualInspection: true,
    });

    const order3 = await createOrder({
      clientId: client3.id,
      objectName: 'Centrum Danych Tech Solutions',
      address: 'al. Niepodległości 78, 50-003 Wrocław',
      scheduledDate: new Date(2024, 10, 10).toISOString(),
      status: OrderStatus.DONE,
      notes: 'Przegląd okresowy - zakończony',
      measureLoopImpedance: true,
      measureInsulation: true,
      measureRcd: true,
      measurePeContinuity: true,
      measureEarthing: true,
      measurePolarity: true,
      measurePhaseSequence: true,
      measureBreakersCheck: true,
      measureLps: true,
      visualInspection: true,
    });

    await createOrder({
      clientId: client1.id,
      objectName: 'Magazyn ABC',
      address: 'ul. Składowa 5, 00-001 Warszawa',
      scheduledDate: new Date(2024, 11, 25).toISOString(),
      status: OrderStatus.DRAFT,
      measureLoopImpedance: true,
      measureInsulation: true,
      measureRcd: false,
      measurePeContinuity: true,
      measureEarthing: true,
      measurePolarity: false,
      measurePhaseSequence: false,
      measureBreakersCheck: true,
      measureLps: false,
      visualInspection: false,
    });

    // Create sample rooms for order1 (Biurowiec ABC Tower)
    const room1 = await createRoom({
      inspectionOrderId: order1.id,
      name: 'Biuro 101',
      notes: 'Pokój konferencyjny',
    });

    const room2 = await createRoom({
      inspectionOrderId: order1.id,
      name: 'Biuro 102',
    });

    const room3 = await createRoom({
      inspectionOrderId: order1.id,
      name: 'Kuchnia',
    });

    // Create sample measurement points for order1
    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room1.id,
      label: 'Gniazdo 1F 1',
      type: PointType.SOCKET_1P,
      circuitSymbol: 'L1.1',
      notes: 'Gniazdo 1-fazowe przy biurku',
    });

    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room1.id,
      label: 'Gniazdo 1F 2',
      type: PointType.SOCKET_1P,
      circuitSymbol: 'L1.2',
    });

    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room1.id,
      label: 'Oświetlenie główne',
      type: PointType.LIGHTING,
      circuitSymbol: 'L2.1',
    });

    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room2.id,
      label: 'Gniazdo 1F 3',
      type: PointType.SOCKET_1P,
      circuitSymbol: 'L1.3',
    });

    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room2.id,
      label: 'Oświetlenie',
      type: PointType.LIGHTING,
      circuitSymbol: 'L2.2',
    });

    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room3.id,
      label: 'Gniazdo kuchenne 1F',
      type: PointType.SOCKET_1P,
      circuitSymbol: 'L1.4',
      notes: 'Gniazdo 1-fazowe przy blacie',
    });

    await createPoint({
      inspectionOrderId: order1.id,
      roomId: room3.id,
      label: 'RCD kuchnia',
      type: PointType.RCD,
      circuitSymbol: 'RCD1',
    });

    // Create unassigned points (earthing, LPS)
    await createPoint({
      inspectionOrderId: order1.id,
      label: 'Uziemienie główne',
      type: PointType.EARTHING,
      circuitSymbol: 'PE',
      notes: 'Szyna uziemiająca w rozdzielnicy głównej',
    });

    // Create sample rooms for order2 (Hala produkcyjna)
    const room4 = await createRoom({
      inspectionOrderId: order2.id,
      name: 'Hala A',
    });

    const room5 = await createRoom({
      inspectionOrderId: order2.id,
      name: 'Hala B',
    });

    // Create sample points for order2
    await createPoint({
      inspectionOrderId: order2.id,
      roomId: room4.id,
      label: 'Gniazdo siłowe 3F 1',
      type: PointType.SOCKET_3P,
      circuitSymbol: 'L3.1',
      notes: 'Gniazdo 3-fazowe dla maszyn',
    });

    await createPoint({
      inspectionOrderId: order2.id,
      roomId: room4.id,
      label: 'Oświetlenie halowe',
      type: PointType.LIGHTING,
      circuitSymbol: 'L4.1',
    });

    await createPoint({
      inspectionOrderId: order2.id,
      roomId: room5.id,
      label: 'Gniazdo siłowe 3F 2',
      type: PointType.SOCKET_3P,
      circuitSymbol: 'L3.2',
      notes: 'Gniazdo 3-fazowe dla maszyn',
    });

    await createPoint({
      inspectionOrderId: order2.id,
      label: 'LPS - odgromienie',
      type: PointType.LPS,
      circuitSymbol: 'LPS1',
      notes: 'System odgromowy na dachu',
    });

    // Create rooms and points with results for order3 (DONE status - completed inspection)
    const room6 = await createRoom({
      inspectionOrderId: order3.id,
      name: 'Serwerownia A',
      notes: 'Główna serwerownia',
    });

    const room7 = await createRoom({
      inspectionOrderId: order3.id,
      name: 'Serwerownia B',
      notes: 'Zapasowa serwerownia',
    });

    const room8 = await createRoom({
      inspectionOrderId: order3.id,
      name: 'UPS Room',
      notes: 'Pomieszczenie zasilaczy UPS',
    });

    // Create points with measurement results for order3
    const point3_1 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room6.id,
      label: 'Gniazdo rack 1F 1',
      type: PointType.SOCKET_1P,
      circuitSymbol: 'L5.1',
      notes: 'Zasilanie 1-fazowe rack serwerowy',
    });

    await createOrUpdateResult({
      measurementPointId: point3_1.id,
      loopImpedance: 0.15,
      loopResultPass: true,
      polarityOk: true, // 1-phase socket - only polarity
      comments: 'Wszystkie pomiary w normie - gniazdo 1-fazowe',
    });

    const point3_2 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room6.id,
      label: 'Gniazdo rack 1F 2',
      type: PointType.SOCKET_1P,
      circuitSymbol: 'L5.2',
    });

    await createOrUpdateResult({
      measurementPointId: point3_2.id,
      loopImpedance: 0.18,
      loopResultPass: true,
      polarityOk: true, // 1-phase socket - only polarity
      comments: 'Gniazdo 1-fazowe - parametry OK',
    });

    const point3_3 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room6.id,
      label: 'RCD Serwerownia A',
      type: PointType.RCD,
      circuitSymbol: 'RCD2',
    });

    await createOrUpdateResult({
      measurementPointId: point3_3.id,
      rcdType: 'A',
      rcdRatedCurrent: 30,
      rcdTime1x: 18,
      rcdTime5x: 12,
      rcdResultPass: true,
      comments: 'RCD działa prawidłowo',
    });

    const point3_4 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room7.id,
      label: 'Gniazdo rack 3F 3',
      type: PointType.SOCKET_3P,
      circuitSymbol: 'L5.3',
      notes: 'Gniazdo 3-fazowe dla serwerów',
    });

    await createOrUpdateResult({
      measurementPointId: point3_4.id,
      loopImpedance: 0.22,
      loopResultPass: false, // Failed measurement
      phaseSequenceOk: true, // 3-phase socket - only phase sequence
      comments: 'Impedancja pętli zwarcia powyżej normy - wymaga naprawy (gniazdo 3-fazowe)',
    });

    const point3_5 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room7.id,
      label: 'Oświetlenie awaryjne',
      type: PointType.LIGHTING,
      circuitSymbol: 'L6.1',
    });

    await createOrUpdateResult({
      measurementPointId: point3_5.id,
      loopImpedance: 0.14,
      loopResultPass: true,
      polarityOk: true, // Lighting - only polarity
      comments: 'Oświetlenie awaryjne - parametry OK',
    });

    const point3_6 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room8.id,
      label: 'Zasilanie UPS 3F 1',
      type: PointType.SOCKET_3P,
      circuitSymbol: 'L7.1',
      notes: 'Główny UPS 100kVA - zasilanie 3-fazowe',
    });

    await createOrUpdateResult({
      measurementPointId: point3_6.id,
      loopImpedance: 0.11,
      loopResultPass: true,
      phaseSequenceOk: true, // 3-phase socket - only phase sequence
      comments: 'Doskonałe parametry - gniazdo 3-fazowe UPS',
    });

    const point3_7 = await createPoint({
      inspectionOrderId: order3.id,
      roomId: room8.id,
      label: 'Zasilanie UPS 3F 2',
      type: PointType.SOCKET_3P,
      circuitSymbol: 'L7.2',
      notes: 'Zapasowy UPS 50kVA - zasilanie 3-fazowe',
    });

    await createOrUpdateResult({
      measurementPointId: point3_7.id,
      loopImpedance: 0.13,
      loopResultPass: true,
      phaseSequenceOk: true, // 3-phase socket - only phase sequence
      comments: 'Gniazdo 3-fazowe zapasowego UPS - parametry OK',
    });

    // Unassigned points for order3
    const point3_8 = await createPoint({
      inspectionOrderId: order3.id,
      label: 'Uziemienie główne DC',
      type: PointType.EARTHING,
      circuitSymbol: 'PE-DC',
      notes: 'Główna szyna uziemiająca centrum danych',
    });

    await createOrUpdateResult({
      measurementPointId: point3_8.id,
      earthingResistance: 2.5,
      earthingResultPass: true,
      comments: 'Rezystancja uziemienia w normie',
    });

    const point3_9 = await createPoint({
      inspectionOrderId: order3.id,
      label: 'LPS - instalacja odgromowa',
      type: PointType.LPS,
      circuitSymbol: 'LPS-DC',
      notes: 'System ochrony odgromowej budynku',
    });

    await createOrUpdateResult({
      measurementPointId: point3_9.id,
      lpsEarthingResistance: 3.2,
      lpsContinuityOk: true,
      lpsVisualOk: true,
      comments: 'System LPS sprawny, wszystkie połączenia OK',
    });

    console.log('✅ Database seeded successfully!');
    console.log('Created 3 clients, 4 orders, 11 rooms, 25 measurement points (1-phase and 3-phase sockets), and 9 measurement results');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
