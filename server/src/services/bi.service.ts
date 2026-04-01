import { logger } from '../utils/logger';
import * as biRepo from '../repositories/bi.repository';
import * as reportsRepo from '../repositories/reports.repository';
import * as clientsRepo from '../repositories/clients.repository';
import { generateBI } from './ai/ai.service';
import type { PromptContext } from './ai/ai.service';
import type { BIRecord } from '../repositories/bi.repository';

export type { BIRecord };

export interface BIRefreshOptions {
  type: 'individual' | 'global';
  clientId?: string;
}

// ── getClientBI ───────────────────────────────────────────────────────────────

export async function getClientBI(clientId: string): Promise<BIRecord | null> {
  const records = await biRepo.findByClientId(clientId, 'individual');
  return records[0] ?? null;
}

// ── getGlobalBI ───────────────────────────────────────────────────────────────

export async function getGlobalBI(): Promise<BIRecord | null> {
  return biRepo.findGlobal();
}

// ── generateClientBI ──────────────────────────────────────────────────────────

export async function generateClientBI(clientId: string): Promise<BIRecord> {
  // Require at least one report
  const reports = await reportsRepo.findByClientId(clientId);
  if (reports.length === 0) {
    throw Object.assign(new Error('No report data available'), { statusCode: 422 });
  }

  const client = await clientsRepo.findClientById(clientId) as Record<string, unknown> | null;

  const context: PromptContext = {
    clientName: (client?.name as string) ?? 'Unknown client',
    clientSegment: client?.segment as string | undefined,
    campaignReports: reports as unknown as Array<Record<string, unknown>>,
  };

  const biData = await generateBI(context, 'individual');

  const record = await biRepo.upsert({
    client_id: clientId,
    type: 'individual',
    data_json: biData as unknown as Record<string, unknown>,
  });

  logger.info(`generateClientBI: saved BI for client ${clientId}`);
  return record;
}

// ── generateGlobalBI ──────────────────────────────────────────────────────────

export async function generateGlobalBI(): Promise<BIRecord> {
  const allClients = await clientsRepo.findAllClients(200, 0) as Array<Record<string, unknown>>;
  const allBIRecords = await biRepo.findAllForGlobal();

  // Build aggregated context
  const allReports: Array<Record<string, unknown>> = [];
  for (const client of allClients) {
    const clientReports = await reportsRepo.findByClientId(client.id as string);
    allReports.push(...(clientReports as unknown as Array<Record<string, unknown>>));
  }

  const context: PromptContext = {
    clientName: 'Agência — Visão Global',
    campaignReports: allReports,
    // Include existing individual BI data as context
    summaryJson: allBIRecords.length > 0
      ? { individual_bi_count: allBIRecords.length, clients: allBIRecords.map((r) => r.client_id) }
      : undefined,
  };

  const biData = await generateBI(context, 'global');

  const record = await biRepo.upsert({
    client_id: null,
    type: 'global',
    data_json: biData as unknown as Record<string, unknown>,
  });

  logger.info('generateGlobalBI: saved global BI');
  return record;
}

// ── refreshBI — used by queue job ─────────────────────────────────────────────

export async function refreshBI(options: BIRefreshOptions): Promise<void> {
  if (options.type === 'individual' && options.clientId) {
    try {
      await generateClientBI(options.clientId);
    } catch (err) {
      // Don't throw if no reports — just log
      logger.warn(`refreshBI: client ${options.clientId} — ${(err as Error).message}`);
    }
  } else if (options.type === 'global') {
    await generateGlobalBI();
  }
}

// ── aggregateClientMetrics — helper for jobs ──────────────────────────────────

export async function aggregateClientMetrics(clientId: string): Promise<Record<string, unknown>> {
  const reports = await reportsRepo.findByClientId(clientId);
  if (reports.length === 0) return {};

  const totalSpend = reports.reduce((s, r) => s + (r.spend ?? 0), 0);
  const avgROAS = reports.filter((r) => r.roas != null).reduce((s, r) => s + (r.roas ?? 0), 0) / (reports.filter((r) => r.roas != null).length || 1);
  const avgCPA = reports.filter((r) => r.cpa != null).reduce((s, r) => s + (r.cpa ?? 0), 0) / (reports.filter((r) => r.cpa != null).length || 1);

  return { totalSpend, avgROAS, avgCPA, reportCount: reports.length };
}

export async function aggregateGlobalMetrics(): Promise<Record<string, unknown>> {
  const allClients = await clientsRepo.findAllClients(200, 0) as Array<Record<string, unknown>>;
  let totalSpend = 0;
  let roasSum = 0;
  let roasCount = 0;
  let totalReports = 0;

  for (const client of allClients) {
    const reports = await reportsRepo.findByClientId(client.id as string);
    for (const r of reports) {
      totalSpend += r.spend ?? 0;
      if (r.roas != null) { roasSum += r.roas; roasCount++; }
      totalReports++;
    }
  }

  return {
    totalClients: allClients.length,
    totalSpend,
    avgROAS: roasCount > 0 ? roasSum / roasCount : 0,
    totalReports,
  };
}
