import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import * as service from '../services/commercial.service';

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const listAccounts = asyncHandler(async (_req: Request, res: Response) => {
  const accounts = await service.listAccountUsers();
  res.json(accounts);
});

// ─── Goals ────────────────────────────────────────────────────────────────────

export const listGoals = asyncHandler(async (_req: Request, res: Response) => {
  const goals = await service.listGoals();
  res.json(goals);
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Nao autenticado', 401);
  const goal = await service.createGoal({ ...req.body, created_by: req.user.userId });
  res.status(201).json(goal);
});

export const getGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await service.getGoal(req.params.id);
  res.json(goal);
});

export const getGoalProgress = asyncHandler(async (req: Request, res: Response) => {
  const referenceMonth = (req.query.month as string) || new Date().toISOString().slice(0, 7) + '-01';
  const progress = await service.getGoalProgress(req.params.id, referenceMonth);
  res.json(progress);
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await service.editGoal(req.params.id, req.body);
  res.json(goal);
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  await service.removeGoal(req.params.id);
  res.status(204).send();
});

// ─── Commission Rules ──────────────────────────────────────────────────────────

export const listCommissionRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await service.listCommissionRules();
  res.json(rules);
});

export const updateCommissionRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await service.editCommissionRule(req.params.id, req.body);
  res.json(rule);
});

// ─── Monetizations ────────────────────────────────────────────────────────────

export const listMonetizations = asyncHandler(async (req: Request, res: Response) => {
  const { month, type, account_user_id, status } = req.query as Record<string, string>;
  const items = await service.listMonetizations({
    reference_month: month,
    monetization_type: type,
    account_user_id,
    status,
  });
  res.json(items);
});

export const createMonetization = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Nao autenticado', 401);
  const item = await service.createMonetization({ ...req.body, created_by: req.user.userId });
  res.status(201).json(item);
});

export const getMonetization = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.getMonetization(req.params.id);
  res.json(item);
});

export const updateMonetization = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.editMonetization(req.params.id, req.body);
  res.json(item);
});

export const getMonetizationOverview = asyncHandler(async (req: Request, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7) + '-01';
  const overview = await service.getOverview(month);
  res.json(overview);
});

// ─── Commissions ──────────────────────────────────────────────────────────────

export const listCommissions = asyncHandler(async (req: Request, res: Response) => {
  const { month, account_user_id, status } = req.query as Record<string, string>;
  const items = await service.listCommissions({ reference_month: month, account_user_id, status });
  res.json(items);
});

export const calculateCommissions = asyncHandler(async (req: Request, res: Response) => {
  const { reference_month } = req.body;
  const result = await service.calculateCommissions(reference_month);
  res.json(result);
});

export const approveCommission = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const commission = await service.approveCommission(req.params.id, status);
  res.json(commission);
});

export const getCommissionSummary = asyncHandler(async (req: Request, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7) + '-01';
  const summary = await service.listCommissionSummary(month);
  res.json(summary);
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7) + '-01';
  const data = await service.getDashboard(month);
  res.json(data);
});
