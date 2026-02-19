import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const port = Number.parseInt(process.env.SMOKE_PORT || '4010', 10);
const apiToken = process.env.API_TOKEN || 'ci-smoke-token';
const baseUrl = `http://127.0.0.1:${port}`;

function startServer() {
  const standaloneServer = join(process.cwd(), '.next', 'standalone', 'server.js');
  const hasStandalone = existsSync(standaloneServer);

  if (hasStandalone) {
    return spawn('node', [standaloneServer], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        API_TOKEN: apiToken,
        PORT: String(port),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  return spawn('npm', ['run', 'start', '--', '-p', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      API_TOKEN: apiToken,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForServerReady(timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/interactions?limit=1`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (response.status === 200) {
        return;
      }
    } catch {
      // ignore until ready
    }
    await sleep(500);
  }

  throw new Error('Smoke test server did not become ready within timeout');
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response for ${path}: ${text}`);
  }

  return { response, data };
}

async function runSmoke() {
  const interactionPayload = {
    agentId: 'craft',
    channel: 'Discord',
    messagePreview: 'ci smoke: interaction insert',
    messageCount: 1,
  };
  const interactionRes = await request('/api/interactions', {
    method: 'POST',
    body: JSON.stringify(interactionPayload),
  });
  assert.equal(interactionRes.response.status, 201);
  assert.equal(interactionRes.data.success, true);

  const interactionsRes = await request('/api/interactions?limit=3');
  assert.equal(interactionsRes.response.status, 200);
  assert.equal(interactionsRes.data.success, true);
  assert.ok(Array.isArray(interactionsRes.data.records));

  const projectRes = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `CI Smoke ${Date.now()}`,
      description: 'CI smoke project',
      agentIds: ['main', 'craft'],
    }),
  });
  assert.equal(projectRes.response.status, 201);
  assert.equal(projectRes.data.success, true);
  const projectId = Number(projectRes.data.id);
  assert.ok(projectId > 0);

  const projectPatchRes = await request(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'paused' }),
  });
  assert.equal(projectPatchRes.response.status, 200);
  assert.equal(projectPatchRes.data.success, true);
  assert.equal(projectPatchRes.data.project.status, 'paused');

  const routingPostRes = await request('/api/routing-logs', {
    method: 'POST',
    body: JSON.stringify({
      inputText: 'ci smoke routing log',
      recommendedAgentId: 'craft',
      recommendedScore: 20,
      userSelectedAgentId: 'craft',
      wasAccepted: true,
    }),
  });
  assert.equal(routingPostRes.response.status, 201);
  assert.equal(routingPostRes.data.success, true);

  const routingGetRes = await request('/api/routing-logs?limit=5');
  assert.equal(routingGetRes.response.status, 200);
  assert.equal(routingGetRes.data.success, true);
  assert.ok(Array.isArray(routingGetRes.data.logs));
  assert.ok(routingGetRes.data.metrics);
  assert.ok(Array.isArray(routingGetRes.data.metrics.byAgent));
  assert.ok(Array.isArray(routingGetRes.data.metrics.dailyTrend));

  const syncStatusRes = await request('/api/sync-status');
  assert.equal(syncStatusRes.response.status, 200);
  assert.equal(syncStatusRes.data.success, true);
  assert.ok(syncStatusRes.data.status);

  console.log('Smoke tests passed.');
}

async function main() {
  const server = startServer();
  server.stdout.on('data', (chunk) => process.stdout.write(`[smoke:server] ${chunk}`));
  server.stderr.on('data', (chunk) => process.stderr.write(`[smoke:server] ${chunk}`));

  try {
    await waitForServerReady();
    await runSmoke();
  } finally {
    server.kill('SIGTERM');
    await sleep(500);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  }
}

main().catch((error) => {
  console.error('Smoke tests failed:', error);
  process.exit(1);
});
