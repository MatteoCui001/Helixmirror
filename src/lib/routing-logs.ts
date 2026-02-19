import { AGENT_IDENTITY_RULES } from './agent-config';
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

export interface RoutingAgentMetric {
  agentId: string;
  recommended: number;
  accepted: number;
  acceptanceRate: number;
}

export interface RoutingDailyMetric {
  date: string;
  total: number;
  accepted: number;
  acceptanceRate: number;
}

export interface RoutingKeywordMetric {
  keyword: string;
  count: number;
}

export interface RoutingMetrics {
  total: number;
  accepted: number;
  acceptanceRate: number;
  byAgent: RoutingAgentMetric[];
  dailyTrend: RoutingDailyMetric[];
  topMismatchKeywords: RoutingKeywordMetric[];
}

interface RoutingOverviewRow {
  total: number;
  accepted: number;
}

interface RoutingAgentRow {
  agentId: string;
  recommended: number;
  accepted: number;
}

interface RoutingDailyRow {
  date: string;
  total: number;
  accepted: number;
}

interface RoutingInputRow {
  inputText: string;
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getRecentDateKeys(days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    keys.push(toDateKey(date));
  }
  return keys;
}

function getKeywordPool(): string[] {
  const keywordSet = new Set<string>();
  for (const rule of AGENT_IDENTITY_RULES) {
    for (const keyword of rule.keywords) {
      const normalized = keyword.trim().toLowerCase();
      if (normalized.length >= 2) {
        keywordSet.add(normalized);
      }
    }
  }
  return Array.from(keywordSet);
}

function getTopMismatchKeywords(inputs: string[], topN: number = 8): RoutingKeywordMetric[] {
  if (inputs.length === 0) {
    return [];
  }

  const pool = getKeywordPool();
  const counts = new Map<string, number>();

  for (const rawInput of inputs) {
    const text = rawInput.toLowerCase();
    for (const keyword of pool) {
      if (text.includes(keyword)) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword, count]) => ({ keyword, count }));
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

export function getRoutingMetrics(trendDays: number = 7): RoutingMetrics {
  const db = getDatabase();

  const overview = db.prepare(`
    SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END), 0) as accepted
    FROM routing_logs
  `).get() as RoutingOverviewRow | undefined;

  const byAgentRows = db.prepare(`
    SELECT
      recommended_agent_id as agentId,
      COUNT(*) as recommended,
      COALESCE(SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END), 0) as accepted
    FROM routing_logs
    GROUP BY recommended_agent_id
    ORDER BY recommended DESC
  `).all() as RoutingAgentRow[];

  const rawDailyRows = db.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END), 0) as accepted
    FROM routing_logs
    WHERE datetime(created_at) >= datetime('now', ?)
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `).all(`-${Math.max(trendDays - 1, 0)} day`) as RoutingDailyRow[];

  const mismatchInputs = db.prepare(`
    SELECT input_text as inputText
    FROM routing_logs
    WHERE was_accepted = 0
    ORDER BY created_at DESC
    LIMIT 500
  `).all() as RoutingInputRow[];

  const total = overview?.total ?? 0;
  const accepted = overview?.accepted ?? 0;
  const acceptanceRate = toPercent(accepted, total);

  const byAgent = byAgentRows.map((row) => ({
    agentId: row.agentId,
    recommended: row.recommended,
    accepted: row.accepted,
    acceptanceRate: toPercent(row.accepted, row.recommended),
  }));

  const dateKeys = getRecentDateKeys(Math.max(trendDays, 1));
  const dailyMap = new Map<string, RoutingDailyRow>();
  for (const row of rawDailyRows) {
    dailyMap.set(row.date, row);
  }

  const dailyTrend = dateKeys.map((date) => {
    const row = dailyMap.get(date);
    const dayTotal = row?.total ?? 0;
    const dayAccepted = row?.accepted ?? 0;
    return {
      date,
      total: dayTotal,
      accepted: dayAccepted,
      acceptanceRate: toPercent(dayAccepted, dayTotal),
    };
  });

  const topMismatchKeywords = getTopMismatchKeywords(
    mismatchInputs.map((row) => row.inputText)
  );

  return {
    total,
    accepted,
    acceptanceRate,
    byAgent,
    dailyTrend,
    topMismatchKeywords,
  };
}
