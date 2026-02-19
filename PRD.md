# Helix Mirror - Product Requirements Document

**Version:** 1.1  
**Date:** 2026-02-19  
**Status:** Phase 1.5 Delivered

## 1. Background

Matteo collaborates with multiple AI agents across different channels. Context is fragmented, and selecting the right agent for a task has cognitive overhead.

## 2. Product Goal

Provide one local-first operating panel to:

- Observe all agent activity in one place
- Recommend the right agent for a task
- Keep shared project context across agents
- Preserve historical interaction data for review

## 3. Target User

- Single power user (`Matteo`)
- Works across Feishu + Discord
- Needs speed, visibility, and low setup overhead

## 4. Problem Statements

1. Agent context is split across channels
2. User repeatedly re-explains project background
3. Agent selection is manual and error-prone
4. No consistent activity telemetry

## 5. Product Scope

### 5.1 Dashboard (`/`)

- Daily overview cards
- Agent activity chart
- Agent state cards
- Recent activity list
- Embedded keyword router

### 5.2 Project Memory (`/projects`)

- Project list and status summary
- Empty-state guidance
- Data read from SQLite `projects` table

### 5.3 APIs

- Interactions API for ingestion/query
- Projects API for CRUD-lite (list/create/get/update-status)

### 5.4 Data Sync

- Script-based ingestion from OpenClaw logs/session files
- Scheduled sync script available for cron/launchd

## 6. Exclusions

- NLP intent model
- Real-time cross-platform bridge
- Multi-tenant collaboration
- Mobile app

## 7. Functional Requirements

### FR-1 Interaction Storage

- Persist `agent_id`, `channel`, `message_preview`, `message_count`, `created_at`
- Validate request payload strictly

### FR-2 Routing Recommendation

- Score by keyword frequency + start-position bonus
- Return deterministic top recommendations

### FR-3 Project Management

- Create/list/get/update project status
- Validate status transitions by enum only

### FR-4 Operational Safety

- API auth in production by `API_TOKEN`
- Per-IP in-memory rate-limit
- Uniform error response format

## 8. Data Model

### agents

- `id`, `name`, `role`, `description`, `channel`, `created_at`

### interactions

- `id`, `agent_id`, `channel`, `message_preview`, `message_count`, `created_at`

### projects

- `id`, `name`, `description`, `status`, `agent_ids`, `created_at`, `updated_at`

### routing_logs

- `id`, `input_text`, `recommended_agent_id`, `recommended_score`, `user_selected_agent_id`, `was_accepted`, `created_at`

## 9. API Contracts

### `POST /api/interactions`

Input:

```json
{
  "agentId": "craft",
  "channel": "Discord",
  "messagePreview": "修复构建问题",
  "messageCount": 2
}
```

### `POST /api/projects`

Input:

```json
{
  "name": "Helix Mirror",
  "description": "Project dashboard",
  "agentIds": ["main", "craft"]
}
```

### `PATCH /api/projects/:id`

Input:

```json
{
  "status": "paused"
}
```

## 10. Quality Gates (Definition of Done)

A delivery is complete only if all are true:

1. `npm run typecheck` succeeds
2. `npm run lint` succeeds
3. `npm run build` succeeds
4. Dashboard and project pages render
5. API endpoints respond with validated data and consistent errors
6. README/SPEC/PRD versions and scope are aligned

## 11. Milestones

### Phase 1 (Done)

- Dashboard foundation
- SQLite schema and query layer
- Interaction ingestion endpoint

### Phase 1.5 (Done)

- Router UI
- Project memory page
- Projects API endpoints
- Validation/auth/rate-limit hardening
- Sync scripts for OpenClaw data

### Phase 2 (Planned)

- Better routing feedback loop using `routing_logs` (basic logging shipped)
- Route recommendation acceptance analytics
- Optional cloud deployment profile

## 12. Risks

1. OpenClaw log format changes
2. Local environment drift (Node/dependency mismatch)
3. In-memory rate-limit resets after restart

## 13. Operational Notes

- Local-first by design; SQLite is source of truth
- Production mode must set `API_TOKEN`
- Sync scripts assume access to local OpenClaw paths
