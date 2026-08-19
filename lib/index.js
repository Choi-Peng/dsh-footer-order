// AI 生成声明:本插件代码由 AI 生成,可能存在错误或安全隐患,使用前请 review 并实测。
// dsh-footer-order — Host half
// Exposes the plugin configuration (layout / gap / align / order) over HTTP
// and persists it into this plugin's row in the profile's cordis.patch.yml.
//
// Configuration is layered, and both layers apply live while dsh web runs:
//   1. Primary: UI edits from Settings → Plugins are persisted into the
//      profile's cordis.patch.yml, on this plugin's own row `config`
//      (identified by the row's `name`/`id`). dsh watches the patch layer
//      (watchUserPatches + cordis-plugin-hmr) and restarts this fiber with
//      the new config — no restart of dsh web. Only the row's `config`
//      mapping is spliced in place, so comments and `!!js` expressions
//      elsewhere in the file survive; a splice that fails validation falls
//      back to a full js-yaml round-trip of the patch list (same dialect the
//      loader itself uses: entryListSchema).
//   2. Default seeding: on startup, when this plugin's row is absent from the
//      profile's cordis.patch.yml, the plugin writes a fresh default row
//      (id + name + DEFAULT_SETTINGS) into that file so the Settings card has
//      a stable place to read from and write back to.
//
// Settings → Plugins visibility: the DSH Settings page discovers plugin cards
// by intersecting served settings namespaces (from `settings.describe`) with
// cards registered into the `settings.plugin.item` slot.  To appear in that
// list the Host must register a cordis settings namespace.  We do so via
// `installSettingsSection` with the same namespace our client card uses as its
// `key` (`footer-order`), so the Settings page dispatches our card.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include';
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings';
import z from '@deepseek-ai/schemastery';

/** The profile patch filename this plugin persists settings into. */
const PROFILE_PATCH_FILENAME = 'cordis.patch.yml';

/** Defaults: vertical stack, no gap, stretch alignment, no explicit order. */
export const DEFAULT_SETTINGS = {
  layout: 'column', // column | row | contents
  gap: 0, // px
  align: 'stretch', // stretch | start | center | end
  order: [], // string[] of sidebar.footer.action entry ids, top to bottom
};

const SCALAR_FIELDS = ['layout', 'gap', 'align'];
const ORDER_FIELD = 'order';
const SETTINGS_FIELDS = [...SCALAR_FIELDS, ORDER_FIELD];

const LAYOUT_VALUES = new Set(['column', 'row', 'contents']);
const ALIGN_VALUES = new Set(['stretch', 'start', 'center', 'end']);

/** Apply one validated field onto `out`; invalid values are ignored. */
function normalizeField(out, field, value) {
  if (field === 'layout') {
    if (LAYOUT_VALUES.has(value)) out.layout = value;
  } else if (field === 'gap') {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) out.gap = value;
  } else if (field === 'align') {
    if (ALIGN_VALUES.has(value)) out.align = value;
  } else if (field === ORDER_FIELD) {
    if (Array.isArray(value)) {
      const seen = new Set();
      const clean = [];
      for (const id of value) {
        if (typeof id !== 'string' || id.length === 0 || seen.has(id)) continue;
        seen.add(id);
        clean.push(id);
      }
      out.order = clean;
    }
  }
}

/** Merge the loader-provided config over the defaults, per field. */
function resolveSettings(config) {
  const out = { ...DEFAULT_SETTINGS, order: [...DEFAULT_SETTINGS.order] };
  if (config && typeof config === 'object') {
    for (const field of SETTINGS_FIELDS) normalizeField(out, field, config[field]);
  }
  return out;
}

/**
 * Re-read this plugin's row `config:` live from the profile's cordis.patch.yml
 * on every call, so settings apply immediately even when cordis-plugin-hmr
 * does not restart this fiber. Returns the parsed row config, or null when the
 * row/file is absent or unreadable (caller falls back to the loader config).
 */
