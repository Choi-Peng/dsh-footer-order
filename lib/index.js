// AI 生成声明:本插件代码由 AI 生成,可能存在错误或安全隐患,使用前请 review 并实测。
// dsh-footer-order — Host half
// Exposes the plugin configuration (layout / gap / align / order) over HTTP
// and persists user edits through the official dsh settings seam
// (`ctx.settings`, provided by @deepseek-ai/dsh-settings):
//
//   - The deploy-time config — this plugin's row in the profile's
//     cordis.patch.yml, handed to `apply` as `config` — becomes the settings
//     namespace's `base` layer (static, deployment-owned).
//   - Runtime user edits from Settings → Plugins are persisted by the dsh
//     settings provider (e.g. dsh-settings-file → $DSH_HOME/settings.yaml)
//     into the `footer-order` namespace's user layer, layered above the base.
//   - `/footer-order/settings` is a thin proxy over that namespace: GET reads
//     the resolved value + revision + override flag; POST saves (update) or
//     resets (replace({})); a write with a stale `expectedRevision` is
//     refused with HTTP 409 carrying the latest revision.
//   - When no settings service exists (non-web host, no provider mounted),
//     the plugin keeps running off its `config` base — the client-side layout
//     feature is unaffected — and the settings route answers 503.
import z from '@deepseek-ai/schemastery';
import * as dshSettings from '@deepseek-ai/dsh-settings';

/** Defaults: vertical stack, no gap, stretch alignment, no explicit order. */
export const DEFAULT_SETTINGS = {
  layout: 'column', // column | row | contents
  gap: 0, // px
  align: 'stretch', // stretch | start | center | end
  // string[] of sidebar.footer.action entry ids, top to bottom. The id
  // `settings` is reserved for the shell's settings row (the sidebar.settings
  // slot rendered inside div.settingsArea): listed, it joins the order; a real
  // footer entry registered under that id takes precedence.
  order: [],
  // Arrangement within settingsArea (settings trigger, connection indicator, etc.):
  settingsLayout: 'contents', // row | column | row-reverse | column-reverse | contents
  settingsGap: 8, // px (matches shell triggerRow gap)
  settingsAlign: 'center', // center | stretch | start | end
  settingsOrder: [], // string[] of internal item ids: 'settings', 'connection', ...
};

/** The settings fields this plugin manages. */
const SETTINGS_FIELDS = [
  'layout',
  'gap',
  'align',
  'order',
  'settingsLayout',
  'settingsGap',
  'settingsAlign',
  'settingsOrder',
];

/**
 * Settings namespace served through `ctx.settings`. In dsh 0.1.1, the helper
 * `settingsNamespace` branded the string; in dsh 0.1.2 it was dropped in favor
 * of the bare lowercase-hyphenated namespace string directly.
 */
const FOOTER_ORDER_NS =
  typeof dshSettings.settingsNamespace === 'function'
    ? dshSettings.settingsNamespace('footer-order')
    : 'footer-order';

/**
 * Schema resolving the namespace: schema defaults → `base` (patch config) →
 * user layer. Schemastery (unlike zod) has no `z.enum` — the union of
 * literal strings is the shorthand for `z.const(...)`.
 */
const FOOTER_ORDER_SCHEMA = z.object({
  layout: z.union(['column', 'row', 'contents']).default('column'),
  gap: z.number().step(1).min(0).default(0),
  align: z.union(['stretch', 'start', 'center', 'end']).default('stretch'),
  order: z.array(z.string()).default([]),
  settingsLayout: z.union(['row', 'column', 'row-reverse', 'column-reverse', 'contents']).default('contents'),
  settingsGap: z.number().step(1).min(0).default(8),
  settingsAlign: z.union(['center', 'stretch', 'start', 'end']).default('center'),
  settingsOrder: z.array(z.string()).default([]),
});

/**
 * Settings fields a partial patch carries that the schema would reject, for
 * a precise 400 `invalid-field` response. The schema is the authority: the
 * same resolution the settings service runs before persisting (an invalid
 * write rejects anyway — this only produces the nicer error payload).
 */
function invalidFields(patch) {
  try {
    FOOTER_ORDER_SCHEMA(patch);
    return [];
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    const fields = new Set();
    const re = /\$\.([A-Za-z0-9_]+)/g;
    let match;
    while ((match = re.exec(message))) fields.add(match[1]);
    return [...fields];
  }
}

