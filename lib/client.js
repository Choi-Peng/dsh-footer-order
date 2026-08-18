// AI 生成声明:本插件代码由 AI 生成,可能存在错误或安全隐患,使用前请 review 并实测。
// dsh-footer-order — Client half
// Forces the sidebar footer action slot anchor (`div[data-slot=sidebar.footer.action]`,
// which the web-react renderer gives `display: contents`) into a vertical flex
// stack so multiple footer plugins no longer squeeze into one row, and
// reorders the rendered entries to match the configured top-to-bottom order
// (`order` in the plugin's cordis.patch.yml row, or the editable card in
// Settings → Plugins).
//
// Layout is applied with an injected stylesheet (`!important` overrides the
// inline `display: contents`). Ordering is applied on the DOM: each rendered
// entry is exactly one child of the anchor (the renderer emits one node per
// list entry), the plugin pairs children to entry ids from
// `ctx.slots.entriesOfSlot('sidebar.footer.action')` (render order) and
// re-orders them whenever config, registrations, or the DOM change.
window.__ModuleLoader__.load({
  id: '@choi-p/dsh-footer-order',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var react = require('react');

    /** Required client services. */
    var inject = ['slots', 'locale'];

    var en = {
      cardTitle: 'Sidebar Footer Order',
      cardDescription: 'Stacks sidebar footer actions vertically and controls their top-to-bottom order.',
      layoutLabel: 'Layout',
      layoutHint: 'column = vertical stack (fixes the squeezed row); row = horizontal; contents = leave as-is.',
      layoutColumn: 'Column (vertical stack)',
      layoutRow: 'Row (horizontal)',
      layoutContents: 'Contents (no override)',
      gapLabel: 'Gap between entries (px)',
      alignLabel: 'Alignment',
      alignStretch: 'Stretch (full width)',
      alignStart: 'Start (top)',
      alignCenter: 'Center',
      alignEnd: 'End (bottom)',
      orderLabel: 'Order (top to bottom)',
      orderHint: 'Entries not listed keep their default registration order and sit below the listed ones.',
      orderEmpty: 'No footer action plugins registered yet.',
      moveUp: 'Move up',
      moveDown: 'Move down',
      saveLabel: 'Save',
      resetLabel: 'Reset to defaults',
      savingStatus: 'Saving…',
      savedStatus: 'Saved — applies immediately.',
      invalidFields: 'Invalid value(s) for:',
      configSource: 'Settings are saved into this plugin row in the profile cordis.patch.yml and apply live via config HMR — no restart needed.',
      unknownEntry: '(not registered)',
    };
    var zh = {
      cardTitle: '侧边栏底部排序',
      cardDescription: '将侧边栏底部的 footer action 改为上下排列,并控制它们的先后顺序。',
      layoutLabel: '排列方式',
      layoutHint: 'column = 上下排列(修复挤成一行的问题);row = 左右排列;contents = 不干预(保持默认)。',
      layoutColumn: '上下排列(column)',
      layoutRow: '左右排列(row)',
      layoutContents: '不干预(contents)',
      gapLabel: '条目间距(px)',
      alignLabel: '对齐方式',
      alignStretch: '拉伸(占满宽度)',
      alignStart: '顶部对齐',
      alignCenter: '居中',
      alignEnd: '底部对齐',
      orderLabel: '上下顺序(自上而下)',
      orderHint: '未列出的条目保持默认注册顺序,排在已列出的条目之后。',
      orderEmpty: '还没有注册任何 footer action 插件。',
      moveUp: '上移',
      moveDown: '下移',
      saveLabel: '保存',
      resetLabel: '恢复默认',
      savingStatus: '保存中…',
      savedStatus: '已保存,立即生效。',
      invalidFields: '以下字段的值不合法:',
      configSource: '设置会保存回 profile 的 cordis.patch.yml 中本插件所在行,并通过配置 HMR 实时生效,无需重启。',
      unknownEntry: '(未注册)',
    };

    /** The sidebar footer action slot this plugin targets. */
    var SLOT_KEY = 'sidebar.footer.action';
    /** Settings endpoint on the host half. */
    var SETTINGS_URL = '/footer-order/settings';
    /** How often the client re-reads the effective config (covers external edits). */
    var POLL_MS = 10000;
    /** Debounce for DOM reordering (lets React commits settle). */
    var REORDER_DEBOUNCE_MS = 80;

    var DEFAULT_SETTINGS = { layout: 'column', gap: 0, align: 'stretch', order: [] };
    var LAYOUT_VALUES = ['column', 'row', 'contents'];
    var ALIGN_VALUES = ['stretch', 'start', 'center', 'end'];

    /** Pick a valid config object out of an arbitrary payload. */
    function normalizeConfig(data) {
      var out = {
        layout: DEFAULT_SETTINGS.layout,
        gap: DEFAULT_SETTINGS.gap,
        align: DEFAULT_SETTINGS.align,
        order: DEFAULT_SETTINGS.order.slice(),
      };
      if (!data || typeof data !== 'object') return out;
      if (LAYOUT_VALUES.indexOf(data.layout) !== -1) out.layout = data.layout;
      if (typeof data.gap === 'number' && Number.isFinite(data.gap) && data.gap >= 0) out.gap = data.gap;
      if (ALIGN_VALUES.indexOf(data.align) !== -1) out.align = data.align;
      if (Array.isArray(data.order)) {
        var seen = {};
        var clean = [];
        for (var i = 0; i < data.order.length; i += 1) {
          var id = data.order[i];
          if (typeof id !== 'string' || id.length === 0 || seen[id]) continue;
          seen[id] = true;
          clean.push(id);
        }
        out.order = clean;
      }
      return out;
    }

    function sameConfig(a, b) {
      if (a.layout !== b.layout || a.gap !== b.gap || a.align !== b.align) return false;
      if (a.order.length !== b.order.length) return false;
      for (var i = 0; i < a.order.length; i += 1) if (a.order[i] !== b.order[i]) return false;
      return true;
    }

    /** Map an align value to the CSS align-items keyword. */
    function alignKeyword(align) {
      if (align === 'start') return 'flex-start';
      if (align === 'end') return 'flex-end';
      if (align === 'center') return 'center';
      return 'stretch';
    }

    /**
     * Stylesheet text overriding the slot anchor. `!important` is required:
     * the renderer applies `display: contents` as an inline style, and inline
     * styles beat plain stylesheet rules.
     */
    function buildCss(cfg) {
      var layout = cfg.layout;
      if (layout !== 'row' && layout !== 'contents') layout = 'column';
      if (layout === 'contents') {
        return 'div[data-slot="sidebar.footer.action"]{display:contents !important;}';
      }
      var gap = typeof cfg.gap === 'number' && cfg.gap > 0 ? cfg.gap : 0;
      return (
        'div[data-slot="sidebar.footer.action"]{' +
        '--dsh-footer-order-gap:' + gap + 'px;' +
        'display:flex !important;' +
        'flex-direction:' + layout + ' !important;' +
        'align-items:' + alignKeyword(cfg.align) + ' !important;' +
        'width:100% !important;' +
        'gap:var(--dsh-footer-order-gap) !important;' +
        '}'
      );
    }

    function apply(ctx) {
      var slots = ctx.slots;

      // ── locale ──────────────────────────────────────────────────────────────
      ctx.effect(function () {
        return ctx.locale.register('footer-order', { en: en, zh: zh });
      }, 'footer-order: dictionaries');

      // ── shared state ────────────────────────────────────────────────────────
      var state = {
        config: normalizeConfig(DEFAULT_SETTINGS),
        // Rendered DOM element -> entry id (learned incrementally). A plain Map
        // (not WeakMap: the registry must be enumerable to prune stale ids).
        idByEl: new Map(),
        // Anchor element this pairing belongs to; a new anchor resets the map.
        anchorEl: null,
      };

      // ── injected stylesheet ─────────────────────────────────────────────────
      var styleEl = document.createElement('style');
      styleEl.id = 'dsh-footer-order-style';
      document.head.appendChild(styleEl);
      ctx.effect(function () {
        return function () {
          if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        };
      }, 'footer-order: style cleanup');

      function applyCss() {
        styleEl.textContent = buildCss(state.config);
      }
      applyCss();

      // ── ordering machinery ──────────────────────────────────────────────────
      function findAnchor() {
        return document.querySelector('div[data-slot="' + SLOT_KEY + '"]');
      }

      /** Entry ids in render order (what the outlet renders), via the registry. */
      function sortedEntryIds() {
        try {
          var entries = slots.entriesOfSlot(SLOT_KEY);
          return entries
            .slice()
            .sort(function (a, b) {
              return (a.options.order || 0) - (b.options.order || 0);
            })
            .map(function (e) { return e.options.id; })
            .filter(Boolean);
        } catch (err) {
          return [];
        }
      }

      /** Desired top-to-bottom order: configured ids first, the rest after. */
      function desiredIds(renderIds) {
        var order = state.config.order || [];
        var listed = [];
        var set = {};
        for (var i = 0; i < order.length; i += 1) {
          var id = order[i];
          if (renderIds.indexOf(id) !== -1 && !set[id]) {
            set[id] = true;
            listed.push(id);
          }
        }
        var rest = [];
        for (var j = 0; j < renderIds.length; j += 1) {
          if (!set[renderIds[j]]) rest.push(renderIds[j]);
        }
        return listed.concat(rest);
      }

      /**
       * Resolve the entry's display label (thunk or string), used to match a
       * rendered child to its entry by text content.
       */
      function labelOf(entry) {
        var label = entry && entry.options ? entry.options.label : undefined;
        if (typeof label === 'function') {
          try { label = label(); } catch (err) { return ''; }
        }
        return typeof label === 'string' ? label.trim() : '';
      }

      /** Whether a rendered child's text contains the entry's label. */
      function matchesLabel(child, label) {
        if (!label || label.length < 2) return false;
        var text = (child.textContent || '').trim();
        return text.length > 0 && text.indexOf(label) !== -1;
      }

      /**
       * Best order-preserving assignment of `unknownChildren` (DOM order) to
       * `unclaimedIds` (render order), scored lexicographically by:
       *   1. how many assigned ids are explicitly listed in the configured
       *      order (the user's intent — prefer entries the user ordered),
       *   2. how little the assignment shifts children from their render rank
       *      (null-rendering entries sit at the ranks being skipped).
       * Enumerates all k-subsets (k and n are tiny — a handful of entries).
       */
      function bestAssignment(unknownChildren, unclaimedIds, configOrder) {
        var k = unknownChildren.length;
        var n = unclaimedIds.length;
        var best = null;
        var bestMatch = -1;
        var bestShift = Infinity;
        var idx = [];
        for (var i = 0; i < k; i += 1) idx.push(i);
        for (;;) {
          var match = 0;
          var shift = 0;
          for (var j = 0; j < k; j += 1) {
            if (configOrder.indexOf(unclaimedIds[idx[j]]) !== -1) match += 1;
            shift += Math.abs(idx[j] - j);
          }
          if (match > bestMatch || (match === bestMatch && shift < bestShift)) {
            bestMatch = match;
            bestShift = shift;
            best = idx.slice();
          }
          var pos = k - 1;
          while (pos >= 0 && idx[pos] === n - k + pos) pos -= 1;
          if (pos < 0) break;
          idx[pos] += 1;
          for (var q = pos + 1; q < k; q += 1) idx[q] = idx[q - 1] + 1;
        }
        return best;
      }

      /**
       * Pair the anchor's children to entry ids. Every rendered list entry
       * contributes exactly one child of the anchor, in render order — but
       * entries may render nothing (e.g. the shell's dormant `cordis-panel`,
       * or readouts hidden in the collapsed rail), so the children form a
       * (possibly proper) subsequence of the registered ids. Pairing goes
       * through three layers:
       *   1. label text — a child whose text contains an entry's label is that
       *      entry (strongest: exact whenever labels appear in the DOM);
       *   2. remembered pairings from earlier passes;
       *   3. best-assignment heuristic (config-order match, then min shift).
       * @returns a Map(childEl → entryId), or null when the DOM is too
       *   ambiguous to touch (more children than registered ids).
       */
      function pairChildren(ids, children) {
        var pairs = new Map();
        var claimedIds = {};
        var valid = {};
        for (var i = 0; i < ids.length; i += 1) valid[ids[i]] = true;

        function claim(el, id) {
          pairs.set(el, id);
          claimedIds[id] = true;
        }

        // 1. Label pass (entries in render order, so deterministic).
        var entries = [];
        try {
          entries = slots.entriesOfSlot(SLOT_KEY).slice().sort(function (a, b) {
            return (a.options.order || 0) - (b.options.order || 0);
          });
        } catch (err) { entries = []; }
        for (var e = 0; e < entries.length; e += 1) {
          var id = entries[e].options && entries[e].options.id;
          if (!id || !valid[id] || claimedIds[id]) continue;
          var label = labelOf(entries[e]);
          if (!label) continue;
          for (var c = 0; c < children.length; c += 1) {
            if (pairs.has(children[c])) continue;
            if (matchesLabel(children[c], label)) { claim(children[c], id); break; }
          }
        }

        // 2. Remembered pairings (only while both element and id are live).
        for (var c2 = 0; c2 < children.length; c2 += 1) {
          if (pairs.has(children[c2])) continue;
          var mid = state.idByEl.get(children[c2]);
          if (mid && valid[mid] && !claimedIds[mid]) claim(children[c2], mid);
        }

        // 3. Remaining children paired to the remaining ids.
        var unknown = [];
        for (var c3 = 0; c3 < children.length; c3 += 1) {
          if (!pairs.has(children[c3])) unknown.push(children[c3]);
        }
        var unclaimed = [];
        for (var u = 0; u < ids.length; u += 1) {
          if (!claimedIds[ids[u]]) unclaimed.push(ids[u]);
        }
        if (unknown.length > unclaimed.length) return null; // extra nodes — skip
        if (unknown.length === unclaimed.length) {
          for (var p = 0; p < unknown.length; p += 1) claim(unknown[p], unclaimed[p]);
        } else {
          var best = bestAssignment(unknown, unclaimed, state.config.order || []);
          if (best === null) return null;
          for (var b = 0; b < best.length; b += 1) claim(unknown[b], unclaimed[best[b]]);
        }

        // Persist pairings for future passes, then return.
        pairs.forEach(function (id, el) { state.idByEl.set(el, id); });
        return pairs;
      }

      /**
       * Reorder the anchor's children to the configured sequence. The pairing
       * above tolerates entries that render nothing, so the order applies even
       * while dormant entries (like the shell's `cordis-panel`) stay invisible.
       */
      function reconcile() {
        var anchor = findAnchor();
        if (!anchor) return;

        // A brand-new anchor (e.g. the sidebar remounted) invalidates pairing.
        if (anchor !== state.anchorEl) {
          state.idByEl.clear();
          state.anchorEl = anchor;
        }

        var ids = sortedEntryIds();
        var children = Array.prototype.slice.call(anchor.children);
        if (children.length === 0 || ids.length === 0) return;

        // Prune remembered pairings for ids/elements that no longer exist.
        var valid = {};
        for (var i = 0; i < ids.length; i += 1) valid[ids[i]] = true;
        var stale = [];
        state.idByEl.forEach(function (value, key) {
          if (!valid[value] || children.indexOf(key) === -1) stale.push(key);
        });
        for (var s = 0; s < stale.length; s += 1) state.idByEl.delete(stale[s]);

        var pairs = pairChildren(ids, children);
        if (pairs === null) return;

        // Sort the children into the desired sequence.
        var desired = desiredIds(ids);
        var pos = {};
        for (var d = 0; d < desired.length; d += 1) pos[desired[d]] = d;
        var ordered = children.slice().sort(function (a, b) {
          var pa = pos[pairs.get(a)];
          var pb = pos[pairs.get(b)];
          return (pa === undefined ? Number.MAX_SAFE_INTEGER : pa) - (pb === undefined ? Number.MAX_SAFE_INTEGER : pb);
        });

        var changed = false;
        for (var o = 0; o < ordered.length; o += 1) {
          if (anchor.children[o] !== ordered[o]) { changed = true; break; }
        }
        if (changed) {
          for (var m = 0; m < ordered.length; m += 1) anchor.appendChild(ordered[m]);
        }
      }

      // ── DOM observation ─────────────────────────────────────────────────────
      var debounceTimer = null;
      function schedule() {
        if (debounceTimer !== null) return;
        debounceTimer = window.setTimeout(function () {
          debounceTimer = null;
          try { reconcile(); } catch (err) { console.error('footer-order: reconcile failed:', err); }
        }, REORDER_DEBOUNCE_MS);
      }

      var observer = new MutationObserver(schedule);
      ctx.effect(function () {
        observer.observe(document.documentElement, { childList: true, subtree: true });
        return function () { observer.disconnect(); };
      }, 'footer-order: dom observer');

      // ── settings sync ───────────────────────────────────────────────────────
      /** Apply a fresh effective config: rebuild CSS, re-schedule reorder. */
      function applySettings(data) {
        var next = normalizeConfig(data);
        if (!sameConfig(state.config, next)) {
          state.config = next;
          applyCss();
          schedule();
        }
      }

      function fetchSettings() {
        fetch(SETTINGS_URL, { cache: 'no-store' })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (!data || typeof data !== 'object') return;
            applySettings(data);
          })
          .catch(function () { /* keep last known config */ });
      }

      ctx.effect(function () {
        fetchSettings();
        var intervalId = window.setInterval(fetchSettings, POLL_MS);
        var offSlots = null;
        try { offSlots = slots.subscribe(SLOT_KEY, schedule); } catch (err) { /* slot not yet declared */ }
        return function () {
          window.clearInterval(intervalId);
          if (offSlots) offSlots();
        };
      }, 'footer-order: settings sync');

      // ── Settings → Plugins card ─────────────────────────────────────────────
      function FooterOrderCard(props) {
        var t = props.t;
        var fieldsState = react.useState({ layout: 'column', gap: '0', align: 'stretch' });
        var fields = fieldsState[0];
        var setFields = fieldsState[1];
        var listState = react.useState([]);
        var list = listState[0];
        var setList = listState[1];
        var metaState = react.useState({ hasOverrides: false });
        var meta = metaState[0];
        var setMeta = metaState[1];
        var dirtyRef = react.useRef(false);
        var openState = react.useState(false);
        var open = openState[0];
        var saveState = react.useState({ status: 'idle', message: '' });
        var save = saveState[0];
        var setSave = saveState[1];

        /** Registered footer action ids in render order. */
        function knownIds() {
          try {
            return slots
              .entriesOfSlot(SLOT_KEY)
              .slice()
              .sort(function (a, b) { return (a.options.order || 0) - (b.options.order || 0); })
              .map(function (e) { return e.options.id; })
              .filter(Boolean);
          } catch (err) {
            return [];
          }
        }

        /** Config order list filtered to known ids, plus known ids not listed. */
        function buildList(orderConfig) {
          var known = knownIds();
          var listed = [];
          var set = {};
          for (var i = 0; i < orderConfig.length; i += 1) {
            var id = orderConfig[i];
            if (known.indexOf(id) !== -1 && !set[id]) { set[id] = true; listed.push(id); }
          }
          var rest = [];
          for (var j = 0; j < known.length; j += 1) {
            if (!set[known[j]]) rest.push(known[j]);
          }
          return listed.concat(rest);
        }

        // Load effective config + registered ids; re-poll while open unless dirty.
        react.useEffect(function () {
          var cancelled = false;
          function doFetch() {
            fetch(SETTINGS_URL, { cache: 'no-store' })
              .then(function (res) { return res.json(); })
              .then(function (data) {
                if (cancelled || !data || typeof data !== 'object') return;
                setMeta({ hasOverrides: !!data.hasOverrides });
                if (!dirtyRef.current) {
                  setFields({
                    layout: data.layout || 'column',
                    gap: String(typeof data.gap === 'number' ? data.gap : 0),
                    align: data.align || 'stretch',
                  });
                  setList(buildList(Array.isArray(data.order) ? data.order : []));
                }
              })
              .catch(function () { /* keep last known values */ });
          }
          doFetch();
          var intervalId = window.setInterval(doFetch, 30000);
          var offSlots = null;
          try { offSlots = slots.subscribe(SLOT_KEY, doFetch); } catch (err) { /* not declared yet */ }
          return function () {
            cancelled = true;
            window.clearInterval(intervalId);
            if (offSlots) offSlots();
          };
        }, []);

        function setField(field, value) {
          dirtyRef.current = true;
          setSave({ status: 'idle', message: '' });
          setFields(function (prev) {
            var next = {};
            for (var key in prev) next[key] = prev[key];
            next[field] = value;
            return next;
          });
        }

        function move(index, delta) {
          dirtyRef.current = true;
          setSave({ status: 'idle', message: '' });
          setList(function (prev) {
            var next = prev.slice();
            var target = index + delta;
            if (target < 0 || target >= next.length) return prev;
            var tmp = next[index];
            next[index] = next[target];
            next[target] = tmp;
            return next;
          });
        }

        function applyResponse(data) {
          dirtyRef.current = false;
          setMeta({ hasOverrides: !!data.hasOverrides });
          setFields({
            layout: data.layout || 'column',
            gap: String(typeof data.gap === 'number' ? data.gap : 0),
            align: data.align || 'stretch',
          });
          setList(buildList(Array.isArray(data.order) ? data.order : []));
          // Apply instantly to the sidebar (also picked up by the poller).
          applySettings(data);
        }

        function saveErrorMessage(data) {
          if (!data || typeof data !== 'object') return 'save failed';
          if (data.error === 'invalid-field') {
            return t('invalidFields') + ' ' + (Array.isArray(data.fields) ? data.fields.join(', ') : '');
          }
          return String(data.error);
        }

        function onSave() {
          var gap = Number(fields.gap);
          var validLayout = LAYOUT_VALUES.indexOf(fields.layout) !== -1;
          var validAlign = ALIGN_VALUES.indexOf(fields.align) !== -1;
          if (!validLayout || !validAlign || !Number.isFinite(gap) || gap < 0) {
            setSave({ status: 'error', message: t('invalidFields') + ' ' + t('cardTitle') });
            return;
          }
          setSave({ status: 'saving', message: '' });
          fetch(SETTINGS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              layout: fields.layout,
              gap: gap,
              align: fields.align,
              order: list,
            }),
          })
            .then(function (res) {
              return res.json().then(function (data) { return { ok: res.ok, data: data }; });
            })
            .then(function (result) {
              if (!result.ok || (result.data && result.data.error)) {
                setSave({ status: 'error', message: saveErrorMessage(result.data) });
                return;
              }
              applyResponse(result.data);
              setSave({ status: 'saved', message: '' });
            })
            .catch(function () {
              setSave({ status: 'error', message: 'network error' });
            });
        }

        function onReset() {
          setSave({ status: 'saving', message: '' });
          fetch(SETTINGS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reset: true }),
          })
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data && data.error) {
                setSave({ status: 'error', message: saveErrorMessage(data) });
                return;
              }
              applyResponse(data);
              setSave({ status: 'saved', message: '' });
            })
            .catch(function () {
              setSave({ status: 'error', message: 'network error' });
            });
        }

        var cardStyle = { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', borderRadius: '12px', listStyle: 'none' };
        var headerStyle = { appearance: 'none', width: '100%', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', background: '0 0', border: '0', borderRadius: '12px', alignItems: 'center', gap: '12px', padding: '14px 16px', display: 'flex' };
        var bodyStyle = { borderTop: '1px solid var(--dsw-alias-border-l2)', margin: '0 16px', padding: '12px 0 8px' };
        var fieldStyle = { flexDirection: 'column', gap: '4px', padding: '8px 0', display: 'flex' };
        var rowStyle = { alignItems: 'center', gap: '8px', display: 'flex' };
        var labelStyle = { minWidth: '0', color: 'var(--dsw-alias-label-primary)', flex: '1', fontSize: '13px', fontWeight: '500', lineHeight: '1.5' };
        var hintStyle = { color: 'var(--dsw-alias-label-tertiary)', margin: '0', fontSize: '12px', lineHeight: '1.5' };
        var controlStyle = { background: 'var(--dsw-alias-bg-layer-1, #fff)', color: 'var(--dsw-alias-label-primary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', minWidth: '0', flex: '1' };
        var saveButtonStyle = { background: 'var(--dsw-alias-button-primary-fill, #4f6ef7)', color: 'var(--dsw-alias-label-primary-inverted, #fff)', border: '0', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' };
        var ghostButtonStyle = { background: 'transparent', color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' };
        var moveButtonStyle = { background: 'transparent', color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer', flex: 'none' };
        var idStyle = { color: 'var(--dsw-alias-label-primary)', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1' };
        var disabledStyle = { opacity: 0.5, cursor: 'default' };
        var statusStyle = { margin: '0', fontSize: '12px', lineHeight: '1.5' };
        var saving = save.status === 'saving';

        var CHEVRON_SVG = '<svg width="14" height="14" class="YyYd_a_chevron" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z" fill="currentColor"></path></svg>';
        var CHEVRON_OPEN_SVG = '<svg width="14" height="14" class="YyYd_a_chevron YyYd_a_chevronOpen" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z" fill="currentColor"></path></svg>';
        function ChevronIcon(isOpen) {
          return react.createElement('span', {
            style: { color: 'var(--dsw-alias-label-tertiary)', flex: 'none', display: 'inline-flex' },
            dangerouslySetInnerHTML: { __html: isOpen ? CHEVRON_OPEN_SVG : CHEVRON_SVG },
          });
        }

        var orderRows = list.map(function (id, index) {
          return react.createElement('div', { key: id, style: rowStyle },
            react.createElement('span', { style: idStyle, title: id }, id),
            react.createElement('button', {
              type: 'button',
              style: index === 0 ? Object.assign({}, moveButtonStyle, disabledStyle) : moveButtonStyle,
              disabled: index === 0,
              'aria-label': t('moveUp'),
              onClick: function () { move(index, -1); },
            }, '\u2191'),
            react.createElement('button', {
              type: 'button',
              style: index === list.length - 1 ? Object.assign({}, moveButtonStyle, disabledStyle) : moveButtonStyle,
              disabled: index === list.length - 1,
              'aria-label': t('moveDown'),
              onClick: function () { move(index, 1); },
            }, '\u2193')
          );
        });

        return react.createElement('li', { style: cardStyle },
          react.createElement('button', { style: headerStyle, onClick: function () { openState[1](!open); }, 'aria-expanded': open },
            react.createElement('span', { style: { flexDirection: 'column', flex: '1', gap: '4px', minWidth: '0', display: 'flex' } },
              react.createElement('span', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '15px', fontWeight: '600', lineHeight: '1.4' } }, t('cardTitle')),
              react.createElement('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '13px', lineHeight: '1.5' } }, t('cardDescription'))
            ),
            ChevronIcon(open)
          ),
          open ? react.createElement('div', { style: bodyStyle },
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle, htmlFor: 'dfo-layout' }, t('layoutLabel')),
              react.createElement('select', { id: 'dfo-layout', style: controlStyle, value: fields.layout, onChange: function (e) { setField('layout', e.target.value); } },
                react.createElement('option', { value: 'column' }, t('layoutColumn')),
                react.createElement('option', { value: 'row' }, t('layoutRow')),
                react.createElement('option', { value: 'contents' }, t('layoutContents'))
              ),
              react.createElement('p', { style: hintStyle }, t('layoutHint'))
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle, htmlFor: 'dfo-gap' }, t('gapLabel')),
              react.createElement('input', { id: 'dfo-gap', type: 'number', min: 0, step: 1, style: controlStyle, value: fields.gap, onChange: function (e) { setField('gap', e.target.value); } })
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle, htmlFor: 'dfo-align' }, t('alignLabel')),
              react.createElement('select', { id: 'dfo-align', style: controlStyle, value: fields.align, onChange: function (e) { setField('align', e.target.value); } },
                react.createElement('option', { value: 'stretch' }, t('alignStretch')),
                react.createElement('option', { value: 'start' }, t('alignStart')),
                react.createElement('option', { value: 'center' }, t('alignCenter')),
                react.createElement('option', { value: 'end' }, t('alignEnd'))
              )
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle }, t('orderLabel')),
              orderRows.length > 0 ? react.createElement('div', { style: { flexDirection: 'column', gap: '4px', display: 'flex' } }, orderRows)
                : react.createElement('p', { style: hintStyle }, t('orderEmpty')),
              react.createElement('p', { style: hintStyle }, t('orderHint'))
            ),
            react.createElement('div', { style: rowStyle },
              react.createElement('button', { style: saving ? Object.assign({}, saveButtonStyle, disabledStyle) : saveButtonStyle, disabled: saving, onClick: onSave }, t('saveLabel')),
              react.createElement('button', { style: saving || !meta.hasOverrides ? Object.assign({}, ghostButtonStyle, disabledStyle) : ghostButtonStyle, disabled: saving || !meta.hasOverrides, onClick: onReset }, t('resetLabel'))
            ),
            saving ? react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-label-tertiary, #888)' }) }, t('savingStatus'))
              : save.status === 'saved' ? react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-state-success-primary, #2f9e44)' }) }, t('savedStatus'))
              : save.status === 'error' ? react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-state-error-primary, #e53e3e)' }) }, save.message)
              : null,
            react.createElement('p', { style: hintStyle }, t('configSource'))
          ) : null
        );
      }

      // ── slot registrations ──────────────────────────────────────────────────
      // Settings → Plugins → configurable card.
      slots.inject('settings.plugin.item', function () {
        return slots.register(
          {
            name: 'settings.plugin.item',
            id: 'footer-order',
            order: 40,
            locale: 'footer-order',
          },
          function (props) {
            var t = ctx.locale.bind('footer-order');
            return react.createElement(FooterOrderCard, { t: t });
          }
        );
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
