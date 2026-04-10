import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  startConnection,
  getStatus,
  disconnect,
  listGroups,
} from '../services/whatsapp-baileys.service';
import QRCode from 'qrcode';

// ── GET /api/whatsapp-connect/status ────────────────────────────────────────

export const getConnectionStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = getStatus();
  res.status(200).json(status);
});

// ── POST /api/whatsapp-connect/start ────────────────────────────────────────

export const startWhatsApp = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await startConnection();
  res.status(200).json(result);
});

// ── GET /api/whatsapp-connect/qr ────────────────────────────────────────────
// Returns QR code as PNG image for scanning

export const getQRCode = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const { qrCode } = getStatus();

  if (!qrCode) {
    res.status(404).json({ error: 'No QR code available. Call POST /api/whatsapp-connect/start first.' });
    return;
  }

  // Generate QR code as PNG data URL
  const qrImage = await QRCode.toDataURL(qrCode, { width: 400, margin: 2 });

  // Return as HTML page with auto-refresh for easy scanning
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI SICI - Conectar WhatsApp</title>
      <meta http-equiv="refresh" content="15">
      <style>
        body { background: #0A0A14; color: #F0F0FF; font-family: Inter, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        h1 { background: linear-gradient(90deg, #1A56DB, #E040FB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        img { border-radius: 16px; margin: 20px 0; }
        p { color: #A0A0C0; max-width: 400px; text-align: center; }
        .status { color: #06B6D4; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>AI SICI — WhatsApp</h1>
      <img src="${qrImage}" alt="QR Code" />
      <p>Abra o <strong>WhatsApp</strong> no celular &gt; <strong>Configurações</strong> &gt; <strong>Dispositivos conectados</strong> &gt; <strong>Conectar dispositivo</strong></p>
      <p>Escaneie o QR code acima</p>
      <p class="status">Página atualiza automaticamente a cada 15s</p>
    </body>
    </html>
  `);
});

// ── POST /api/whatsapp-connect/disconnect ───────────────────────────────────

export const disconnectWhatsApp = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  await disconnect();
  res.status(200).json({ message: 'Disconnected' });
});

// ── GET /api/whatsapp-connect/groups ────────────────────────────────────────

export const getGroups = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const groups = await listGroups();
  res.status(200).json({ data: groups, total: groups.length });
});
