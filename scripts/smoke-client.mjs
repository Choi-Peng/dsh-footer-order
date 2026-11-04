// Client-half smoke test for dsh-footer-order (dsh 0.2 settings model).
//
// Loads the REAL lib/client.js bundle inside a minimal DOM/window/React stub and
// drives the real apply()/reconcile/schedule machinery end to end:
//   - vertical-stack CSS injected from the shared configForms snapshot,
//   - children paired to slot entries and reordered per config,
//   - a snapshot change (no poll) reorders,
//   - new entry registered re-pairs and reorders,
//   - NULL-rendering entries (like the shell's dormant cordis-panel) do not
//     block ordering,
//   - layout variants (row / contents),
//   - the shell's settings row (settingsArea / sidebar.settings) joining the
//     order under the reserved id `settings`, and going back to the foot area
//     when it is left out,
//   - the settings-area arrangement owning the WHOLE div.settingsArea: a block
//     another plugin appends there (dsh-restart's `.dsh-sidebar-row`) becomes an
//     item, ordered by inline `order` only — nodes are never moved, so a plugin
//     that re-appends its own row cannot fight this one,
//   - out-of-flow overlays (the settings panel) never become items,
//   - the two settings surfaces (`plugins.bundle.config`, `plugins.row.config`)
//     and the form's `form.mutate` save/reset operations.
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

// ── DOM stub ─────────────────────────────────────────────────────────────────
function makeStyle() {
  const style = {};
  style.setProperty = (name, value) => {
    style[name] = value;
  };
  return style;
}

