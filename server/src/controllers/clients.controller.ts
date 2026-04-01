import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
} from '../services/clients.service';
import { createClientFolder } from '../services/drive.service';
import { AppError } from '../middleware/errorHandler';
import { notifyAllLeaders } from '../services/notification.service';

export const listClientsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const clients = await listClients(req.query as Record<string, unknown>);
  res.status(200).json({ data: clients });
});

export const createClientHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    segment,
    services_scope,
    designer_scope,
    contact_name,
    contact_email,
    contact_phone,
    start_date,
  } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Client name is required', 400);
  }

  const client = await createClient({
    name: name.trim(),
    segment,
    services_scope: services_scope ?? [],
    designer_scope: designer_scope ?? [],
    contact_name,
    contact_email,
    contact_phone,
    start_date,
  }) as { id: string; name: string; segment?: string; [key: string]: unknown };

  // Notify all leaders about new client
  notifyAllLeaders(
    'client:created',
    `Novo cliente: ${client.name}`,
    `${client.name} (${client.segment ?? 'Sem segmento'}) foi cadastrado na plataforma.`,
    { clientId: client.id, clientName: client.name }
  ).catch(() => { /* non-blocking */ });

  res.status(201).json({ data: client });
});

export const getClientByIdHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await getClientById(id);

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  res.status(200).json({ data: client });
});

export const updateClientHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (Object.keys(req.body).length === 0) {
    throw new AppError('No fields to update', 400);
  }

  const updated = await updateClient(id, req.body);

  if (!updated) {
    throw new AppError('Client not found', 404);
  }

  res.status(200).json({ data: updated });
});

export const deleteClientHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await getClientById(id);

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await deleteClient(id);
  res.status(204).send();
});

export const setupDriveFolderHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await getClientById(id);

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const clientRecord = client as { name: string; id: string };
  const { folderId, folderUrl } = await createClientFolder(clientRecord.name);

  const updated = await updateClient(id, {
    drive_folder_id: folderId,
    drive_folder_url: folderUrl,
  });

  res.status(200).json({ data: updated });
});

// Aliases for route compatibility
export {
  listClientsHandler as listClients,
  createClientHandler as createClient,
  getClientByIdHandler as getClientById,
  updateClientHandler as updateClient,
  deleteClientHandler as deleteClient,
  setupDriveFolderHandler as setupDriveFolder,
};
