import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('Google OAuth2 credentials not fully configured. Google integrations will be unavailable.');
}

export const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export function getDriveClient(accessToken?: string) {
  const authClient = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  if (accessToken) {
    authClient.setCredentials({ access_token: accessToken });
  }

  return google.drive({ version: 'v3', auth: authClient });
}

export function getSheetsClient(accessToken?: string) {
  const authClient = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  if (accessToken) {
    authClient.setCredentials({ access_token: accessToken });
  }

  return google.sheets({ version: 'v4', auth: authClient });
}

export function getAuthUrl(scopes: string[]): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export const GOOGLE_SCOPES = {
  DRIVE_READONLY: 'https://www.googleapis.com/auth/drive.readonly',
  DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file',
  SHEETS_READONLY: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  SHEETS: 'https://www.googleapis.com/auth/spreadsheets',
} as const;
