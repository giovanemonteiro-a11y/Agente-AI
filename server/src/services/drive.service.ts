import { google } from 'googleapis';

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
}

function getDriveServiceClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function createClientFolder(
  clientName: string,
  _parentFolderId?: string
): Promise<{ folderId: string; folderUrl: string }> {
  if (!process.env.GOOGLE_CLIENT_EMAIL) {
    console.warn('⚠️  Google Drive not configured (GOOGLE_CLIENT_EMAIL missing) — folder creation skipped');
    return { folderId: 'mock-' + Date.now(), folderUrl: '#' };
  }

  const drive = getDriveServiceClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  // Create main client folder
  const folder = await drive.files.create({
    requestBody: {
      name: clientName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: rootFolderId ? [rootFolderId] : undefined,
    },
    fields: 'id, webViewLink',
  });

  const folderId = folder.data.id!;
  const folderUrl = folder.data.webViewLink!;

  // Create sub-folders
  const subFolders = ['Kickoffs', 'Checkins', 'Estrategia', 'Entregaveis'];
  await Promise.all(
    subFolders.map((name) =>
      drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folderId],
        },
      })
    )
  );

  return { folderId, folderUrl };
}

export async function listFilesInFolder(
  folderId: string,
  _accessToken?: string
): Promise<DriveFile[]> {
  if (!process.env.GOOGLE_CLIENT_EMAIL) {
    console.warn('⚠️  Google Drive not configured — returning empty file list');
    return [];
  }

  const drive = getDriveServiceClient();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, createdTime, modifiedTime)',
  });

  return (response.data.files ?? []) as DriveFile[];
}

export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  _accessToken?: string
): Promise<DriveFile> {
  if (!process.env.GOOGLE_CLIENT_EMAIL) {
    throw new Error('Google Drive not configured');
  }

  const drive = getDriveServiceClient();
  const { Readable } = await import('stream');

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, mimeType, webViewLink, createdTime, modifiedTime',
  });

  return response.data as DriveFile;
}

export async function watchFolder(
  _folderId: string,
  _webhookUrl: string
): Promise<{ channelId: string; expiration: string }> {
  throw new Error('Not implemented');
}
