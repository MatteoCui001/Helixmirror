import { RoutingMetrics } from '@/lib/routing-logs';

interface RoutingMetricsPanelProps {
  metrics: RoutingMetrics;
}

function formatDay(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function renderRatioBar(rate: number): string {
  const total = 10;
  const filled = Math.round((Math.max(0, Math.min(100, rate)) / 100) * total);
  return `${'#'.repeat(filled)}${'.'.repeat(total - filled)}`;
}

export function RoutingMetricsPanel({ metrics }: RoutingMetricsPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">按 Agent 接受率</h3>
        {metrics.byAgent.length === 0 ? (
          <p className="text-sm text-gray-500">暂无路由数据</p>
        ) : (
          <div className="space-y-2">
            {metrics.byAgent.map((item) => (
              <div key={item.agentId} className="flex items-center justify-between text-sm">
                <span className="text-gray-200">{item.agentId}</span>
                <span className="font-mono text-gray-400">{renderRatioBar(item.acceptanceRate)}</span>
                <span className="text-gray-300">{item.acceptanceRate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">7 日趋势</h3>
        {metrics.dailyTrend.length === 0 ? (
          <p className="text-sm text-gray-500">暂无趋势数据</p>
        ) : (
          <div className="space-y-1">
            {metrics.dailyTrend.map((day) => (
              <div key={day.date} className="grid grid-cols-4 text-xs text-gray-300">
                <span>{formatDay(day.date)}</span>
                <span>总 {day.total}</span>
                <span>接 {day.accepted}</span>
                <span>{day.acceptanceRate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">高频未采纳关键词</h3>
        {metrics.topMismatchKeywords.length === 0 ? (
          <p className="text-sm text-gray-500">暂无关键词数据</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {metrics.topMismatchKeywords.map((item) => (
              <span
                key={item.keyword}
                className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-300"
              >
                {item.keyword} ({item.count})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
