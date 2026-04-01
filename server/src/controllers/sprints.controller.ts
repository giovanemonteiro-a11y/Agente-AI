import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

export const listSprintData = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});

export const syncSprintData = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});

export const getSprintDataById = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});