/** Parse one simple selector: `tag`, `[attr]`, `[attr="v"]`, `[attr*="v"]`. */
function matchSimple(el, rawSel) {
  const sel = rawSel.trim();
  if (!sel) return false;
  const m = /^([a-zA-Z][a-zA-Z0-9]*)?((?:\[[^\]]+\])*)$/.exec(sel);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  const attrs = m[2] ? m[2].match(/\[[^\]]+\]/g) || [] : [];
  for (const raw of attrs) {
    const inner = raw.slice(1, -1);
    const eq = inner.indexOf('=');
    if (eq === -1) {
      if (!el.hasAttribute(inner)) return false;
      continue;
    }
    const namePart = inner.slice(0, eq);
    const star = namePart.endsWith('*');
    const name = star ? namePart.slice(0, -1) : namePart;
    const want = inner.slice(eq + 1).replace(/^["']|["']$/g, '');
    const actual = name === 'class' ? String(el.className || '') : String(el.getAttribute(name) ?? '');
    if (star ? actual.indexOf(want) === -1 : actual !== want) return false;
  }
  return true;
}

function matchList(el, sel) {
  return sel.split(',').some((part) => matchSimple(el, part));
}

function descendants(root, pred, out = []) {
  for (const child of root.children) {
    if (pred(child)) out.push(child);
    descendants(child, pred, out);
  }
  return out;
}

function queryIn(root, sel) {
  if (sel.indexOf(' > ') !== -1) {
    const [parentSel, childSel] = sel.split(' > ');
    const parent = queryIn(root, parentSel);
    if (!parent) return null;
    if (childSel === 'div:first-child') {
      const first = parent.children[0];
      return first && first.tagName === 'DIV' ? first : null;
    }
    return parent.children.find((child) => matchList(child, childSel)) || null;
  }
  const slotSel = /^div\[data-slot="(.+)"\]$/.exec(sel);
  if (slotSel) {
    const found = descendants(root, (el) => el.getAttribute('data-slot') === slotSel[1])[0];
    if (found) return found;
    return root.getAttribute('data-slot') === slotSel[1] ? root : null;
  }
  return descendants(root, (el) => matchList(el, sel))[0] || null;
}

function makeEl(tag = 'div', opts = {}) {
  const el = {
    tag,
    tagName: tag.toUpperCase(),
    children: [],
    style: makeStyle(),
    attrs: {},
    className: opts.className || '',
    id: opts.id || '',
    textContent: opts.text || '',
    parentNode: null,
    parentElement: null,
    datasetId: opts.datasetId,
    appendChild(child) {
      if (child.parentNode && child.parentNode !== this) child.parentNode.removeChild(child);
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
      this.children.push(child);
      child.parentNode = this;
      child.parentElement = this;
      return child;
    },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
      child.parentNode = null;
      child.parentElement = null;
      return child;
    },
    setAttribute(name, value) {
      this.attrs[name] = String(value);
      if (name === 'class') this.className = String(value);
      if (name === 'id') this.id = String(value);
    },
    getAttribute(name) {
      if (name === 'class') return this.className || null;
      if (name === 'id') return this.id || null;
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    removeAttribute(name) {
      delete this.attrs[name];
      if (name === 'class') this.className = '';
      if (name === 'id') this.id = '';
    },
    hasAttribute(name) {
      if (name === 'class') return !!this.className;
      if (name === 'id') return !!this.id;
      return Object.prototype.hasOwnProperty.call(this.attrs, name);
    },
    querySelector(sel) {
      return queryIn(this, sel);
    },
  };
  for (const [key, value] of Object.entries(opts.attrs || {})) el.setAttribute(key, value);
  return el;
}

// ── the 0.2 sidebar foot ─────────────────────────────────────────────────────
//   div.footArea > [div.footerActions > div[data-slot=sidebar.footer.action],
//                   div.settingsArea > [div[data-slot=sidebar.settings] >
//                                        [div.triggerRow >
//                                           [div[data-slot=settings.launcher] > button,
//                                            div.connectionIndicator],
//                                         div.settingsPanel (fixed overlay)],
//                                      div.dsh-sidebar-row > #dsh-restart-entry]]
//
// The last child is what @zhengjunyao/dsh-restart appends: an injected block
// living directly in settingsArea, beside the shell's settings outlet.
const footArea = makeEl('div');
const footerActions = makeEl('div');
const anchor = makeEl('div', { attrs: { 'data-slot': 'sidebar.footer.action' } });
const settingsArea = makeEl('div');
const settingsAnchor = makeEl('div', { attrs: { 'data-slot': 'sidebar.settings' } });
const triggerRow = makeEl('div', { className: 'VOzbGW_triggerRow' });
const launcherAnchor = makeEl('div', { attrs: { 'data-slot': 'settings.launcher' } });
const triggerButton = makeEl('button', { attrs: { 'aria-haspopup': 'dialog' } });
const connectionIndicator = makeEl('div', { className: 'xBb_connectionIndicator' });
const settingsPanel = makeEl('div', { className: 'VOzbGW_panel' });
settingsPanel.style.position = 'fixed'; // the shell's modal overlay, out of flow
footerActions.appendChild(anchor);
footArea.appendChild(footerActions);
footArea.appendChild(settingsArea);
settingsArea.appendChild(settingsAnchor);
settingsAnchor.appendChild(triggerRow);
settingsAnchor.appendChild(settingsPanel);
triggerRow.appendChild(launcherAnchor);
triggerRow.appendChild(connectionIndicator);
launcherAnchor.appendChild(triggerButton);

// The block dsh-restart injects into the area: keyed by its `data-plugin`, and
// holding its own inline `order` on the entry inside (never to be touched).
const restartRow = makeEl('div', { className: 'dsh-sidebar-row' });
restartRow.setAttribute('data-plugin', 'dsh-sidebar-row');
const restartEntry = makeEl('div', { id: 'dsh-restart-entry', className: 'dshrst-inline' });
restartEntry.style.order = '40';
restartRow.appendChild(restartEntry);
settingsArea.appendChild(restartRow);

const head = makeEl('div');
const documentEl = makeEl('div');
const documentStub = {
  head,
  documentElement: documentEl,
  createElement: (tag) => makeEl(tag),
  querySelector: (sel) => queryIn(footArea, sel),
};

let observerCallback = null;
globalThis.MutationObserver = class {
  constructor(callback) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
};

const windowStub = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id),
  setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
  clearInterval: (id) => globalThis.clearInterval(id),
};
globalThis.window = windowStub;
globalThis.document = documentStub;

// ── React stub ───────────────────────────────────────────────────────────────
// Just enough of the hook model to render the settings form once and click it.
let currentStore = null;
const stores = new Map();
let stateDirty = false;

