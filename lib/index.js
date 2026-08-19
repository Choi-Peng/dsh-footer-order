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
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import z from '@deepseek-ai/schemastery';

/** Defaults: vertical stack, no gap, stretch alignment, no explicit order. */
export const DEFAULT_SETTINGS = {
  layout: 'column', // column | row | contents
  gap: 0, // px
  align: 'stretch', // stretch | start | center | end
  order: [], // string[] of sidebar.footer.action entry ids, top to bottom
};

/** The settings fields this plugin manages (the `order` field is an array). */
const SETTINGS_FIELDS = ['layout', 'gap', 'align', 'order'];

/**
 * Cordis settings namespace backing the /footer-order/settings proxy. The
 * DSH Settings → Plugins page discovers plugin cards by intersecting served
 * settings namespaces (from `settings.describe`) with cards registered into
 * the `settings.plugin.item` slot; registering this namespace makes the Host
 * report it, so our client card (keyed `'footer-order'`) appears in the
 * configurable-plugins tab.
 */
const FOOTER_ORDER_NS = settingsNamespace('footer-order');

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

/** Cordis plugin name. */
const name = 'footer-order';
/** Required services: the HTTP route registry. */
const inject = ['webServer'];

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
          if (err && err.code === 'SETTINGS_CONFLICT') {
            // The namespace moved since the client read it (stale revision).
            const descriptor = currentDescriptor(settings);
            sendJson(res, 409, {
              error: 'conflict',
              revision: descriptor ? descriptor.revision : undefined,
            });
            return;
          }
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
