import { Client, ClientInput } from '../types';
import { generateUUID } from '../utils';
import { querySql, executeSql } from './database';

/**
 * ClientService - Handles all CRUD operations for clients
 */

/**
 * Create a new client
 * @param clientData - Client data without id, createdAt, updatedAt
 * @returns Created client with generated id and timestamps
 */
export const createClient = async (clientData: ClientInput): Promise<Client> => {
  try {
    console.log('Creating client with data:', clientData);
    const id = generateUUID();
    console.log('Generated UUID:', id);
    const now = new Date().toISOString();
    
    const client: Client = {
      id,
      ...clientData,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('Executing SQL insert for client:', client);
    await executeSql(
      `INSERT INTO clients (id, name, address, contactPerson, phone, email, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.id,
        client.name,
        client.address,
        client.contactPerson ?? null,
        client.phone ?? null,
        client.email ?? null,
        client.notes ?? null,
        client.createdAt,
        client.updatedAt,
      ]
    );
    
    console.log('Client created successfully:', client.id);
    return client;
  } catch (error) {
    console.error('Error creating client:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get a client by ID
 * @param id - Client ID
 * @returns Client or null if not found
 */
export const getClient = async (id: string): Promise<Client | null> => {
  try {
    const results = await querySql(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      contactPerson: row.contactPerson ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error getting client:', error);
    throw new Error(`Failed to get client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all clients
 * @returns Array of all clients
 */
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const results = await querySql('SELECT * FROM clients ORDER BY name ASC');
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      contactPerson: row.contactPerson ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Error getting all clients:', error);
    throw new Error(`Failed to get all clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing client
 * @param id - Client ID
 * @param clientData - Updated client data
 */
export const updateClient = async (id: string, clientData: ClientInput): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    await executeSql(
      `UPDATE clients 
       SET name = ?, address = ?, contactPerson = ?, phone = ?, email = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        clientData.name,
        clientData.address,
        clientData.contactPerson ?? null,
        clientData.phone ?? null,
        clientData.email ?? null,
        clientData.notes ?? null,
        now,
        id,
      ]
    );
  } catch (error) {
    console.error('Error updating client:', error);
    throw new Error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a client
 * @param id - Client ID
 * @throws Error if client has associated inspection orders
 */
export const deleteClient = async (id: string): Promise<void> => {
  try {
    // Check if client has associated orders (Requirement 1.10)
    const orders = await querySql(
      'SELECT id FROM inspection_orders WHERE clientId = ?',
      [id]
    );
    
    if (orders.length > 0) {
      throw new Error('Cannot delete client with associated inspection orders');
    }
    
    await executeSql('DELETE FROM clients WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw new Error(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