function readLiveRowConfig(ctx) {
  const file = resolvePatchFile(ctx);
  if (!file) return null;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  try {
    const data = yaml.load(text, { schema: entryListSchema });
    if (!Array.isArray(data)) return null;
    const entry = ctx && ctx.fiber && ctx.fiber.entry ? ctx.fiber.entry.options : undefined;
    const rowName = entry && entry.name;
    const rowId = entry && entry.id;
    const found = findRow(data, rowName, rowId);
    return found ? found.entry.config : null;
  } catch {
    return null;
  }
}

/**
 * Effective settings = the live patch-file row config (re-read each call),
 * falling back to the loader-provided config when the file is unavailable.
 */
function liveEffectiveSettings(ctx, config) {
  const live = readLiveRowConfig(ctx);
  if (live && typeof live === 'object') return resolveSettings(live);
  return resolveSettings(config);
}

/** Whether the loader-provided config carries an explicit setting. */
function rowConfigSet(config) {
  return !!config && typeof config === 'object' && SETTINGS_FIELDS.some((field) => config[field] !== undefined);
}

/**
 * Locate this plugin's row inside a parsed patch list. A row is either an
 * entry of an `insert:` list or a bare id-targeted patch option; both are
 * matched by the row's `name` (package name) first, then by `id`.
 */
function findRow(data, rowName, rowId) {
  for (const patch of data) {
    if (!patch || typeof patch !== 'object') continue;
    const candidates = Array.isArray(patch.insert) ? patch.insert : [patch];
    for (const entry of candidates) {
      if (!entry || typeof entry !== 'object') continue;
      if ((rowName && entry.name === rowName) || (rowId && entry.id === rowId)) return { entry };
    }
  }
  return null;
}

/**
 * The profile cordis.patch.yml backing this plugin's row. The loader mounts
 * this plugin's row inside the root include (the profile's cordis.yml), which
 * sits in the profile directory; that directory — from the include's file
 * path or the inherited `ctx.baseUrl` — locates the patch file. When the row
 * is genuinely mounted from a `cordis.patch.yml` include itself, that exact
 * path wins.
 */
function resolvePatchFile(ctx) {
  const entry = ctx && ctx.fiber && ctx.fiber.entry;
  const include = entry && entry.parent && entry.parent.tree;
  if (include && typeof include.filename === 'string' && include.filename.length > 0) {
    if (basename(include.filename) === PROFILE_PATCH_FILENAME) return include.filename;
    return join(dirname(include.filename), PROFILE_PATCH_FILENAME);
  }
  if (ctx && typeof ctx.baseUrl === 'string' && ctx.baseUrl.length > 0) {
    const base = ctx.baseUrl.startsWith('file:') ? fileURLToPath(ctx.baseUrl) : ctx.baseUrl;
    return join(base, PROFILE_PATCH_FILENAME);
  }
  return undefined;
}

/** Leading whitespace width of a YAML line (spaces). */
function leadingSpaces(line) {
  let i = 0;
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i += 1;
  return i;
}

