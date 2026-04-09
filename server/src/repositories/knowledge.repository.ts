import { query } from '../config/database';

export interface KnowledgeDocRow {
  id: string;
  client_id: string | null;
  doc_type: string;
  title: string;
  content_md: string | null;
  content_json: Record<string, unknown>;
  source_ids: unknown[];
  drive_file_id: string | null;
  vault_path: string | null;
  version: number;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

export async function findByClientId(clientId: string): Promise<KnowledgeDocRow[]> {
  const result = await query<KnowledgeDocRow>(
    'SELECT * FROM knowledge_documents WHERE client_id = $1 ORDER BY doc_type',
    [clientId]
  );
  return result.rows;
}

export async function findByClientAndType(clientId: string, docType: string): Promise<KnowledgeDocRow | null> {
  const result = await query<KnowledgeDocRow>(
    'SELECT * FROM knowledge_documents WHERE client_id = $1 AND doc_type = $2',
    [clientId, docType]
  );
  return result.rows[0] ?? null;
}

export async function findGlobalByType(docType: string): Promise<KnowledgeDocRow | null> {
  const result = await query<KnowledgeDocRow>(
    'SELECT * FROM knowledge_documents WHERE client_id IS NULL AND doc_type = $1',
    [docType]
  );
  return result.rows[0] ?? null;
}

export async function upsert(data: {
  client_id: string | null;
  doc_type: string;
  title: string;
  content_md: string;
  content_json: Record<string, unknown>;
  source_ids?: unknown[];
  vault_path?: string;
  generated_by?: string;
}): Promise<KnowledgeDocRow> {
  const result = await query<KnowledgeDocRow>(
    `INSERT INTO knowledge_documents (client_id, doc_type, title, content_md, content_json, source_ids, vault_path, generated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (client_id, doc_type) WHERE client_id IS NOT NULL
     DO UPDATE SET
       title = EXCLUDED.title,
       content_md = EXCLUDED.content_md,
       content_json = EXCLUDED.content_json,
       source_ids = EXCLUDED.source_ids,
       vault_path = EXCLUDED.vault_path,
       generated_by = EXCLUDED.generated_by,
       version = knowledge_documents.version + 1,
       updated_at = NOW()
     RETURNING *`,
    [
      data.client_id,
      data.doc_type,
      data.title,
      data.content_md,
      JSON.stringify(data.content_json),
      JSON.stringify(data.source_ids ?? []),
      data.vault_path ?? null,
      data.generated_by ?? 'groq',
    ]
  );
  return result.rows[0];
}

export async function updateDriveFileId(id: string, driveFileId: string): Promise<void> {
  await query(
    'UPDATE knowledge_documents SET drive_file_id = $1, updated_at = NOW() WHERE id = $2',
    [driveFileId, id]
  );
}

export async function deleteByClientAndType(clientId: string, docType: string): Promise<void> {
  await query(
    'DELETE FROM knowledge_documents WHERE client_id = $1 AND doc_type = $2',
    [clientId, docType]
  );
}