/** The `footer-order` descriptor from `settings.describe`, or null. */
function currentDescriptor(settings) {
  const descriptors = settings.describe({ redactSecrets: true });
  return descriptors.find((entry) => entry.ns === FOOTER_ORDER_NS) ?? null;
}

/**
 * The wire shape for the resolved namespace: the resolved value, the revision
 * the client must echo back on writes, and whether any user override exists
 * (what enables the Reset button). A `user` section present but empty — the
 * state right after a reset — counts as no overrides.
 */
function wirePayload(descriptor) {
  const user = descriptor.user;
  const hasOverrides = !!user && typeof user === 'object' && Object.keys(user).length > 0;
  return { ...descriptor.value, revision: descriptor.revision, hasOverrides };
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

/** Whether an error is the settings seam's optimistic-concurrency conflict. */
function isSettingsConflict(err) {
  return (
    (dshSettings.SettingsConflictError && err instanceof dshSettings.SettingsConflictError) ||
    (err && err.code === 'SETTINGS_CONFLICT')
  );
}

/** Cordis plugin name. */
const name = 'footer-order';

function apply(ctx, config) {
  // Settings seam wiring. `settings`/`scope` are held at this function scope
  // so the thin-proxy route handler below can call them; both stay undefined
  // until the settings service mounts (and remain undefined forever on hosts
  // without one — the routes then answer 503). Note: the settings service
  // must NOT be a top-level `inject` — that would hard-require it and break
  // non-web / provider-less hosts; the optional seam is what the plan calls
  // the "统一骨架" (installSettingsSection) pattern, minus the read-only hooks
  // we do not need: this plugin owns the namespace and needs its write scope.
  let settings;
  let scope;
  ctx.inject(['settings'], (sctx) => {
    settings = sctx.settings;
    scope = settings.register(FOOTER_ORDER_NS, FOOTER_ORDER_SCHEMA, {
      base: config ?? DEFAULT_SETTINGS,
    });
  });

  const routes = [
    {
      kind: 'exact',
      path: '/footer-order/settings',
      handler: async (req, res) => {
        // No settings service (or not mounted yet): the layout feature still
        // works client-side off its base config; the settings surface is 503.
        if (!settings || !scope) {
          sendJson(res, 503, { error: 'settings-unavailable' });
          return;
        }
        try {
          if (req.method === 'GET' || req.method === 'HEAD') {
            const descriptor = currentDescriptor(settings);
            if (!descriptor) {
              sendJson(res, 503, { error: 'settings-unavailable' });
              return;
            }
            sendJson(res, 200, wirePayload(descriptor));
            return;
          }
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'method-not-allowed' });
            return;
          }
          const body = await readJsonBody(req);
          const expectedRevision =
            typeof body.expectedRevision === 'number' ? body.expectedRevision : undefined;

          if (body.reset === true) {
            // Reset = drop the user layer entirely; the value falls back to
            // the schema defaults + `base` (the patch config).
            await settings.replace(FOOTER_ORDER_NS, {}, expectedRevision);
            sendJson(res, 200, wirePayload(currentDescriptor(settings)));
            return;
          }

          // Partial update over the user layer: only the provided fields.
          const patch = {};
          for (const field of SETTINGS_FIELDS) {
            if (body[field] !== undefined) patch[field] = body[field];
          }
          const invalid = invalidFields(patch);
          if (invalid.length > 0) {
            sendJson(res, 400, { error: 'invalid-field', fields: invalid });
            return;
          }
          await settings.update(FOOTER_ORDER_NS, patch, expectedRevision);
          sendJson(res, 200, wirePayload(currentDescriptor(settings)));
        } catch (err) {
          if (isSettingsConflict(err)) {
            // The namespace moved since the client read it (stale revision).
            const descriptor = currentDescriptor(settings);
            sendJson(res, 409, {
              error: 'conflict',
              revision: descriptor ? descriptor.revision : (err && err.actual),
            });
            return;
          }
          sendJson(res, 400, { error: String(err && err.message ? err.message : err) });
        }
      },
    },
  ];

  // The HTTP route registry is a soft probe, not a hard inject: the callback
  // rides a child fiber, so a composition without a web server (headless
  // profiles, profiles missing @deepseek-ai/dsh-web-app) activates this entry
  // cleanly and the routes simply never register. When the service appears —
  // including after a config-HMR restart — the registrations ride the child
  // fiber and unload with it.
  ctx.inject(['webServer'], (sctx) => {
    for (const route of routes) {
      sctx.effect(() => sctx.webServer.register(route), 'footer-order: route');
    }
  });
}

export { apply, name };
export default { apply, name };
