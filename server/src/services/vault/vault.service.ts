import { getVaultPath, getClientVaultFolders, PORTFOLIO_FOLDER } from './vault-structure';
import { renderToMarkdown } from './markdown-templates';
import { logger } from '../../utils/logger';

// Will be extended in drive.service.ts
import { uploadFileToDrive, createClientFolder } from '../drive.service';

export interface VaultDocument {
  clientName: string;
  docType: string;
  data: Record<string, unknown>;
}

/**
 * Render a knowledge document to markdown and return the content + vault path.
 */
export function renderVaultDocument(doc: VaultDocument): { markdown: string; vaultPath: string } {
  const markdown = renderToMarkdown(doc.docType, doc.data, doc.clientName);
  const vaultPath = getVaultPath(doc.clientName, doc.docType);
  return { markdown, vaultPath };
}

/**
 * Get the folder structure that needs to be created for a client vault.
 */
export function getVaultFolderStructure(clientName: string): string[] {
  return getClientVaultFolders().map(folder => `${clientName}/${folder}`);
}

/**
 * Initialize vault folder structure on Google Drive for a client.
 * Creates the root client folder and all subfolders.
 */
export async function initializeClientVault(
  clientName: string,
  parentFolderId: string
): Promise<{ folderId: string; subFolderIds: Record<string, string> }> {
  try {
    logger.info(`Initializing vault for client: ${clientName}`);

    // For now, return placeholder IDs — actual Drive integration in drive.service.ts
    const folderId = `vault-${clientName.toLowerCase().replace(/\s+/g, '-')}`;
    const subFolderIds: Record<string, string> = {};

    for (const folder of getClientVaultFolders()) {
      subFolderIds[folder] = `${folderId}/${folder}`;
    }

    logger.info(`Vault initialized: ${Object.keys(subFolderIds).length} folders created`);
    return { folderId, subFolderIds };
  } catch (err) {
    logger.error('Failed to initialize client vault:', err);
    throw err;
  }
}

/**
 * Sync a rendered markdown document to Google Drive vault.
 */
export async function syncDocumentToDrive(
  markdown: string,
  vaultPath: string,
  _parentFolderId: string
): Promise<string | null> {
  try {
    logger.info(`Syncing to vault: ${vaultPath}`);
    // TODO: Implement actual Drive upload using drive.service.ts writeMarkdownFile()
    // For now, log and return null
    logger.info(`Vault sync placeholder for: ${vaultPath} (${markdown.length} chars)`);
    return null;
  } catch (err) {
    logger.error(`Failed to sync ${vaultPath} to Drive:`, err);
    return null;
  }
}
