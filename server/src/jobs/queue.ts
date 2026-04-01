import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

// ─── In-memory fallback queue ────────────────────────────────────────────────
// Used when Redis/Bull is unavailable (e.g., local dev without Redis running).

type JobProcessor<T> = (job: { data: T }) => Promise<unknown>;

interface FallbackQueue<T = unknown> {
  process: (processor: JobProcessor<T>) => void;
  add: (data: T, _opts?: unknown) => Promise<{ id: string }>;
  on: (_event: string, _handler: (...args: unknown[]) => void) => void;
  close: () => Promise<void>;
}

function createFallbackQueue<T>(name: string): FallbackQueue<T> {
  let _processor: JobProcessor<T> | null = null;

  return {
    process(processor: JobProcessor<T>) {
      _processor = processor;
    },
    async add(data: T, _opts?: unknown) {
      const id = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (_processor) {
        const proc = _processor;
        setTimeout(() => {
          proc({ data }).catch((err: unknown) =>
            logger.error(`[FallbackQueue:${name}] job ${id} failed:`, err)
          );
        }, 0);
      } else {
        logger.warn(`[FallbackQueue:${name}] No processor registered — job ${id} dropped`);
      }
      return { id };
    },
    on(_event: string, _handler: (...args: unknown[]) => void) {
      // no-op for fallback
    },
    async close() {
      // no-op
    },
  };
}

// ─── Queue factory ────────────────────────────────────────────────────────────

type AnyQueue = import('bull').Queue | FallbackQueue;

function createQueue(name: string): AnyQueue {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Bull = require('bull') as typeof import('bull');
    const queue = new Bull(name, {
      redis: REDIS_URL,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    // Attach error handler so connection failures never crash the process.
    // Log only the first error per queue to avoid flooding the console.
    let _errorLogged = false;
    (queue as import('bull').Queue).on('error', (err: Error) => {
      if (!_errorLogged) {
        _errorLogged = true;
        logger.warn(`[Bull:${name}] Redis unavailable — queue degraded (${err.message}). Jobs will run in-process.`);
      }
    });

    logger.info(`[Bull:${name}] Queue initialised (Redis: ${REDIS_URL})`);
    return queue;
  } catch (err) {
    logger.warn(
      `[Queue:${name}] Bull/Redis unavailable — using in-memory fallback. Reason: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return createFallbackQueue<unknown>(name) as unknown as AnyQueue;
  }
}

// ─── Exported queues ──────────────────────────────────────────────────────────

export const transcriptionQueue = createQueue('transcription') as import('bull').Queue;
export const driveSyncQueue = createQueue('driveSync') as import('bull').Queue;
export const sheetsSyncQueue = createQueue('sheetsSync') as import('bull').Queue;
export const biRefreshQueue = createQueue('biRefresh') as import('bull').Queue;
export const summaryRefreshQueue = createQueue('summaryRefresh') as import('bull').Queue;

export const allQueues = [
  transcriptionQueue,
  driveSyncQueue,
  sheetsSyncQueue,
  biRefreshQueue,
  summaryRefreshQueue,
];

// ─── Graceful shutdown ────────────────────────────────────────────────────────

export async function closeAllQueues(): Promise<void> {
  await Promise.all(allQueues.map((q) => q.close()));
  try {
    // Only try to quit ioredis client if it was created
    const { redisClient } = await import('../config/redis');
    await redisClient.quit();
  } catch {
    // Redis was never connected — ignore
  }
}
