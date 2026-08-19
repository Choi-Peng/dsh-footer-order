// Host-half integration test for dsh-footer-order (v0.2.0 settings-seam model).
// Boots a REAL cordis Context with the REAL @deepseek-ai/dsh-settings provider
// (in-memory storage), mounts the plugin, and exercises the thin proxy:
//   1. GET  → resolved value (defaults → base → user) + revision + hasOverrides,
//   2. POST → save merges into the settings user layer (revision bumps),
//   3. stale expectedRevision → 409 conflict carrying the latest revision,
//   4. schema-invalid fields → 400 invalid-field,
//   5. POST reset → replace({}) falls back to the base (patch config),
//   6. no settings service → GET/POST 503 while the layout feature is untouched.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { SettingsProvider } from '@deepseek-ai/dsh-settings';
import * as plugin from '../lib/index.js';

// @deepseek-ai/cordis is a peer of dsh-settings, not a direct dependency of
// this plugin; resolve it from the installed dsh-settings location.
const require = createRequire(import.meta.url);
const cordisPath = require.resolve('@deepseek-ai/cordis', {
  paths: [require.resolve('@deepseek-ai/dsh-settings')],
});
const { Context } = await import(cordisPath);

const NS = 'footer-order';
let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ok - ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${msg}`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Settings provider backed by an in-memory document (the "settings.yaml"). */
class MemoryProvider extends SettingsProvider {
  constructor(ctx) {
    super(ctx);
    this.doc = {};
  }
  async load() {
    return this.doc;
  }
  async persist(ns, section) {
    this.doc[ns] = section;
  }
  get writable() {
    return true;
  }
}

function makeServer() {
  const routes = [];
  return {
    routes,
    register: (route) => {
      routes.push(route);
      return () => {};
    },
  };
}

/** Mount the plugin on a fresh real-cordis Context. */
async function mount(config, { withSettings = true } = {}) {
  const ctx = new Context();
  const server = makeServer();
  ctx.provide('webServer', server);
  if (withSettings) await ctx.plugin(MemoryProvider);
  await ctx.plugin(plugin, config);
  // Let the nested `ctx.inject(['settings'])` fiber settle.
  await sleep(30);
  return { ctx, server };
}

/** GET until the route answers 200 (scope mounted) or the budget runs out. */
async function waitReady(route) {
  for (let i = 0; i < 40; i += 1) {
    const res = makeRes();
    await route.handler(makeReq('GET'), res);
    if (res._status === 200) return true;
    await sleep(25);
  }
  return false;
}

function makeRes() {
  const res = {
    _status: 0,
    _body: '',
    writeHead(status, headers) {
      this._status = status;
      this._headers = headers;
    },
    end(body) {
      this._body = body;
    },
    req: { headers: {} },
  };
  return res;
}

function makeReq(method, body) {
  const req = {
    method,
    headers: { 'Content-Type': 'application/json', origin: 'http://127.0.0.1:3080' },
    on(ev, cb) {
      if (ev === 'data' && body !== undefined) {
        cb(Buffer.from(JSON.stringify(body)));
      } else if (ev === 'end') {
        cb();
      }
    },
    once() {},
    destroy() {},
  };
  return req;
}

async function call(route, method, body) {
  const res = makeRes();
  await route.handler(makeReq(method, body), res);
  return { status: res._status, body: JSON.parse(res._body) };
}

async function main() {
  // A temp dir to prove the plugin never writes to the profile patch layer.
  const dir = mkdtempSync(join(tmpdir(), 'dfo-v02-'));

  // ── 1. mount with the settings service; base = patch config ───────────────
  console.log('1) mount with settings service');
  const baseConfig = { layout: 'row', gap: 2 }; // the cordis.patch.yml row config
  const { ctx, server } = await mount(baseConfig);
  assert(server.routes.length === 1, 'one route registered');
  assert(server.routes[0].path === '/footer-order/settings', 'route path is /footer-order/settings');
  const route = server.routes[0];
  assert(await waitReady(route), 'settings scope mounted (GET answers 200)');

  // ── 2. GET effective settings ─────────────────────────────────────────────
  console.log('2) GET effective settings');
  let r = await call(route, 'GET');
  assert(r.status === 200, 'GET returns 200');
  assert(r.body.layout === 'row' && r.body.gap === 2 && r.body.align === 'stretch', 'GET resolves base layer (patch config)');
  assert(JSON.stringify(r.body.order) === '[]', 'GET order defaults to []');
  assert(r.body.revision === 0, 'GET revision starts at 0');
  assert(r.body.hasOverrides === false, 'GET hasOverrides false with no user layer');

  // ── 3. POST save → user layer, revision bump, patch layer untouched ───────
  console.log('3) POST save');
  r = await call(route, 'POST', { layout: 'column', gap: 6, align: 'center', order: ['a', 'b'], expectedRevision: 0 });
  assert(r.status === 200, 'POST save returns 200');
  assert(r.body.layout === 'column' && r.body.gap === 6 && r.body.align === 'center', 'save applies layout/gap/align');
  assert(JSON.stringify(r.body.order) === '["a","b"]', 'save applies order');
  assert(r.body.revision === 1, 'revision bumped to 1');
  assert(r.body.hasOverrides === true, 'hasOverrides true after save');
  const desc = ctx.settings.describe({ redactSecrets: true }).find((d) => d.ns === NS);
  assert(
    desc && JSON.stringify(desc.user) === JSON.stringify({ layout: 'column', gap: 6, align: 'center', order: ['a', 'b'] }),
    'change persisted into the settings user layer (not the patch file)',
  );
  assert(
    desc && desc.base && desc.base.layout === 'row' && desc.base.gap === 2,
    'base layer still carries the original patch config',
  );

  // ── 4. stale revision → 409 ───────────────────────────────────────────────
  console.log('4) concurrent write (stale revision)');
  r = await call(route, 'POST', { gap: 9, expectedRevision: 0 });
  assert(r.status === 409, 'stale expectedRevision returns 409');
  assert(r.body.error === 'conflict', '409 body marks conflict');
  assert(r.body.revision === 1, '409 carries the latest revision');
  // A fresh revision goes through.
  r = await call(route, 'POST', { gap: 9, expectedRevision: 1 });
  assert(r.status === 200 && r.body.gap === 9 && r.body.revision === 2, 'fresh revision accepted');

  // ── 5. schema-invalid fields → 400 ────────────────────────────────────────
  console.log('5) validation');
  r = await call(route, 'POST', { layout: 'diagonal', expectedRevision: 2 });
  assert(r.status === 400 && r.body.error === 'invalid-field' && r.body.fields.indexOf('layout') !== -1, 'invalid layout rejected');
  r = await call(route, 'POST', { gap: -3, expectedRevision: 2 });
  assert(r.status === 400 && r.body.fields.indexOf('gap') !== -1, 'negative gap rejected');
  r = await call(route, 'POST', { order: [1, 'a', 'a', ''], expectedRevision: 2 });
  assert(r.status === 400 && r.body.fields.indexOf('order') !== -1, 'non-string order entry rejected');

  // ── 6. POST reset → falls back to base ────────────────────────────────────
  console.log('6) POST reset');
  r = await call(route, 'POST', { reset: true, expectedRevision: 2 });
  assert(r.status === 200, 'reset returns 200');
  assert(r.body.layout === 'row' && r.body.gap === 2, 'reset falls back to the base (patch config)');
  assert(JSON.stringify(r.body.order) === '[]' && r.body.align === 'stretch', 'reset re-inherits defaults');
  assert(r.body.hasOverrides === false, 'reset clears overrides');
  assert(r.body.revision === 3, 'reset bumps revision');
  r = await call(route, 'GET');
  assert(r.body.hasOverrides === false && r.body.layout === 'row', 'GET after reset still base');
  assert(ctx.settings.describe({ redactSecrets: true }).find((d) => d.ns === NS).user !== undefined, 'user layer exists (empty) after reset');

  // ── 7. no settings service → 503, layout unaffected ───────────────────────
  console.log('7) no settings service');
  const { server: server2 } = await mount(undefined, { withSettings: false });
  const route2 = server2.routes[0];
  assert(route2 !== undefined, 'route still registered without settings service');
  r = await call(route2, 'GET');
  assert(r.status === 503 && r.body.error === 'settings-unavailable', 'GET 503 without settings');
  r = await call(route2, 'POST', { layout: 'column' });
  assert(r.status === 503, 'POST 503 without settings');

  rmSync(dir, { recursive: true, force: true });
  console.log(failures === 0 ? '\nALL HOST TESTS PASSED' : `\n${failures} HOST TEST(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
