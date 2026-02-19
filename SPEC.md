# Helix Mirror - Product Spec

**Version:** 1.1  
**Date:** 2026-02-19

## Product Summary

Helix Mirror is a local-first dashboard for observing and coordinating multiple AI agents (Main, Craft, Alpha, Helix) across Feishu and Discord.

## Scope (Current)

1. Unified dashboard for daily agent activity
2. Keyword-based agent recommendation
3. Project memory layer (SQLite-backed)
4. Interaction/project APIs with validation, auth, and rate-limit
5. Manual and scheduled data sync scripts from local OpenClaw data
6. Routing feedback loop with acceptance metrics (`routing_logs`)

## Out of Scope (Current)

- LLM-based intent classification
- Cross-channel real-time bidirectional sync
- Multi-user auth/permissions
- Automated learning/optimization loops

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Recharts
- SQLite via better-sqlite3

## Data Source

- `~/.openclaw/logs/gateway.log`
- OpenClaw session files (for Discord interactions)
- Manual script import for fallback/demo

## Runtime

- Phase 1/1.5: local-first (`npm run dev`)
- Cloud migration is optional and not required for core functionality

## Functional Requirements

### FR-1 Dashboard

- Show today's total messages, active agents, interaction count
- Show agent cards with today/total/last-active metrics
- Show recent interactions list

### FR-2 Router

- Input free text and rank top matching agents by keyword score
- Display channel and score
- Keep algorithm deterministic and low-latency

### FR-3 Project Memory

- List projects with status (`active|paused|completed`)
- Create project with optional description and related agents
- Update project status

### FR-4 Interaction API

- `POST /api/interactions`
- `GET /api/interactions?limit=...`
- Validate payload via Zod
- Production requires bearer token
- Rate-limit by client IP

### FR-5 Project API

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- Validate payload via Zod
- Production requires bearer token
- Rate-limit by client IP

### FR-6 Routing Feedback API

- `POST /api/routing-logs` records recommendation vs user choice
- `GET /api/routing-logs` returns recent logs and acceptance metrics

## Non-Functional Requirements

- Project compiles and type-checks cleanly
- Lint runs non-interactively
- Build does not depend on external fonts/network fetch at compile time
- API errors use consistent JSON shape (`error`, optional `details`)

## Acceptance Criteria

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- Dashboard and `/projects` render correctly
- APIs above return expected success/error responses
