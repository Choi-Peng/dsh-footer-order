// Host-half integration test for dsh-footer-order.
// Mocks ctx/webServer and a temp profile dir, then exercises:
//   1. default row seeding on startup,
//   2. GET effective settings,
//   3. POST partial update (layout/gap/align/order) preserving other rows/comments,
//   4. POST reset,
//   5. splice round-trip stability.
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as yaml from 'js-yaml';
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include';
import * as plugin from '../lib/index.js';

const PATCH_FILENAME = 'cordis.patch.yml';
let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ok - ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${msg}`);
  }
}

function setupProfile() {
  const dir = mkdtempSync(join(tmpdir(), 'dfo-test-'));
  const patch = join(dir, PATCH_FILENAME);
  // Pre-existing profile with a comment, another plugin row, and a disabled row.
  writeFileSync(
    patch,
    [
      '# my comment line',
      '',
      '- id: balance',
      '  disabled: true',
      '- insert:',
      '    - id: deepseek-balance',
      "      name: '@choi-p/dsh-deepseek-balance'",
      '      config:',
      '        displayCurrency: cny',
      '        warningThresholdUsd: 0',
      '',
    ].join('\n'),
    'utf8',
  );
  return { dir, patch };
}

function makeCtx(dir) {
  const routes = [];
  const ctx = {
    baseUrl: `file://${dir}`,
    fiber: { entry: { options: { id: 'footer-order', name: '@choi-p/dsh-footer-order' } } },
    webServer: {
      register: (route) => {
        routes.push(route);
        return () => {};
      },
    },
    effect: (fn) => {
      fn();
      return () => {};
    },
  };
  return { ctx, routes };
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
        // synchronous body delivery for the test
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

function readPatchRows(patchFile) {
  return yaml.load(readFileSync(patchFile, 'utf8'), { schema: entryListSchema });
}

function rowOf(data, id) {
  for (const p of data) {
    const cands = Array.isArray(p.insert) ? p.insert : [p];
    for (const e of cands) {
      if (e && e.id === id) return e;
    }
  }
  return null;
}

async function main() {
  // ── 1. startup seeding ─────────────────────────────────────────────────────
  console.log('1) startup seeding');
  let { dir, patch } = setupProfile();
  let { ctx, routes } = makeCtx(dir);
  plugin.apply(ctx, undefined);
  assert(routes.length === 1, 'one route registered');
  assert(routes[0].path === '/footer-order/settings', 'route path is /footer-order/settings');
  let data = readPatchRows(patch);
  const row = rowOf(data, 'footer-order');
  assert(!!row, 'default row seeded on startup');
  assert(row.name === '@choi-p/dsh-footer-order', 'row name set');
  assert(row.config.layout === 'column' && row.config.gap === 0 && row.config.align === 'stretch' && Array.isArray(row.config.order) && row.config.order.length === 0, 'default config values');
  const patchText = readFileSync(patch, 'utf8');
  assert(patchText.includes('# my comment line'), 'existing comment preserved after seeding');
  assert(patchText.includes('deepseek-balance'), 'existing plugin row preserved after seeding');
  const before = patchText;

  // ── 2. GET effective settings ──────────────────────────────────────────────
  console.log('2) GET effective settings');
  const route = routes[0];
  let res = makeRes();
  await route.handler(makeReq('GET'), res);
  let body = JSON.parse(res._body);
  assert(res._status === 200, 'GET returns 200');
  assert(body.layout === 'column' && body.gap === 0 && body.align === 'stretch', 'GET returns defaults');
  assert(Array.isArray(body.order), 'GET order is an array');
  assert(body.hasOverrides === true, 'GET reports hasOverrides after seeding');

  // ── 3. POST partial update with order list ─────────────────────────────────
  console.log('3) POST update (layout=row, gap=6, order list)');
  res = makeRes();
  await route.handler(makeReq('POST', { layout: 'row', gap: 6, order: ['deepseek-balance', 'other-plugin'] }), res);
  body = JSON.parse(res._body);
  assert(res._status === 200, 'POST returns 200');
  assert(body.layout === 'row' && body.gap === 6, 'POST applies layout/gap');
  assert(JSON.stringify(body.order) === JSON.stringify(['deepseek-balance', 'other-plugin']), 'POST applies order list');
  assert(body.align === 'stretch', 'unset fields keep current value');
  const afterUpdate = readFileSync(patch, 'utf8');
  assert(afterUpdate.includes('# my comment line'), 'comment survives splice update');
  assert(afterUpdate.includes('displayCurrency: cny'), 'sibling row config survives splice update');
  data = readPatchRows(patch);
  assert(JSON.stringify(rowOf(data, 'footer-order').config.order) === JSON.stringify(['deepseek-balance', 'other-plugin']), 'patch row order persisted');
  const beforeRowText = before.slice(before.indexOf('id: footer-order'));
  const afterRowText = afterUpdate.slice(afterUpdate.indexOf('id: footer-order'));
  assert(beforeRowText !== afterRowText, 'row text changed');
  assert(afterUpdate.split('footer-order').length >= 2, 'row still present exactly once');
  assert(afterUpdate.indexOf('displayCurrency: cny') === before.indexOf('displayCurrency: cny'), 'sibling bytes untouched (splice, not dump)');

  // ── 4. POST reset ──────────────────────────────────────────────────────────
  console.log('4) POST reset');
  res = makeRes();
  await route.handler(makeReq('POST', { reset: true }), res);
  body = JSON.parse(res._body);
  assert(res._status === 200, 'reset returns 200');
  assert(body.layout === 'column' && body.gap === 0 && body.align === 'stretch', 'reset restores defaults');
  assert(JSON.stringify(body.order) === '[]', 'reset clears order');
  data = readPatchRows(patch);
  const rowAfterReset = rowOf(data, 'footer-order');
  assert(rowAfterReset && rowAfterReset.config === undefined, 'reset removes the row config block');
  assert(readFileSync(patch, 'utf8').includes('displayCurrency: cny'), 'sibling config intact after reset');

  // ── 5. invalid values rejected ─────────────────────────────────────────────
  console.log('5) validation');
  res = makeRes();
  await route.handler(makeReq('POST', { layout: 'diagonal' }), res);
  body = JSON.parse(res._body);
  assert(res._status === 400 && body.error === 'invalid-field' && body.fields.indexOf('layout') !== -1, 'invalid layout rejected');
  res = makeRes();
  await route.handler(makeReq('POST', { gap: -3 }), res);
  body = JSON.parse(res._body);
  assert(res._status === 400 && body.fields.indexOf('gap') !== -1, 'negative gap rejected');
  res = makeRes();
  await route.handler(makeReq('POST', { order: [1, 'a', 'a', ''] }), res);
  body = JSON.parse(res._body);
  assert(res._status === 200 && JSON.stringify(body.order) === '["a"]', 'order sanitized (strings only, deduped, empties dropped)');

  // ── 6. idempotent no-op ────────────────────────────────────────────────────
  console.log('6) idempotent no-op');
  const textAfter5 = readFileSync(patch, 'utf8');
  res = makeRes();
  await route.handler(makeReq('POST', { order: ['a'] }), res);
  assert(readFileSync(patch, 'utf8') === textAfter5, 'no rewrite when config unchanged');

  rmSync(dir, { recursive: true, force: true });
  console.log(failures === 0 ? '\nALL HOST TESTS PASSED' : `\n${failures} HOST TEST(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
