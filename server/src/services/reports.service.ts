import { logger } from '../utils/logger';
import * as reportsRepo from '../repositories/reports.repository';
import type { CampaignReport, CreateReportData } from '../repositories/reports.repository';
import { eventBus } from '../events/eventBus';

export type { CampaignReport };

export async function listReports(clientId: string): Promise<CampaignReport[]> {
  return reportsRepo.findByClientId(clientId);
}

export async function createReport(
  data: CreateReportData
): Promise<CampaignReport> {
  const report = await reportsRepo.create(data);
  logger.info(`createReport: created report ${report.id} for client ${report.client_id}`);

  // Emit event so BI gets refreshed
  eventBus.emit('report:uploaded', { reportId: report.id, clientId: report.client_id });

  return report;
}

export async function getReportById(id: string): Promise<CampaignReport | null> {
  return reportsRepo.findById(id);
}
