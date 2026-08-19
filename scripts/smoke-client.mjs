// Client-half smoke test for dsh-footer-order.
// Loads the REAL lib/client.js bundle inside a minimal DOM/window stub and
// drives the real apply()/reconcile/schedule machinery end to end:
//   - vertical-stack CSS injected,
//   - children paired to slot entries and reordered per config,
//   - config change (poll tick) reorders,
//   - new entry registered re-pairs and reorders,
//   - React restoring registration order is re-corrected,
//   - NULL-rendering entries (like the shell's dormant cordis-panel) no
//     longer block ordering: label-text matching + config-order heuristic,
//   - layout variants (row / contents).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ok - ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${msg}`);
  }
}

function makeEl(text = '') {
  return {
    children: [],
    style: {},
    parentNode: null,
    textContent: text,
    appendChild(child) {
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
      child.parentNode = null;
      return child;
    },
  };
}

const anchor = makeEl();
const head = makeEl();
const docEl = makeEl();
const entries = [
  { options: { id: 'deepseek-balance', order: -1 } },
  { options: { id: 'cordis-panel', order: 0 } }, // renders nothing (null)
  { options: { id: 'restart-dsh', order: 10, label: () => '重启 DSH' } },
];

// Current effective config the mocked /footer-order/settings returns.
// Mirrors the v0.2.0 wire shape: resolved value + revision + hasOverrides.
let currentConfig = {
  layout: 'column',
  gap: 0,
  align: 'stretch',
  order: ['cordis-panel', 'restart-dsh', 'deepseek-balance'],
  revision: 3,
  hasOverrides: true,
};

let observerCallback = null;
const intervalCallbacks = [];
const documentStub = {
  head,
  documentElement: docEl,
  createElement: (tag) => {
    const el = makeEl();
    el.tag = tag;
    return el;
  },
  querySelector: (sel) => (sel === 'div[data-slot="sidebar.footer.action"]' ? anchor : null),
};

const windowStub = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id),
  setInterval: (fn, ms) => {
    intervalCallbacks.push({ fn, ms });
    return intervalCallbacks.length;
  },
  clearInterval: () => {},
  Event: class Event { constructor(type) { this.type = type; } },
};

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.MutationObserver = class {
  constructor(cb) { observerCallback = cb; }
  observe() {}
  disconnect() {}
};
globalThis.fetch = (url) =>
  Promise.resolve({ json: () => Promise.resolve(currentConfig) });

let capturedFactory = null;
windowStub.__ModuleLoader__ = { load: (spec) => { capturedFactory = spec.factory; } };

const clientSrc = readFileSync(join(root, 'lib/client.js'), 'utf8');
(0, eval)(clientSrc);
if (!capturedFactory) {
  console.error('FAIL - bundle factory not captured');
  process.exit(1);
}

const requireStub = (name) => {
  if (name === 'react') {
    return { useState: () => [], useEffect: () => {}, useRef: () => ({ current: null }), createElement: () => ({}) };
  }
  throw new Error('unexpected require: ' + name);
};

const reactJsx = {};
const pluginExports = capturedFactory((name) => (name === 'react/jsx-runtime' ? reactJsx : requireStub(name)));

const slotsStub = {
  entriesOfSlot: () => entries,
  subscribe: () => () => {},
  inject: () => () => {},
  register: () => {},
};
const ctx = {
  slots: slotsStub,
  locale: { register: () => {}, bind: () => () => 't' },
  effect: (fn) => {
    fn();
    return () => {};
  },
};
pluginExports.apply(ctx);

const sleep = (ms) => new Promise((r) => globalThis.setTimeout(r, ms));
const flush = async () => {
  await sleep(0);
  await sleep(0);
};
const triggerObserver = async () => {
  observerCallback();
  await sleep(140); // > REORDER_DEBOUNCE_MS(80)
};
const firePoll = async () => {
  for (const c of intervalCallbacks) c.fn();
  await flush();
  await sleep(140);
};
const ids = () => anchor.children.map((el) => el.datasetId);
const el = (id) => anchor.children.find((e) => e.datasetId === id);

