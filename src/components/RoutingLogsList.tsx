import { RoutingLogItem } from '@/lib/routing-logs';

interface RoutingLogsListProps {
  logs: RoutingLogItem[];
}

function truncate(text: string, maxLength: number = 36): string {
  if (!text) return '无输入';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function getAgentLabel(agentId: string | null): string {
  if (!agentId) return '未选择';
  return agentId;
}

export function RoutingLogsList({ logs }: RoutingLogsListProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-500">
        暂无路由记录
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="max-h-[320px] overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className={`p-3 ${index !== logs.length - 1 ? 'border-b border-gray-700' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-white">{truncate(log.inputText)}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${log.wasAccepted ? 'bg-green-900/30 text-green-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                {log.wasAccepted ? '接受' : '改选'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              推荐: {getAgentLabel(log.recommendedAgentId)} | 选择: {getAgentLabel(log.userSelectedAgentId)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
