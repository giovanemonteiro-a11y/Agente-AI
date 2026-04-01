import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

export const listEditorialLines = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});

export const generateEditorial = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});

export const createEditorialLine = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});

export const getEditorialById = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});

export const updateEditorialLine = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});
