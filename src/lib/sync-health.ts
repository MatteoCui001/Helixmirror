import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface SyncRunRecord {
  runAt: string;
  success: boolean;
  attempts: number;
  durationMs: number;
  importedCount: number;
  error: string;
}

export interface SyncHealthStatus {
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  lastDurationMs: number | null;
  lastImportedCount: number;
  lastStatus: 'unknown' | 'success' | 'failed';
  lastError: string;
  recentRuns: SyncRunRecord[];
}

const STATUS_FILE = join(process.cwd(), 'data', 'logs', 'sync-status.json');

function getDefaultStatus(): SyncHealthStatus {
  return {
    lastRunAt: null,
    lastSuccessAt: null,
    consecutiveFailures: 0,
    lastDurationMs: null,
    lastImportedCount: 0,
    lastStatus: 'unknown',
    lastError: '',
    recentRuns: [],
  };
}

export function getSyncHealthStatus(): SyncHealthStatus {
  if (!existsSync(STATUS_FILE)) {
    return getDefaultStatus();
  }

  try {
    const raw = JSON.parse(readFileSync(STATUS_FILE, 'utf-8')) as Partial<SyncHealthStatus>;
    return {
      ...getDefaultStatus(),
      ...raw,
      recentRuns: Array.isArray(raw.recentRuns) ? raw.recentRuns : [],
    };
  } catch {
    return {
      ...getDefaultStatus(),
      lastStatus: 'failed',
      lastError: '同步状态文件解析失败',
    };
  }
}