function storeFor(type) {
  let store = stores.get(type);
  if (!store) {
    store = { slots: [], cursor: 0, pending: [] };
    stores.set(type, store);
  }
  return store;
}

const reactStub = {
  createElement(type, props, ...children) {
    const merged = Object.assign({}, props);
    if (children.length === 1) merged.children = children[0];
    else if (children.length > 1) merged.children = children;
    return { type, props: merged };
  },
  useState(init) {
    const store = currentStore;
    const index = store.cursor;
    store.cursor += 1;
    if (!(index in store.slots)) {
      store.slots[index] = { value: typeof init === 'function' ? init() : init };
    }
    const slot = store.slots[index];
    return [
      slot.value,
      (next) => {
        const value = typeof next === 'function' ? next(slot.value) : next;
        if (value !== slot.value) {
          slot.value = value;
          stateDirty = true;
        }
      },
    ];
  },
  useEffect(fn, deps) {
    const store = currentStore;
    const index = store.cursor;
    store.cursor += 1;
    const key = deps === undefined ? null : JSON.stringify(deps);
    const previous = store.slots[index];
    if (!previous || previous.key !== key) {
      store.slots[index] = { key, fn };
      store.pending.push(fn);
    }
  },
  useRef(init) {
    const store = currentStore;
    const index = store.cursor;
    store.cursor += 1;
    if (!(index in store.slots)) store.slots[index] = { current: init };
    return store.slots[index];
  },
};

function expand(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (Array.isArray(node)) return node.map(expand);
  if (typeof node !== 'object') return node;

  if (typeof node.type === 'function') {
    const store = storeFor(node.type);
    store.cursor = 0;
    store.pending = [];
    const saved = currentStore;
    currentStore = store;
    const output = node.type(node.props || {});
    currentStore = saved;
    // Effects run after the component's own render, like React's commit phase.
    for (const fn of store.pending) {
      const disposer = fn();
      if (typeof disposer === 'function') store.slots.push(disposer);
    }
    return expand(output);
  }

  const props = Object.assign({}, node.props);
  if (props.children !== undefined) props.children = expand(props.children);
  return { type: node.type, props };
}

function render(vnode) {
  for (let pass = 0; pass < 8; pass += 1) {
    stateDirty = false;
    for (const store of stores.values()) store.cursor = 0;
    const tree = expand(vnode);
    if (!stateDirty) return tree;
  }
  throw new Error('render did not settle');
}

function textOf(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (!node.props) return '';
  return textOf(node.props.children);
}

function findAll(node, pred, out = []) {
  if (node === null || node === undefined) return out;
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, pred, out);
    return out;
  }
  if (typeof node !== 'object') return out;
  if (pred(node)) out.push(node);
  findAll(node.props && node.props.children, pred, out);
  return out;
}

// ── load the real bundle ─────────────────────────────────────────────────────
let capturedFactory = null;
windowStub.__ModuleLoader__ = { load: (spec) => { capturedFactory = spec.factory; } };
const clientSrc = readFileSync(join(root, 'lib/client.js'), 'utf8');
(0, eval)(clientSrc);
if (!capturedFactory) {
  console.error('FAIL - bundle factory not captured');
  process.exit(1);
}

const pluginExports = capturedFactory((name) => {
  if (name === 'react') return reactStub;
  throw new Error('unexpected require: ' + name);
});

// ── ctx stubs ────────────────────────────────────────────────────────────────
const entries = [
  { options: { id: 'deepseek-balance', order: -1 } },
  { options: { id: 'cordis-panel', order: 0 } }, // renders nothing (null)
  { options: { id: 'restart-dsh', order: 10, label: () => 'restart DSH' } },
];

const registrations = [];
const slotListeners = [];
const slotsStub = {
  entriesOfSlot: () => entries,
  subscribe: (key, fn) => {
    slotListeners.push(fn);
    return () => {};
  },
  inject: (name, callback) => {
    callback();
    return () => {};
  },
  register: (options, component) => {
    registrations.push({ options, component });
    return () => {};
  },
};

