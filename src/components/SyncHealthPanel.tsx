import { SyncHealthStatus } from '@/lib/sync-health';

interface SyncHealthPanelProps {
  status: SyncHealthStatus;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN');
}

function formatDuration(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) return '-';
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

export function SyncHealthPanel({ status }: SyncHealthPanelProps) {
  const isHealthy = status.lastStatus === 'success' && status.consecutiveFailures === 0;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">🛟 同步健康度</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-5">
          <div className="text-sm text-gray-400 mb-2">当前状态</div>
          <div className={`text-2xl font-bold ${isHealthy ? 'text-green-400' : 'text-yellow-300'}`}>
            {isHealthy ? '健康' : '需关注'}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            连续失败: {status.consecutiveFailures}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-5">
          <div className="text-sm text-gray-400 mb-2">最近一次成功</div>
          <div className="text-sm text-gray-200">{formatDateTime(status.lastSuccessAt)}</div>
          <div className="text-sm text-gray-500 mt-2">
            最近耗时: {formatDuration(status.lastDurationMs)}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-5">
          <div className="text-sm text-gray-400 mb-2">最近一次导入</div>
          <div className="text-2xl font-bold text-white">{status.lastImportedCount}</div>
          <div className="text-sm text-gray-500 mt-2">
            最近运行: {formatDateTime(status.lastRunAt)}
          </div>
        </div>
      </div>

      {(status.lastError || status.recentRuns.length > 0) && (
        <div className="bg-gray-800 rounded-lg p-5 mt-4">
          {status.lastError ? (
            <p className="text-sm text-yellow-300 mb-3">最近错误: {status.lastError}</p>
          ) : null}
          <div className="space-y-2">
            {status.recentRuns.slice(0, 5).map((run) => (
              <div key={run.runAt} className="text-xs text-gray-300 flex items-center justify-between">
                <span>{formatDateTime(run.runAt)}</span>
                <span>{run.success ? '成功' : '失败'}</span>
                <span>尝试 {run.attempts}</span>
                <span>导入 {run.importedCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
