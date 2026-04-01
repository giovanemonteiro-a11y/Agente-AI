import { createClientFolder } from './drive.service';
import {
  findAllClients,
  findClientById,
  insertClient,
  updateClientById,
  deleteClientById,
} from '../repositories/clients.repository';
import { ServiceScope, DesignerScope } from '../types/index';

export interface CreateClientPayload {
  name: string;
  segment?: string;
  services_scope: ServiceScope[];
  designer_scope: DesignerScope[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  start_date?: string;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  status?: 'active' | 'paused' | 'churned';
  drive_folder_id?: string;
  drive_folder_url?: string;
  whatsapp_group_id?: string;
  sheets_sprint_url?: string;
  monday_board_id?: string;
}

export async function listClients(_filters?: Record<string, unknown>): Promise<unknown[]> {
  return findAllClients();
}

export async function createClient(payload: CreateClientPayload): Promise<unknown> {
  // Try to create Drive folder, but don't fail if Drive not configured
  let driveData: { drive_folder_id?: string; drive_folder_url?: string } = {};
  try {
    const { folderId, folderUrl } = await createClientFolder(payload.name);
    driveData = { drive_folder_id: folderId, drive_folder_url: folderUrl };
  } catch (err) {
    console.warn('Drive folder creation failed:', (err as Error).message);
  }

  const data: Record<string, unknown> = {
    name: payload.name,
    segment: payload.segment ?? null,
    services_scope: payload.services_scope,
    designer_scope: payload.designer_scope,
    contact_name: payload.contact_name ?? null,
    contact_email: payload.contact_email ?? null,
    contact_phone: payload.contact_phone ?? null,
    start_date: payload.start_date ?? null,
    status: 'active',
    ...driveData,
  };

  return insertClient(data);
}

export async function getClientById(id: string): Promise<unknown> {
  return findClientById(id);
}

export async function updateClient(id: string, payload: UpdateClientPayload): Promise<unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }
  return updateClientById(id, data);
}

export async function deleteClient(id: string): Promise<void> {
  await deleteClientById(id);
}