const mutateCalls = [];
let mutateResult = true;
const formListeners = new Set();
let snapshot = {
  status: 'ready',
  value: { layout: 'column', gap: 0, align: 'stretch', order: ['cordis-panel', 'restart-dsh', 'deepseek-balance'] },
  base: {},
  user: {},
  revision: 3,
  writable: true,
};
const formStub = {
  getSnapshot: () => snapshot,
  subscribe: (fn) => {
    formListeners.add(fn);
    return () => formListeners.delete(fn);
  },
  mutate: (ops) => {
    mutateCalls.push(ops);
    return Promise.resolve(mutateResult);
  },
};

function setSnapshot(next) {
  snapshot = next;
  for (const fn of Array.from(formListeners)) fn();
}

const t = (key) => {
  const en = {
    cardTitle: 'Sidebar Footer Order',
    cardDescription: 'desc',
    summary: 'summary',
    layoutLabel: 'Layout',
    layoutColumn: 'Column',
    layoutRow: 'Row',
    layoutContents: 'Contents',
    alignLabel: 'Alignment',
    alignStretch: 'Stretch',
    alignStart: 'Start',
    alignCenter: 'Center',
    alignEnd: 'End',
    gapLabel: 'Gap',
    orderLabel: 'Order',
    orderEmpty: 'empty',
    orderHint: 'hint',
    settingsRow: 'Settings row',
    settingsAreaGroup: 'Settings Area',
    settingsAreaGroupHint: 'hint',
    settingsLayoutLabel: 'Settings layout',
    settingsLayoutRow: 'Row',
    settingsLayoutColumn: 'Column',
    settingsLayoutRowReverse: 'Row reverse',
    settingsLayoutColumnReverse: 'Column reverse',
    settingsLayoutContents: 'Contents',
    settingsLayoutHint: 'hint',
    settingsGapLabel: 'Settings gap',
    settingsAlignLabel: 'Settings alignment',
    settingsAlignCenter: 'Center',
    settingsAlignStretch: 'Stretch',
    settingsAlignStart: 'Start',
    settingsAlignEnd: 'End',
    settingsOrderLabel: 'Settings order',
    settingsOrderHint: 'hint',
    settingsItemRow: 'Settings row',
    moveUp: 'Move up',
    moveDown: 'Move down',
    saveLabel: 'Save',
    resetLabel: 'Reset',
    savingStatus: 'Saving…',
    savedStatus: 'Saved',
    invalidFields: 'Invalid',
    saveFailed: 'Refused',
    loadingStatus: 'Loading',
    unavailableStatus: 'Unavailable',
    readOnlyStatus: 'Read-only',
    configSource: 'stored in the profile patch',
    unknownEntry: '(not registered)',
  };
  return Object.prototype.hasOwnProperty.call(en, key) ? en[key] : key;
};

const ctx = {
  slots: slotsStub,
  locale: { register: () => () => {}, bind: () => (key) => t(key) },
  configForms: {
    get: () => formStub,
    describe: () => ({ load: () => {} }),
  },
  effect: (fn) => {
    const disposer = fn();
    return typeof disposer === 'function' ? disposer : () => {};
  },
};
pluginExports.apply(ctx);

// ── helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));
const flush = async () => {
  await sleep(0);
  await sleep(0);
};
const triggerObserver = async () => {
  observerCallback();
  await sleep(140); // > REORDER_DEBOUNCE_MS(80)
};
const changeConfig = async (value) => {
  setSnapshot(Object.assign({}, snapshot, { value, revision: (snapshot.revision || 0) + 1 }));
  await sleep(140);
};
const ids = () => anchor.children.map((el) => el.datasetId);
const el = (id) => anchor.children.find((child) => child.datasetId === id);
const styleText = () => head.children.find((node) => node.id === 'dsh-footer-order-style').textContent;

