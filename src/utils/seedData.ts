import { createClient } from '../services/client';
import { createOrder } from '../services/order';
import { OrderStatus } from '../types';

/**
 * Seed the database with sample data for testing
 */
export const seedDatabase = async (): Promise<void> => {
  try {
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
    await createOrder({
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

    await createOrder({
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

    await createOrder({
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

    console.log('✅ Database seeded successfully!');
    console.log('Created 3 clients and 4 orders');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