async function main() {
  // Real-case DOM: restart-dsh renders a labelled button, deepseek-balance a
  // readout div; cordis-panel renders NOTHING (dormant shell entry).
  const restartEl = makeEl('重启 DSH');
  restartEl.datasetId = 'restart-dsh';
  const balanceEl = makeEl('账户余额: 12.34 CNY');
  balanceEl.datasetId = 'deepseek-balance';
  anchor.appendChild(balanceEl);
  anchor.appendChild(restartEl);

  // 1) CSS override present after apply.
  console.log('1) CSS injection');
  const styleText = () => head.children.find((el2) => el2.tag === 'style').textContent;
  assert(styleText().includes('display:flex !important'), 'anchor forced to flex');
  assert(styleText().includes('flex-direction:column !important'), 'flex direction column');
  assert(styleText().includes('align-items:stretch !important'), 'align stretch');
  assert(styleText().includes('div[data-slot="sidebar.footer.action"]'), 'targets the slot anchor');

  // 2) Null-rendering entry no longer blocks ordering.
  console.log('2) null entry (cordis-panel) tolerated');
  await flush();
  await sleep(140);
  await triggerObserver();
  // config order [cordis-panel, restart-dsh, deepseek-balance]; cordis-panel
  // renders nothing, so the visible order must be restart above balance.
  assert(JSON.stringify(ids()) === '["restart-dsh","deepseek-balance"]', 'reordered with a null entry present (label-matched)');

  // 3) The previously-failing live config: [restart-dsh, deepseek-balance].
  console.log('3) flip config [restart-dsh, deepseek-balance]');
  currentConfig = { layout: 'column', gap: 0, align: 'stretch', order: ['restart-dsh', 'deepseek-balance'], hasOverrides: true, revision: 4 };  // revision: config edits bump it
  await firePoll();
  assert(JSON.stringify(ids()) === '["restart-dsh","deepseek-balance"]', 'restart stays on top (already correct)');
  currentConfig = { layout: 'column', gap: 0, align: 'stretch', order: ['deepseek-balance', 'restart-dsh'], hasOverrides: true, revision: 4 };  // revision: config edits bump it
  await firePoll();
  assert(JSON.stringify(ids()) === '["deepseek-balance","restart-dsh"]', 'flipped back: balance on top');

  // 4) No-label entries: heuristic pairs children to ids skipping the null.
  console.log('4) label-free heuristic (a, b-null, c)');
  entries.length = 0;
  entries.push({ options: { id: 'a', order: 0 } }, { options: { id: 'b', order: 1 } }, { options: { id: 'c', order: 2 } });
  anchor.children.length = 0;
  for (const id of ['a', 'c']) {
    const e = makeEl();
    e.datasetId = id;
    anchor.appendChild(e);
  }
  currentConfig = { layout: 'column', gap: 0, align: 'stretch', order: ['c', 'a'], hasOverrides: true, revision: 4 };  // revision: config edits bump it
  await firePoll(); // sync state.config, then reconcile
  assert(JSON.stringify(ids()) === '["c","a"]', 'config [c,a] reorders null-free pair correctly');

  // 5) New registration + React undo resistance.
  console.log('5) registration change + React undo');
  entries.push({ options: { id: 'd', order: 3 } });
  const dEl = makeEl();
  dEl.datasetId = 'd';
  anchor.appendChild(dEl);
  await triggerObserver();
  assert(JSON.stringify(ids()) === '["c","a","d"]', 'new entry d appended after listed entries');
  for (const id of ['a', 'c', 'd']) anchor.appendChild(el(id));
  await triggerObserver();
  assert(JSON.stringify(ids()) === '["c","a","d"]', 'React restoring registration order is re-corrected');

  // 6) A node disappearing (entry renders null) does not corrupt pairing.
  console.log('6) transient null + return');
  anchor.children.splice(anchor.children.indexOf(dEl), 1);
  await triggerObserver();
  assert(JSON.stringify(ids()) === '["c","a"]', 'd node gone — remaining pair still ordered');
  anchor.appendChild(dEl);
  await triggerObserver();
  assert(JSON.stringify(ids()) === '["c","a","d"]', 'd node back — re-paired and ordered');

  // 7) layout variants.
  console.log('7) layout variants');
  currentConfig = { layout: 'row', gap: 0, align: 'stretch', order: [], hasOverrides: true, revision: 4 };  // revision: config edits bump it
  await firePoll();
  assert(styleText().includes('flex-direction:row !important'), 'row layout CSS');
  currentConfig = { layout: 'contents', gap: 0, align: 'stretch', order: [], hasOverrides: true, revision: 4 };  // revision: config edits bump it
  await firePoll();
  assert(styleText().includes('display:contents !important'), 'contents layout CSS');
  assert(!styleText().includes('flex-direction'), 'no flex-direction when contents');

  console.log(failures === 0 ? '\nALL CLIENT TESTS PASSED' : `\n${failures} CLIENT TEST(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