// ── tests ────────────────────────────────────────────────────────────────────
async function main() {
  // Real-case DOM: restart-dsh renders a labelled button, deepseek-balance a
  // readout div; cordis-panel renders NOTHING (dormant shell entry).
  const restartEl = makeEl('div', { text: 'restart DSH', datasetId: 'restart-dsh' });
  const balanceEl = makeEl('div', { text: 'Balance: 12.34 CNY', datasetId: 'deepseek-balance' });
  anchor.appendChild(balanceEl);
  anchor.appendChild(restartEl);

  console.log('1) CSS injection from the settings snapshot');
  assert(styleText().includes('display:flex !important'), 'anchor forced to flex');
  assert(styleText().includes('flex-direction:column !important'), 'flex direction column');
  assert(styleText().includes('align-items:stretch !important'), 'align stretch');
  assert(styleText().includes('div[data-slot="sidebar.footer.action"]'), 'targets the slot anchor');

  console.log('2) null-rendering entry (cordis-panel) tolerated');
  await triggerObserver();
  assert(
    JSON.stringify(ids()) === '["restart-dsh","deepseek-balance"]',
    'reordered with a null entry present (label-matched)',
  );
  assert(settingsArea.getAttribute('data-dfo-settings-area') === '1', 'the area is marked even while the default leaves it alone');
  assert(!styleText().includes('data-dfo-settings-area'), 'default `contents` emits no settings-area rules');

  console.log('3) snapshot change reorders (no fetch/poll)');
  await changeConfig({ layout: 'column', gap: 0, align: 'stretch', order: ['deepseek-balance', 'restart-dsh'] });
  assert(JSON.stringify(ids()) === '["deepseek-balance","restart-dsh"]', 'snapshot order applied');

  console.log('4) label-free heuristic (a, b-null, c)');
  entries.length = 0;
  entries.push({ options: { id: 'a', order: 0 } }, { options: { id: 'b', order: 1 } }, { options: { id: 'c', order: 2 } });
  anchor.children.length = 0;
  const aEl = makeEl('div', { datasetId: 'a' });
  const cEl = makeEl('div', { datasetId: 'c' });
  anchor.appendChild(aEl);
  anchor.appendChild(cEl);
  await changeConfig({ layout: 'column', gap: 0, align: 'stretch', order: ['c', 'a'] });
  assert(JSON.stringify(ids()) === '["c","a"]', 'config [c,a] reorders a null-free pair correctly');

  console.log('5) registration change + React undo resistance');
  entries.push({ options: { id: 'd', order: 3 } });
  const dEl = makeEl('div', { datasetId: 'd' });
  anchor.appendChild(dEl);
  await triggerObserver();
  assert(JSON.stringify(ids()) === '["c","a","d"]', 'new entry d appended after listed entries');
  for (const id of ['a', 'c', 'd']) anchor.appendChild(el(id));
  await triggerObserver();
  assert(JSON.stringify(ids()) === '["c","a","d"]', 'React restoring registration order is re-corrected');

  console.log('6) layout variants');
  await changeConfig({ layout: 'row', gap: 0, align: 'stretch', order: [] });
  assert(styleText().includes('flex-direction:row !important'), 'row layout CSS');
  await changeConfig({ layout: 'contents', gap: 0, align: 'stretch', order: [] });
  assert(styleText().includes('display:contents !important'), 'contents layout CSS');
  assert(!styleText().includes('flex-direction'), 'no flex-direction when contents');

  console.log('7) settings row joins the order under the reserved id');
  entries.length = 0;
  entries.push({ options: { id: 'a', order: 0 } }, { options: { id: 'c', order: 1 } });
  anchor.children.length = 0;
  const a2 = makeEl('div', { datasetId: 'a' });
  const c2 = makeEl('div', { datasetId: 'c' });
  settingsArea.datasetId = 'settings';
  anchor.appendChild(a2);
  anchor.appendChild(c2);
  await changeConfig({ layout: 'column', gap: 0, align: 'stretch', order: ['settings', 'c', 'a'] });
  assert(settingsArea.parentElement === anchor, 'settings block moved into the footer column when listed');
  assert(JSON.stringify(ids()) === '["settings","c","a"]', 'settings row on top');

  await changeConfig({ layout: 'column', gap: 0, align: 'stretch', order: ['c', 'settings', 'a'] });
  assert(JSON.stringify(ids()) === '["c","settings","a"]', 'settings row interleaved between entries');

  console.log('8) settings row left out of the order');
  await changeConfig({ layout: 'column', gap: 0, align: 'stretch', order: ['a', 'c'] });
  assert(settingsArea.parentElement === footArea, 'settings block restored to the foot area');
  assert(footArea.children[footArea.children.length - 1] === settingsArea, 'restored as the last block of the foot area');
  assert(JSON.stringify(ids()) === '["a","c"]', 'footer entries alone again');

  console.log('9) the arrangement owns the whole settingsArea, injected blocks included');
  await changeConfig({
    layout: 'column',
    gap: 4,
    align: 'stretch',
    order: [],
    settingsLayout: 'column',
    settingsGap: 10,
    settingsAlign: 'stretch',
    settingsOrder: ['plugin:dsh-sidebar-row', 'settings'],
  });
  const css = styleText();
  assert(css.includes('[data-dfo-settings-area="1"]{'), 'area targeted through its stable marker attribute');
  assert(!css.includes('div[data-slot="sidebar.settings"]'), 'the outlet anchor is no longer the arrangement target');
  assert(css.includes('flex-direction:column !important'), 'settingsArea column layout CSS');
  assert(css.includes('gap:10px !important'), 'settingsArea gap 10px CSS');
  // Every attribute selector must keep its value INSIDE the brackets: a rule
  // written as `[data-x]="v"` is not a match, it is invalid, and the browser
  // silently drops the whole rule — which is how the item sizing below was
  // lost once, leaving the 100%+4px settings row free to overflow the area.
  assert(!/\]\s*=/.test(css), 'no attribute value written outside the brackets (a dropped rule)');
  assert(
    css.includes('[data-dfo-settings-item="settings"]{flex:1 1 auto !important;width:auto !important;'),
    'settings row reset to fill the remaining line (no 100%+4px bleed, no side margins)',
  );
  assert(
    css.includes('[data-dfo-settings-item]:not([data-dfo-settings-item="settings"]){flex:0 1 auto !important;'),
    'injected blocks keep their size but may shrink and never exceed the area',
  );
  assert(css.includes('max-width:100% !important'), 'items are capped at the area width');
  assert(settingsArea.getAttribute('data-dfo-settings-area') === '1', 'marker set on div.settingsArea');
  assert(triggerRow.getAttribute('data-dfo-settings-item') === 'settings', 'settings row keyed `settings`');
  assert(
    restartRow.getAttribute('data-dfo-settings-item') === 'plugin:dsh-sidebar-row',
    'injected block keyed from its data-plugin',
  );
  assert(settingsPanel.getAttribute('data-dfo-settings-item') === null, 'fixed overlay never becomes an item');
  assert(restartRow.style.order === '0', 'injected block pinned first by inline order');
  assert(triggerRow.style.order === '1', 'settings row pinned second by inline order');
  assert(settingsArea.children[0] === settingsAnchor, 'no node moved: the outlet anchor keeps its DOM slot');
  assert(settingsArea.children[1] === restartRow, 'no node moved: the injected block keeps its DOM slot');
  assert(restartEntry.style.order === '40', "a foreign inline order inside the injected block is untouched");

  await changeConfig({
    layout: 'column',
    gap: 4,
    align: 'stretch',
    order: [],
    settingsLayout: 'row-reverse',
    settingsGap: 6,
    settingsAlign: 'center',
    settingsOrder: [],
  });
  const cssRev = styleText();
  assert(cssRev.includes('flex-direction:row-reverse !important'), 'settingsArea row-reverse CSS');
  assert(cssRev.includes('gap:6px !important'), 'settingsArea gap 6px CSS');
  assert(triggerRow.style.order === '', 'empty settingsOrder releases the settings-row pin');
  assert(restartRow.style.order === '', 'empty settingsOrder releases the injected-block pin');
  assert(restartEntry.style.order === '40', 'releasing pins leaves foreign inline orders alone');

  console.log('9b) the arrangement survives a sidebar with no footer entries');
  anchor.children.length = 0;
  entries.length = 0;
  await changeConfig({
    layout: 'column',
    gap: 4,
    align: 'stretch',
    order: [],
    settingsLayout: 'row',
    settingsGap: 8,
    settingsAlign: 'center',
    settingsOrder: ['settings', 'plugin:dsh-sidebar-row'],
  });
  assert(triggerRow.style.order === '0', 'settings row still pinned without footer entries');
  assert(restartRow.style.order === '1', 'injected block still pinned without footer entries');
  assert(styleText().includes('flex-direction:row !important'), 'area CSS still applied without footer entries');

  console.log('10) settings surfaces registered for dsh 0.2');
  const bundle = registrations.find((entry) => entry.options.name === 'plugins.bundle.config');
  const row = registrations.find((entry) => entry.options.name === 'plugins.row.config');
  assert(bundle && bundle.options.key === '@choi-p/dsh-footer-order', 'bundle section keyed by package name');
  assert(row && row.options.key === '@choi-p/dsh-footer-order#footer-order', 'row page keyed by <package>#<row id>');
  assert(!registrations.some((entry) => entry.options.name === 'settings.plugin.item'), 'the 0.1 slot is gone');

  console.log('11) form save writes one mutate batch');
  // The row page renders its summary for `view: 'summary'` and the form otherwise.
  assert(row.component({ view: 'summary', t }) === 'summary', 'row summary renders');
  let tree = render({ type: row.component, props: { view: 'page', t } });
  assert(
    findAll(tree, (node) => node.type === 'button').some((node) => textOf(node) === 'Save'),
    'save button rendered',
  );
  assert(
    findAll(tree, (node) => node.type === 'button').some((node) => textOf(node) === 'Reset'),
    'reset button rendered',
  );

  let gapInput = findAll(tree, (node) => node.type === 'input' && node.props.id === 'dfo-gap')[0];
  assert(!!gapInput, 'gap input rendered');
  gapInput.props.onChange({ target: { value: '12' } });

  // Re-render after the edit: the save button's closure must see the new value.
  tree = render({ type: row.component, props: { view: 'page', t } });
  let saveButton = findAll(tree, (node) => node.type === 'button' && textOf(node) === 'Save')[0];
  let resetButton = findAll(tree, (node) => node.type === 'button' && textOf(node) === 'Reset')[0];

  mutateCalls.length = 0;
  saveButton.props.onClick();
  await flush();
  const saveOps = mutateCalls[0] || [];
  assert(saveOps.length === 8, 'save queues one batch of eight field writes');
  assert(saveOps.every((op) => op.op === 'set'), 'save uses set operations');
  const byPath = {};
  for (const op of saveOps) byPath[op.path.join('.')] = op.value;
  assert(byPath.gap === 12, 'gap edit is written');
  assert(byPath.layout === 'column', 'layout is written');
  assert(Array.isArray(byPath.order) && byPath.order.indexOf('settings') !== -1, 'order list (with the reserved settings id) is written');
  assert(
    JSON.stringify(byPath.settingsOrder) === '["settings","plugin:dsh-sidebar-row"]',
    'settingsOrder lists the area blocks (settings row + the injected block)',
  );

  console.log('12) form reset clears every field');
  mutateCalls.length = 0;
  resetButton.props.onClick();
  await flush();
  const resetOps = mutateCalls[0] || [];
  assert(resetOps.length === 8, 'reset queues one batch of eight clears');
  assert(resetOps.every((op) => op.op === 'unset'), 'reset uses unset operations');

  console.log('13) a refused write surfaces an error instead of a false success');
  mutateResult = false;
  mutateCalls.length = 0;
  tree = render({ type: row.component, props: { view: 'page', t } });
  saveButton = findAll(tree, (node) => node.type === 'button' && textOf(node) === 'Save')[0];
  saveButton.props.onClick();
  await flush();
  const afterRefusal = render({ type: row.component, props: { view: 'page', t } });
  assert(
    findAll(afterRefusal, (node) => node.type === 'p' && textOf(node) === 'Refused').length > 0,
    'refusal message rendered',
  );
  mutateResult = true;

  console.log(failures === 0 ? '\nALL CLIENT TESTS PASSED' : `\n${failures} CLIENT TEST(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
