// Host-half contract test for dsh-footer-order (dsh 0.2 settings model).
//
// The host half no longer registers a settings namespace or serves a settings
// route: it exports the schemastery `Config` that the dsh settings seam
// projects. This test pins that contract:
//   1. the module default export carries the schema under `Config` (cordis reads
//      `fiber.runtime.Config` from there),
//   2. every field is volatile — the seam only exposes, and only accepts writes
//      for, volatile fields,
//   3. the schema resolves the documented defaults,
//   4. valid values pass, invalid ones are rejected at the right path,
//   5. `apply` needs no host service (the whole feature is client-side).
import * as plugin from '../lib/index.js';
import z from '@deepseek-ai/schemastery';
import { Context } from '@deepseek-ai/cordis';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ok - ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${msg}`);
  }
}

/** schemastery returns volatile refs for `.volatile()` fields; unwrap them. */
function unwrap(value) {
  if (value && typeof value === 'object' && typeof value.get === 'function') {
    try {
      return value.get();
    } catch {
      return value;
    }
  }
  return value;
}

const FIELDS = [
  'layout',
  'gap',
  'align',
  'order',
  'settingsLayout',
  'settingsGap',
  'settingsAlign',
  'settingsOrder',
];

async function main() {
  // ── 1. export shape ───────────────────────────────────────────────────────  console.log('1) export shape');
  const { Config } = plugin;
  assert(typeof Config === 'function' && typeof Config.toJSON === 'function', 'Config is a schemastery schema');
  assert(plugin.default && plugin.default.Config === Config, 'default export carries Config (fiber.runtime.Config)');
  assert(typeof plugin.apply === 'function', 'apply is exported');
  assert(plugin.name === 'footer-order', 'name matches the patch entry id (the settings namespace)');

  // ── 2. every field is volatile ────────────────────────────────────────────
  console.log('2) volatility');
  assert(Config.type === 'object', 'Config is an object schema (the seam projects object fields)');
  const dict = Config.dict || {};
  for (const field of FIELDS) {
    const node = dict[field];
    assert(node !== undefined, `field "${field}" is declared`);
    assert(node !== undefined && node.meta && node.meta.volatile === true, `field "${field}" is volatile`);
  }
  assert(Object.keys(dict).length === FIELDS.length, 'no extra fields beyond the documented set');
  // The seam round-trips the schema through `toJSON()`; make sure that survives.
  const restored = new z(Config.toJSON());
  assert(restored !== undefined && restored.type === 'object', 'the schema survives a toJSON round-trip');

  // ── 3. defaults ───────────────────────────────────────────────────────────
  console.log('3) defaults');
  const defaults = Config({});
  assert(unwrap(defaults.layout) === 'column', 'layout defaults to column');
  assert(unwrap(defaults.gap) === 0, 'gap defaults to 0');
  assert(unwrap(defaults.align) === 'stretch', 'align defaults to stretch');
  assert(JSON.stringify(unwrap(defaults.order)) === '[]', 'order defaults to []');
  assert(unwrap(defaults.settingsLayout) === 'contents', 'settingsLayout defaults to contents');
  assert(unwrap(defaults.settingsGap) === 8, 'settingsGap defaults to 8');
  assert(unwrap(defaults.settingsAlign) === 'center', 'settingsAlign defaults to center');
  assert(JSON.stringify(unwrap(defaults.settingsOrder)) === '[]', 'settingsOrder defaults to []');

  // ── 4. validation ─────────────────────────────────────────────────────────
  console.log('4) validation');
  const issuesOf = (value) => {
    const result = Config['~standard'].validate(value);
    return result && Array.isArray(result.issues) ? result.issues : [];
  };

  assert(issuesOf({}).length === 0, 'an empty patch is valid (every field is optional)');
  assert(issuesOf({ gap: 4 }).length === 0, 'a partial patch (one field) is valid');
  assert(
    issuesOf({
      layout: 'row',
      gap: 4,
      align: 'center',
      order: ['settings', 'deepseek-balance'],
      settingsLayout: 'column-reverse',
      settingsGap: 12,
      settingsAlign: 'stretch',
      settingsOrder: ['connection', 'settings'],
    }).length === 0,
    'a full valid section passes',
  );

  const badLayout = issuesOf({ layout: 'diagonal' });
  assert(badLayout.some((issue) => issue.path && issue.path[0] === 'layout'), 'invalid layout is rejected at "layout"');
  const badGap = issuesOf({ gap: -1 });
  assert(badGap.some((issue) => issue.path && issue.path[0] === 'gap'), 'negative gap is rejected at "gap"');
  const badOrder = issuesOf({ order: [1] });
  assert(badOrder.some((issue) => issue.path && issue.path[0] === 'order'), 'non-string order entry is rejected at "order"');
  const badSettings = issuesOf({ settingsLayout: 'circle' });
  assert(
    badSettings.some((issue) => issue.path && issue.path[0] === 'settingsLayout'),
    'invalid settingsLayout is rejected at "settingsLayout"',
  );

  // ── 5. apply needs no host service ────────────────────────────────────────
  console.log('5) apply without host services');
  let threw = null;
  try {
    plugin.apply({});
  } catch (err) {
    threw = err;
  }
  assert(threw === null, 'apply({}) does not touch any host service');

  // ── 6. mounts on a real cordis context ────────────────────────────────────
  console.log('6) real cordis mount');
  const ctx = new Context();
  const fiber = ctx.plugin(plugin.default, { layout: 'row', gap: 3 });
  await sleep(30);
  const runtime = ctx.registry.get(plugin.default);
  assert(ctx.registry.has(plugin.default), 'the entry activates with no services mounted');
  assert(fiber.state === 2, 'the fiber is active (the seam only serves active entries)');
  assert(runtime && runtime.Config === Config, 'the runtime carries Config (what the seam projects)');
  assert(unwrap(fiber.config.layout) === 'row', 'the patch config is applied over the defaults');
  assert(unwrap(fiber.config.gap) === 3, 'a numeric field keeps the configured value');
  assert(unwrap(fiber.config.settingsGap) === 8, 'an unset field keeps its schema default');

  console.log(failures === 0 ? '\nALL HOST TESTS PASSED' : `\n${failures} HOST TEST(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