/** Match a `name:` line whose scalar value equals `rowName`. */
function matchRowName(line, rowName) {
  const match = /^\s*name:\s*(['"]?)([^'"]*?)\1\s*(?:#.*)?$/.exec(line);
  return !!match && match[2] === rowName;
}

/** Match an `id:` line whose scalar value equals `rowId`. */
function matchRowId(line, rowId) {
  const match = /^\s*id:\s*(['"]?)([^'"]*?)\1\s*(?:#.*)?$/.exec(line);
  return !!match && match[2] === rowId;
}

/** Render a scalar in the safe YAML subset this plugin's settings use. */
function formatScalar(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') {
    if (/^[A-Za-z0-9._/@-]+$/.test(value)) return value;
    return `'${value.replace(/'/g, "''")}'`;
  }
  return String(value);
}

/** The `config:` block text for one row. */
function buildConfigBlock(keyIndent, config, eol) {
  const pad = ' '.repeat(keyIndent);
  const sub = ' '.repeat(keyIndent + 2);
  const subSub = ' '.repeat(keyIndent + 4);
  const lines = [`${pad}config:`];
  for (const field of SCALAR_FIELDS) lines.push(`${sub}${field}: ${formatScalar(config[field])}`);
  const order = Array.isArray(config.order) ? config.order : [];
  if (order.length === 0) {
    lines.push(`${sub}order: []`);
  } else {
    lines.push(`${sub}order:`);
    for (const id of order) lines.push(`${subSub}- ${formatScalar(id)}`);
  }
  return lines.join(eol);
}

/**
 * Splice this plugin's `config:` mapping in the raw patch file text, leaving
 * every other byte untouched (comments, `!!js` expressions, other rows).
 * Returns the new text, or undefined when the row text is unrecognizable
 * (caller falls back to a full round-trip dump).
 */
function spliceConfigBlock(text, rowName, rowId, nextConfig) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  // Trailing empty elements only represent the file's final newline(s); drop
  // them so boundary math works on real content, then restore the newline.
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const trailingEol = text.endsWith(eol) ? eol : '';
  let nameIdx = -1;
  if (rowName) nameIdx = lines.findIndex((line) => matchRowName(line, rowName));
  if (nameIdx < 0 && rowId) nameIdx = lines.findIndex((line) => matchRowId(line, rowId));
  if (nameIdx < 0) return undefined;

  const keyIndent = leadingSpaces(lines[nameIdx]);

  // Scan below the name/id line: nested content belongs to the row; a key at
  // the same indent is our `config:` (or an unexpected sibling key); a dedent
  // ends the row block.
  let configIdx = -1;
  let boundary = lines.length;
  for (let i = nameIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const indent = leadingSpaces(line);
    if (indent > keyIndent) continue;
    if (indent === keyIndent) {
      if (line.trim().startsWith('config:')) {
        configIdx = i;
        break;
      }
      return undefined; // unexpected sibling key — do not guess
    }
    boundary = i;
    break;
  }

  const block = nextConfig == null ? null : buildConfigBlock(keyIndent, nextConfig, eol);
  if (configIdx >= 0) {
    let end = configIdx + 1;
    while (end < lines.length) {
      const line = lines[end];
      if (line.trim() === '') {
        // A blank line belongs to the config block only when the next
        // non-blank line is still deeper; otherwise it separates rows and
        // must survive the replacement.
        let look = end + 1;
        while (look < lines.length && lines[look].trim() === '') look += 1;
        if (look >= lines.length || leadingSpaces(lines[look]) <= keyIndent) break;
        end += 1;
        continue;
      }
      if (leadingSpaces(line) > keyIndent) {
        end += 1;
        continue;
      }
      break;
    }
    if (block === null) lines.splice(configIdx, end - configIdx);
    else lines.splice(configIdx, end - configIdx, ...block.split(eol));
  } else {
    if (block === null) return text; // nothing to remove — row has no config
    lines.splice(boundary, 0, ...block.split(eol));
  }
  return lines.join(eol) + trailingEol;
}

/** Strip undefined values; a missing config equals DEFAULT_SETTINGS. */
function normalizeForCompare(config) {
  if (config == null) return { ...DEFAULT_SETTINGS, order: [...DEFAULT_SETTINGS.order] };
  const out = {};
  for (const field of SETTINGS_FIELDS) {
    if (config[field] !== undefined) out[field] = config[field];
  }
  return out;
}

/** Deep equality for the settings objects this plugin manages (arrays included). */
function deepEqual(a, b) {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na === nb) return true;
  if (typeof na !== 'object' || typeof nb !== 'object' || na === null || nb === null) return false;
  const keysA = Object.keys(na);
  const keysB = Object.keys(nb);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!(key in nb)) return false;
    const va = na[key];
    const vb = nb[key];
    if (Array.isArray(va) || Array.isArray(vb)) {
      if (!Array.isArray(va) || !Array.isArray(vb) || va.length !== vb.length) return false;
      for (let i = 0; i < va.length; i += 1) if (va[i] !== vb[i]) return false;
    } else if (va !== vb) {
      return false;
    }
  }
  return true;
}

/** Atomically replace a file (write tmp, then rename). */
function atomicWriteFile(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, file);
}

