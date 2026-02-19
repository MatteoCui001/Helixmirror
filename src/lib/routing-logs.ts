import { getDatabase } from './db';

export interface RoutingLogItem {
  id: number;
  inputText: string;
  recommendedAgentId: string;
  recommendedScore: number | null;
  userSelectedAgentId: string | null;
  wasAccepted: number;
  createdAt: string;
}

export interface RoutingMetrics {
  total: number;
  accepted: number;
  acceptanceRate: number;
}

export function getRecentRoutingLogs(limit: number = 10): RoutingLogItem[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT
      id,
      input_text as inputText,
      recommended_agent_id as recommendedAgentId,
      recommended_score as recommendedScore,
      user_selected_agent_id as userSelectedAgentId,
      was_accepted as wasAccepted,
      created_at as createdAt
    FROM routing_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  return rows as RoutingLogItem[];
}

export function getRoutingMetrics(): RoutingMetrics {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END), 0) as accepted
    FROM routing_logs
  `).get() as { total: number; accepted: number } | undefined;

  const total = row?.total ?? 0;
  const accepted = row?.accepted ?? 0;
  const acceptanceRate = total > 0 ? Number(((accepted / total) * 100).toFixed(2)) : 0;

  return {
    total,
    accepted,
    acceptanceRate,
  };
}
