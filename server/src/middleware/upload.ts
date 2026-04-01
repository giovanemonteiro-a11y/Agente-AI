import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// ─── Upload directory ─────────────────────────────────────────────────────────
// Defaults to <project-root>/uploads (i.e., two directories above server/src/).
// Can be overridden via UPLOAD_DIR env var.

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ??
  path.resolve(__dirname, '..', '..', '..', 'uploads');

// Create the directory if it doesn't exist (sync, runs once at startup)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── File type constants ──────────────────────────────────────────────────────

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

// ─── File filter ──────────────────────────────────────────────────────────────

function audioVideoFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [...ALLOWED_AUDIO_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Accepted formats: ${allowed.join(', ')}`));
  }
}

// ─── Exported multer instances ────────────────────────────────────────────────

/** Disk-based upload (up to 100 MB) — use for recording uploads */
export const uploadAudioVideo = multer({
  storage,
  fileFilter: audioVideoFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/** Convenience alias used by meetings routes */
export const uploadAudio = uploadAudioVideo;

/** Memory-based upload for smaller files processed in-memory (up to 25 MB) */
export const uploadAudioVideoMemory = multer({
  storage: memoryStorage,
  fileFilter: audioVideoFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export { UPLOAD_DIR };