/** Render a fresh default patch row for this plugin (id + name + config block). */
function buildDefaultRow(rowName, rowId, config) {
  const id = rowId || 'footer-order';
  const lines = [`- insert:`, `    - id: ${id}`];
  if (rowName) lines.push(`      name: '${rowName}'`);
  lines.push(`      config:`);
  for (const field of SCALAR_FIELDS) lines.push(`        ${field}: ${formatScalar(config[field])}`);
  const order = Array.isArray(config.order) ? config.order : [];
  if (order.length === 0) {
    lines.push(`        order: []`);
  } else {
    lines.push(`        order:`);
    for (const item of order) lines.push(`          - ${formatScalar(item)}`);
  }
  return lines.join('\n') + '\n';
}

/**
 * Persist `nextConfig` (or remove the row config when undefined) into the
 * profile's cordis.patch.yml. When the row does not yet exist there and
 * `allowInsert` is true, a fresh default row is appended instead.
 * @returns `{ written, rowFound, changed, mode }`.
 */
function updatePatchRow(ctx, nextConfig, allowInsert = false) {
  const file = resolvePatchFile(ctx);
  const entry = ctx && ctx.fiber && ctx.fiber.entry ? ctx.fiber.entry.options : undefined;
  const rowName = entry && entry.name;
  const rowId = entry && entry.id;
  if (!file || (!rowName && !rowId)) return { written: false, rowFound: false };

  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return { written: false, rowFound: false };
  }

  let data;
  try {
    data = yaml.load(text, { schema: entryListSchema });
  } catch (err) {
    throw new Error(`cannot parse ${file}: ${err && err.message ? err.message : err}`);
  }
  if (!Array.isArray(data)) throw new Error(`${file} is not a top-level array`);

  const found = findRow(data, rowName, rowId);
  if (!found) {
    if (!allowInsert) return { written: false, rowFound: false };
    const inserted = buildDefaultRow(rowName, rowId, nextConfig == null ? DEFAULT_SETTINGS : nextConfig);
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const joined = (text.endsWith(eol) ? text : text + eol) + inserted;
    atomicWriteFile(file, joined);
    return { written: true, rowFound: false, changed: true, mode: 'insert' };
  }
  if (deepEqual(found.entry.config, nextConfig == null ? undefined : nextConfig)) {
    return { written: true, rowFound: true, changed: false, mode: 'noop' };
  }

  // Apply the mutation to the parsed tree (used by the dump fallback).
  if (nextConfig == null) delete found.entry.config;
  else found.entry.config = { ...nextConfig, order: [...(Array.isArray(nextConfig.order) ? nextConfig.order : [])] };

  // Preferred: splice only the row's config block, preserving all other text.
  const spliced = spliceConfigBlock(text, rowName, rowId, nextConfig);
  if (spliced !== undefined) {
    try {
      const check = yaml.load(spliced, { schema: entryListSchema });
      const checkRow = Array.isArray(check) ? findRow(check, rowName, rowId) : null;
      const checkConfig = checkRow ? checkRow.entry.config : undefined;
      if (checkRow && deepEqual(checkConfig, nextConfig == null ? undefined : nextConfig)) {
        atomicWriteFile(file, spliced);
        return { written: true, rowFound: true, changed: true, mode: 'splice' };
      }
    } catch {
      // fall through to the dump fallback
    }
  }

  // Fallback: round-trip the whole patch list with the loader's own dialect.
  const dumped = yaml.dump(data, { schema: entryListSchema, lineWidth: -1, noRefs: true, sortKeys: false });
  atomicWriteFile(file, `${dumped}\n`);
  return { written: true, rowFound: true, changed: true, mode: 'dump' };
}

/** Names of provided fields whose value is invalid, for a 400 response. */
function validatePartial(partial) {
  const invalid = [];
  for (const field of SETTINGS_FIELDS) {
    if (partial[field] === undefined) continue;
    const probe = {};
    normalizeField(probe, field, partial[field]);
    if (probe[field] === undefined) invalid.push(field);
  }
  return invalid;
}

/** Read and parse a JSON request body (capped at 1 MiB). */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error('request body too large'));
        req.once('error', () => {});
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (text.trim() === '') return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/** Write a JSON response. */
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  const req = res.req;
  const origin = req && req.headers && req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(body);
}

/** Cordis plugin name. */
const name = 'footer-order';
/** Required services: the HTTP route registry. */
const inject = ['webServer'];

/**
 * Cordis settings namespace.  The DSH Settings → Plugins page discovers plugin
 * cards by intersecting served settings namespaces with cards registered into
 * `settings.plugin.item`.  Registering this namespace makes the Host report it
 * in `settings.describe`, allowing our client card (keyed `'footer-order'`) to
 * appear in the configurable-plugins tab.
 */
const FOOTER_ORDER_NS = settingsNamespace('footer-order');

/**
 * On startup, ensure this plugin has a row in the profile's cordis.patch.yml.
 * Runs best-effort; a missing/unwritable patch file is silently ignored.
 */
function ensureDefaultConfig(ctx) {
  try {
    updatePatchRow(ctx, DEFAULT_SETTINGS, true);
  } catch {
    // Ignore — fall back to built-in defaults; the row will be created on the
    // first successful save instead.
  }
}

function apply(ctx, config) {
  ensureDefaultConfig(ctx);

  // Register a cordis settings namespace so the DSH Settings → Plugins page
  // lists our card.  `installSettingsSection` internally guards on the
  // `settings` service; when it is absent (e.g. outside dsh web) the call is
  // a no-op.  The schema matches the fields our HTTP endpoint exposes; the
  // `setSource`/`onChange` hooks are intentionally lightweight because our
  // settings persistence is handled by the cordis.patch.yml splice layer
  // above — the cordis settings document is just a discovery signal here.
  const FOOTER_ORDER_SCHEMA = z.object({
    layout: z.enum(['column', 'row', 'contents']).default('column'),
    gap: z.number().step(1).min(0).default(0),
    align: z.enum(['stretch', 'start', 'center', 'end']).default('stretch'),
    order: z.array(z.string()).default([]),
  });
  installSettingsSection(ctx, FOOTER_ORDER_NS, FOOTER_ORDER_SCHEMA, config ?? DEFAULT_SETTINGS, {
    setSource: () => {},
    onChange: () => {},
  });

  const routes = [
    {
      kind: 'exact',
      path: '/footer-order/settings',
      handler: async (req, res) => {
        try {
          if (req.method === 'GET' || req.method === 'HEAD') {
            const effective = liveEffectiveSettings(ctx, config);
            const live = readLiveRowConfig(ctx);
            const hasOverrides = rowConfigSet(live) || rowConfigSet(config);
            sendJson(res, 200, { ...effective, hasOverrides });
            return;
          }
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'method-not-allowed' });
            return;
          }
          const body = await readJsonBody(req);
          if (body.reset === true) {
            const patch = updatePatchRow(ctx, undefined, true);
            const effective = patch.written ? resolveSettings(undefined) : liveEffectiveSettings(ctx, config);
            const hasOverrides = patch.written ? false : (rowConfigSet(readLiveRowConfig(ctx)) || rowConfigSet(config));
            sendJson(res, 200, { ...effective, hasOverrides });
            return;
          }
          const invalid = validatePartial(body);
          if (invalid.length > 0) {
            sendJson(res, 400, { error: 'invalid-field', fields: invalid });
            return;
          }
          // Full next effective settings: patch base overlaid with the fields
          // the client sent (the patch row config replaces the whole config).
          const base = liveEffectiveSettings(ctx, config);
          const next = { ...base, order: [...base.order] };
          for (const field of SETTINGS_FIELDS) {
            if (body[field] === undefined) continue;
            normalizeField(next, field, body[field]);
          }
          const patch = updatePatchRow(ctx, next, true);
          let effective;
          let hasOverrides;
          if (patch.written) {
            effective = resolveSettings(next);
            hasOverrides = true;
          } else {
            effective = resolveSettings(config);
            hasOverrides = rowConfigSet(config);
          }
          sendJson(res, 200, { ...effective, hasOverrides });
        } catch (err) {
          sendJson(res, 400, { error: String(err && err.message ? err.message : err) });
        }
      },
    },
  ];

  for (const route of routes) {
    ctx.effect(() => ctx.webServer.register(route), 'footer-order: route');
  }
}

export { apply, inject, name };
export default { apply, inject, name };
