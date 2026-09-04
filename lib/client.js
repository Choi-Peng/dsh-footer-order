// AI 生成声明:本插件代码由 AI 生成,可能存在错误或安全隐患,使用前请 review 并实测。
// dsh-footer-order — Client half
// Forces the sidebar footer action slot anchor (`div[data-slot=sidebar.footer.action]`,
// which the web-react renderer gives `display: contents`) into a vertical flex
// stack so multiple footer plugins no longer squeeze into one row, and
// reorders the rendered entries to match the configured top-to-bottom order
// (the effective `order` served by the Host half — deploy-time config from
// the plugin's cordis.patch.yml row as the settings base layer, plus any
// user overrides persisted through the dsh settings store).
//
// The shell's settings row (the `div.settingsArea` block wrapping the
// `sidebar.settings` outlet) participates in the same order under the
// reserved id `settings`: listed in `order` it becomes one more block of the
// anchor's column, so it can sit above, between, or below the footer entries;
// left out of `order` it stays exactly where the shell renders it (the foot
// area, below the footer stack) and the plugin never touches it.
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

    // ── host field-class reuse ──────────────────────────────────────────────
    // The official plugin-settings cards inject their fields.module.css into
    // document.head as a global style tag. Reusing that input class keeps the
    // gap input pixel-identical to the host's fields — but the class
    // name is a build-time CSS-module hash (At1oFq_input in 0.1.2), not a
    // stable API, so extract it from the tag at runtime and fall back to
    // inline styles when the tag or the rule is absent.
    var cachedHostInputClass = '';
    function hostInputClassName() {
      if (cachedHostInputClass) return cachedHostInputClass;
      var tag = document.querySelector('style[data-plugin-css="@deepseek-ai/dsh-client-ui-settings-plugins/fields.module.css"]');
      if (!tag) return '';
      var match = /\.([A-Za-z0-9]+_input)\{/.exec(tag.textContent || '');
      if (!match) return '';
      cachedHostInputClass = match[1];
      return cachedHostInputClass;
    }

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
      settingsRow: 'Settings row (settingsArea)',
      settingsAreaGroup: 'Settings Area Arrangement',
      settingsAreaGroupHint: 'Controls the layout, spacing, alignment, and internal order of elements inside settingsArea (settings trigger, connection status, and injected elements).',
      settingsLayoutLabel: 'Settings area layout',
      settingsLayoutHint: 'row = horizontal (left to right); column = vertical (top to bottom); row-reverse / column-reverse = reverse order; contents = leave as-is.',
      settingsLayoutRow: 'Row (horizontal)',
      settingsLayoutColumn: 'Column (vertical)',
      settingsLayoutRowReverse: 'Row reverse',
      settingsLayoutColumnReverse: 'Column reverse',
      settingsLayoutContents: 'Contents (no override)',
      settingsGapLabel: 'Settings area gap (px)',
      settingsAlignLabel: 'Settings area alignment',
      settingsAlignStretch: 'Stretch',
      settingsAlignStart: 'Start',
      settingsAlignCenter: 'Center',
      settingsAlignEnd: 'End',
      settingsOrderLabel: 'Settings area item order',
      settingsOrderHint: 'Order of items inside settingsArea (e.g. settings trigger, connection status).',
      settingsItemTrigger: 'Settings button',
      settingsItemConnection: 'Connection status indicator',
      moveUp: 'Move up',
      moveDown: 'Move down',
      saveLabel: 'Save',
      resetLabel: 'Reset to defaults',
      savingStatus: 'Saving…',
      savedStatus: 'Saved — applies immediately.',
      invalidFields: 'Invalid value(s) for:',
      configSource: 'Settings are saved into the dsh settings store ($DSH_HOME/settings.yaml) and apply live — no restart needed.',
      conflictMessage: 'Configuration was modified elsewhere — your changes were not saved. The latest values are shown.',
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
      settingsRow: '设置行(settingsArea)',
      settingsAreaGroup: '设置区排列管理 (settingsArea)',
      settingsAreaGroupHint: '控制 settingsArea 内部（设置按钮、连接状态指示器及注入组件）的排列方式、间距、对齐与前后顺序。',
      settingsLayoutLabel: '设置区排列方式',
      settingsLayoutHint: 'row = 左右横向; column = 上下纵向; row-reverse / column-reverse = 反向颠倒; contents = 不干预(保持默认)。',
      settingsLayoutRow: '左右排列(row)',
      settingsLayoutColumn: '上下排列(column)',
      settingsLayoutRowReverse: '左右反向(row-reverse)',
      settingsLayoutColumnReverse: '上下反向(column-reverse)',
      settingsLayoutContents: '不干预(contents)',
      settingsGapLabel: '设置区间距(px)',
      settingsAlignLabel: '设置区对齐方式',
      settingsAlignStretch: '拉伸(stretch)',
      settingsAlignStart: '起始对齐(start)',
      settingsAlignCenter: '居中对齐(center)',
      settingsAlignEnd: '结束对齐(end)',
      settingsOrderLabel: '设置区内部顺序',
      settingsOrderHint: '控制设置区内部组件（设置按钮、连接指示器等）的先后顺序。',
      settingsItemTrigger: '设置按钮',
      settingsItemConnection: '连接状态指示器',
      moveUp: '上移',
      moveDown: '下移',
      saveLabel: '保存',
      resetLabel: '恢复默认',
      savingStatus: '保存中…',
      savedStatus: '已保存,立即生效。',
      invalidFields: '以下字段的值不合法:',
      configSource: '设置会保存到 dsh 设置存储($DSH_HOME/settings.yaml),并实时生效,无需重启。',
      conflictMessage: '配置已在别处被修改,本次修改未保存,已载入最新配置。',
      unknownEntry: '(未注册)',
    };

    /** The sidebar footer action slot this plugin targets. */
    var SLOT_KEY = 'sidebar.footer.action';
    /** The sidebar settings slot: rendered inside the shell's `settingsArea` div. */
    var SETTINGS_SLOT_KEY = 'sidebar.settings';
    /** Reserved `order` id standing for the shell's settings row (settingsArea). */
    var SETTINGS_ITEM_ID = 'settings';
    /** Settings endpoint on the host half. */
    var SETTINGS_URL = '/footer-order/settings';
    /** How often the client re-reads the effective config (covers external edits). */
    var POLL_MS = 10000;
    /** Debounce for DOM reordering (lets React commits settle). */
    var REORDER_DEBOUNCE_MS = 80;

    var DEFAULT_SETTINGS = {
      layout: 'column',
      gap: 0,
      align: 'stretch',
      order: [],
      settingsLayout: 'contents',
      settingsGap: 8,
      settingsAlign: 'center',
      settingsOrder: [],
    };
    var LAYOUT_VALUES = ['column', 'row', 'contents'];
    var ALIGN_VALUES = ['stretch', 'start', 'center', 'end'];
    var SETTINGS_LAYOUT_VALUES = ['row', 'column', 'row-reverse', 'column-reverse', 'contents'];
    var SETTINGS_ALIGN_VALUES = ['center', 'stretch', 'start', 'end'];

    /** Pick a valid config object out of an arbitrary payload. */
    function normalizeConfig(data) {
      var out = {
        layout: DEFAULT_SETTINGS.layout,
        gap: DEFAULT_SETTINGS.gap,
        align: DEFAULT_SETTINGS.align,
        order: DEFAULT_SETTINGS.order.slice(),
        settingsLayout: DEFAULT_SETTINGS.settingsLayout,
        settingsGap: DEFAULT_SETTINGS.settingsGap,
        settingsAlign: DEFAULT_SETTINGS.settingsAlign,
        settingsOrder: DEFAULT_SETTINGS.settingsOrder.slice(),
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
      if (SETTINGS_LAYOUT_VALUES.indexOf(data.settingsLayout) !== -1) out.settingsLayout = data.settingsLayout;
      if (typeof data.settingsGap === 'number' && Number.isFinite(data.settingsGap) && data.settingsGap >= 0) out.settingsGap = data.settingsGap;
      if (SETTINGS_ALIGN_VALUES.indexOf(data.settingsAlign) !== -1) out.settingsAlign = data.settingsAlign;
      if (Array.isArray(data.settingsOrder)) {
        var seenS = {};
        var cleanS = [];
        for (var s = 0; s < data.settingsOrder.length; s += 1) {
          var sid = data.settingsOrder[s];
          if (typeof sid !== 'string' || sid.length === 0 || seenS[sid]) continue;
          seenS[sid] = true;
          cleanS.push(sid);
        }
        out.settingsOrder = cleanS;
      }
      return out;
    }

    function sameConfig(a, b) {
      if (a.layout !== b.layout || a.gap !== b.gap || a.align !== b.align) return false;
      if (a.settingsLayout !== b.settingsLayout || a.settingsGap !== b.settingsGap || a.settingsAlign !== b.settingsAlign) return false;
      if (a.order.length !== b.order.length) return false;
      for (var i = 0; i < a.order.length; i += 1) if (a.order[i] !== b.order[i]) return false;
      var aSO = a.settingsOrder || [];
      var bSO = b.settingsOrder || [];
      if (aSO.length !== bSO.length) return false;
      for (var j = 0; j < aSO.length; j += 1) if (aSO[j] !== bSO[j]) return false;
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
     * Stylesheet text overriding the slot anchor and settings area. `!important` is required:
     * the renderer applies `display: contents` as an inline style, and inline
     * styles beat plain stylesheet rules.
     */
    function buildCss(cfg) {
      var lines = [];

      // ── Footer actions slot ───────────────────────────────────────────────
      var layout = cfg.layout;
      if (layout !== 'row' && layout !== 'contents') layout = 'column';
      if (layout === 'contents') {
        lines.push('div[data-slot="sidebar.footer.action"]{display:contents !important;}');
      } else {
        var gap = typeof cfg.gap === 'number' && cfg.gap > 0 ? cfg.gap : 0;
        lines.push(
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

      // ── Settings area arrangement ─────────────────────────────────────────
      var sLayout = cfg.settingsLayout;
      if (SETTINGS_LAYOUT_VALUES.indexOf(sLayout) === -1) sLayout = 'row';
      if (sLayout !== 'contents') {
        var sGap = typeof cfg.settingsGap === 'number' && cfg.settingsGap >= 0 ? cfg.settingsGap : 8;
        var sAlign = alignKeyword(cfg.settingsAlign || 'center');
        var triggerRowSel = 'div[data-slot="sidebar.settings"] > div';
        var isCol = sLayout === 'column' || sLayout === 'column-reverse';

        lines.push(
          triggerRowSel + '{' +
          'display:flex !important;' +
          'flex-direction:' + sLayout + ' !important;' +
          'align-items:' + sAlign + ' !important;' +
          'gap:' + sGap + 'px !important;' +
          (isCol ? 'width:100% !important; margin-left:0 !important; margin-right:0 !important;' : '') +
          '}'
        );

        if (isCol && cfg.settingsAlign === 'stretch') {
          lines.push(
            triggerRowSel + ' > button,' + triggerRowSel + ' > div{' +
            'width:100% !important;' +
            'justify-content:center !important;' +
            '}'
          );
        }
      }

      // ── Settings area internal ordering (CSS order) ───────────────────────
      if (Array.isArray(cfg.settingsOrder) && cfg.settingsOrder.length > 0) {
        var triggerSel = 'div[data-slot="sidebar.settings"] > div';
        for (var o = 0; o < cfg.settingsOrder.length; o += 1) {
          var itemKey = cfg.settingsOrder[o];
          var orderVal = o + 1;
          if (itemKey === 'settings') {
            lines.push(
              triggerSel + ' > button[aria-haspopup="dialog"],' +
              triggerSel + ' > button[class*="trigger"]{' +
              'order:' + orderVal + ' !important;' +
              '}'
            );
          } else if (itemKey === 'connection') {
            lines.push(
              triggerSel + ' > button[class*="indicator"],' +
              triggerSel + ' > div[class*="indicator"],' +
              triggerSel + ' > [data-phase],' +
              triggerSel + ' > [role="status"]{' +
              'order:' + orderVal + ' !important;' +
              '}'
            );
          }
        }
      }

      return lines.join('\n');
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

      // Focus-visible and appearance rules matching the host plugin settings.
      ctx.effect(function () {
        var style = document.createElement('style');
        style.id = 'dsh-footer-order-card-style';
        style.textContent =
          '#dfo-gap:focus-visible,#dfo-settings-gap:focus-visible{ border-color: var(--dsw-alias-brand-primary); outline: none; }' +
          '#dfo-gap::-webkit-outer-spin-button,#dfo-gap::-webkit-inner-spin-button,#dfo-settings-gap::-webkit-outer-spin-button,#dfo-settings-gap::-webkit-inner-spin-button{ -webkit-appearance: none; margin: 0; }' +
          '#dfo-gap,#dfo-settings-gap{ -moz-appearance: textfield; appearance: textfield; }' +
          '.dfo-option:focus-visible{ outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }';
        document.head.appendChild(style);
        return function () {
          if (style.parentNode) style.parentNode.removeChild(style);
        };
      }, 'footer-order: card styles');

      // Unload leaves no trace: give the settings row back to the foot area if
      // this plugin had moved it into the footer column, and clear internal inline order styles.
      ctx.effect(function () {
        return function () {
          try {
            var anchor = findAnchor();
            var settings = findSettingsBlock();
            if (anchor && settings && settings.parentElement === anchor) {
              var area = footAreaOf(anchor);
              if (area) area.appendChild(settings);
            }
            var triggerRow = document.querySelector('div[data-slot="' + SETTINGS_SLOT_KEY + '"] > div');
            if (triggerRow && triggerRow.children) {
              for (var i = 0; i < triggerRow.children.length; i += 1) {
                triggerRow.children[i].style.order = '';
              }
            }
          } catch (err) { /* best effort — the shell owns the node either way */ }
        };
      }, 'footer-order: restore settings row');

      function applyCss() {
        styleEl.textContent = buildCss(state.config);
      }
      applyCss();

      // ── ordering machinery ──────────────────────────────────────────────────
      function findAnchor() {
        return document.querySelector('div[data-slot="' + SLOT_KEY + '"]');
      }

      /**
       * The shell's settings-area block (`div.settingsArea`), found without
       * touching its CSS-module class: the `sidebar.settings` outlet anchor is
       * `display: contents`, so its parent element IS that block.
       */
      function findSettingsBlock() {
        var settingsAnchor = document.querySelector('div[data-slot="' + SETTINGS_SLOT_KEY + '"]');
        return settingsAnchor ? settingsAnchor.parentElement : null;
      }

      /**
       * The element the shell renders the two blocks into (`div.footArea`) —
       * the footer-actions wrapper's parent, regardless of where the settings
       * block currently sits.
       */
      function footAreaOf(anchor) {
        var block = anchor ? anchor.parentElement : null; // div.footerActions
        return block ? block.parentElement : null; // div.footArea
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

      /**
       * Desired top-to-bottom sequence of blocks: the configured footer entry
       * ids in the configured order, the reserved `settings` id (the shell's
       * settings row) at its configured slot, then every entry the config left
       * out in registration order. `settingsListed` is false when the config
       * never mentions the settings row — it then stays exactly where the
       * shell renders it (below the footer stack) and the plugin leaves it
       * alone; `settingsPos` is the row's index in the returned sequence.
       *
       * `settings` is only reserved while no real footer entry owns that id —
       * an actual registration always wins, so a plugin that happens to use
       * the id keeps being orderable by it.
       */
      function desiredItems(renderIds) {
        var order = state.config.order || [];
        var items = [];
        var seen = {};
        var settingsPos = -1;
        for (var i = 0; i < order.length; i += 1) {
          var id = order[i];
          if (renderIds.indexOf(id) !== -1) {
            if (seen[id]) continue;
            seen[id] = true;
            items.push({ kind: 'entry', id: id });
          } else if (id === SETTINGS_ITEM_ID && settingsPos === -1) {
            settingsPos = items.length;
            items.push({ kind: 'settings' });
          }
        }
        var rest = [];
        for (var j = 0; j < renderIds.length; j += 1) {
          if (!seen[renderIds[j]]) rest.push(renderIds[j]);
        }
        for (var r = 0; r < rest.length; r += 1) items.push({ kind: 'entry', id: rest[r] });
        return { items: items, settingsListed: settingsPos !== -1, settingsPos: settingsPos };
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
        var settings = findSettingsBlock();
        var desired = desiredItems(ids);

        // ── the shell's settings row (settingsArea) ─────────────────────────
        // Listed in `order` → it becomes one more block of the anchor's column
        // (the column this plugin already owns), so it can sit above, between,
        // or below the footer entries. Not listed → put it back where the shell
        // renders it (last child of the foot area, below the footer stack) and
        // otherwise never touch it.
        if (settings) {
          if (desired.settingsListed) {
            if (settings.parentElement !== anchor) anchor.appendChild(settings);
          } else if (settings.parentElement === anchor) {
            var area = footAreaOf(anchor);
            if (area) area.appendChild(settings);
          }
        }

        // ── the footer entries ──────────────────────────────────────────────
        var all = Array.prototype.slice.call(anchor.children);
        var children = [];
        for (var c = 0; c < all.length; c += 1) {
          if (all[c] !== settings) children.push(all[c]);
        }
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

        // Sort the blocks into the desired sequence (entries +, when listed,
        // the settings row) — one index space, so the two mix freely.
        var pos = {};
        for (var d = 0; d < desired.items.length; d += 1) {
          if (desired.items[d].kind === 'entry') pos[desired.items[d].id] = d;
        }
        function rankOf(el) {
          if (el === settings) return desired.settingsPos;
          var p = pos[pairs.get(el)];
          return p === undefined ? Number.MAX_SAFE_INTEGER : p;
        }
        var nodes = children.slice();
        if (settings && desired.settingsListed && settings.parentElement === anchor) nodes.push(settings);
        nodes.sort(function (a, b) { return rankOf(a) - rankOf(b); });

        var changed = false;
        for (var o = 0; o < nodes.length; o += 1) {
          if (anchor.children[o] !== nodes[o]) { changed = true; break; }
        }
        if (changed) {
          for (var m = 0; m < nodes.length; m += 1) anchor.appendChild(nodes[m]);
        }

        // ── settingsArea internal items ordering ────────────────────────────
        try {
          var triggerRow = document.querySelector('div[data-slot="' + SETTINGS_SLOT_KEY + '"] > div');
          if (triggerRow && triggerRow.children) {
            var sOrder = state.config.settingsOrder;
            for (var tc = 0; tc < triggerRow.children.length; tc += 1) {
              var tChild = triggerRow.children[tc];
              if (sOrder && sOrder.length > 0) {
                var isTrigger = tChild.tagName === 'BUTTON' && (tChild.getAttribute('aria-haspopup') === 'dialog' || (tChild.className && tChild.className.indexOf('trigger') !== -1));
                var isIndicator = (tChild.className && tChild.className.indexOf('indicator') !== -1) || tChild.hasAttribute('data-phase') || tChild.getAttribute('role') === 'status';
                var key = isTrigger ? 'settings' : isIndicator ? 'connection' : (tChild.id || tChild.getAttribute('data-slot') || ('item-' + (tc + 1)));
                var sIdx = sOrder.indexOf(key);
                tChild.style.order = sIdx !== -1 ? String(sIdx + 1) : '';
              } else {
                tChild.style.order = '';
              }
            }
          }
        } catch (err) { /* best effort */ }
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
        var fieldsState = react.useState({
          layout: 'column',
          gap: '0',
          align: 'stretch',
          settingsLayout: 'contents',
          settingsGap: '8',
          settingsAlign: 'center',
        });
        var fields = fieldsState[0];
        var setFields = fieldsState[1];
        var listState = react.useState([]);
        var list = listState[0];
        var setList = listState[1];
        var settingsListState = react.useState([]);
        var settingsList = settingsListState[0];
        var setSettingsList = settingsListState[1];
        var metaState = react.useState({ hasOverrides: false });
        var meta = metaState[0];
        var setMeta = metaState[1];
        var dirtyRef = react.useRef(false);
        // Server-side revision of the `footer-order` namespace this form was
        // last populated from; echoed back as `expectedRevision` on save/reset
        // so a concurrent edit refuses with HTTP 409 instead of silently
        // clobbering the other writer.
        var revisionRef = react.useRef(0);
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

        /**
         * Editor list: the configured order (known entry ids +, while no entry
         * owns it, the reserved `settings` id) followed by everything left out.
         * The settings row lands last when unconfigured — mirroring where the
         * shell renders it.
         */
        function buildList(orderConfig) {
          var known = knownIds();
          var reserved = known.indexOf(SETTINGS_ITEM_ID) === -1;
          var listed = [];
          var set = {};
          for (var i = 0; i < orderConfig.length; i += 1) {
            var id = orderConfig[i];
            if (known.indexOf(id) !== -1) {
              if (!set[id]) { set[id] = true; listed.push(id); }
            } else if (reserved && id === SETTINGS_ITEM_ID && !set[id]) {
              set[id] = true;
              listed.push(id);
            }
          }
          var rest = [];
          for (var j = 0; j < known.length; j += 1) {
            if (!set[known[j]]) rest.push(known[j]);
          }
          if (reserved && !set[SETTINGS_ITEM_ID]) rest.push(SETTINGS_ITEM_ID);
          return listed.concat(rest);
        }

        /** Known element ids inside settingsArea / triggerRow. */
        function knownSettingsIds() {
          var ids = ['settings', 'connection'];
          try {
            var triggerRow = document.querySelector('div[data-slot="' + SETTINGS_SLOT_KEY + '"] > div');
            if (triggerRow && triggerRow.children) {
              for (var i = 0; i < triggerRow.children.length; i += 1) {
                var el = triggerRow.children[i];
                var isTrigger = el.tagName === 'BUTTON' && (el.getAttribute('aria-haspopup') === 'dialog' || (el.className && el.className.indexOf('trigger') !== -1));
                var isIndicator = (el.className && el.className.indexOf('indicator') !== -1) || el.hasAttribute('data-phase') || el.getAttribute('role') === 'status';
                if (!isTrigger && !isIndicator) {
                  var cid = el.id || el.getAttribute('data-slot') || ('item-' + (i + 1));
                  if (ids.indexOf(cid) === -1) ids.push(cid);
                }
              }
            }
          } catch (err) { /* best effort */ }
          return ids;
        }

        function buildSettingsList(orderConfig) {
          var known = knownSettingsIds();
          var listed = [];
          var set = {};
          if (Array.isArray(orderConfig)) {
            for (var i = 0; i < orderConfig.length; i += 1) {
              var id = orderConfig[i];
              if (known.indexOf(id) !== -1 && !set[id]) {
                set[id] = true;
                listed.push(id);
              }
            }
          }
          for (var j = 0; j < known.length; j += 1) {
            if (!set[known[j]]) {
              set[known[j]] = true;
              listed.push(known[j]);
            }
          }
          return listed;
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
                  // Only adopt the server revision while the form is pristine:
                  // once the user edits, their snapshot is deliberately the
                  // stale one, so a concurrent write surfaces as a 409.
                  revisionRef.current = typeof data.revision === 'number' ? data.revision : revisionRef.current;
                  setFields({
                    layout: data.layout || 'column',
                    gap: String(typeof data.gap === 'number' ? data.gap : 0),
                    align: data.align || 'stretch',
                    settingsLayout: data.settingsLayout || 'row',
                    settingsGap: String(typeof data.settingsGap === 'number' ? data.settingsGap : 8),
                    settingsAlign: data.settingsAlign || 'center',
                  });
                  setList(buildList(Array.isArray(data.order) ? data.order : []));
                  setSettingsList(buildSettingsList(Array.isArray(data.settingsOrder) ? data.settingsOrder : []));
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

        function moveSettings(index, delta) {
          dirtyRef.current = true;
          setSave({ status: 'idle', message: '' });
          setSettingsList(function (prev) {
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
          revisionRef.current = typeof data.revision === 'number' ? data.revision : revisionRef.current;
          setMeta({ hasOverrides: !!data.hasOverrides });
          setFields({
            layout: data.layout || 'column',
            gap: String(typeof data.gap === 'number' ? data.gap : 0),
            align: data.align || 'stretch',
            settingsLayout: data.settingsLayout || 'row',
            settingsGap: String(typeof data.settingsGap === 'number' ? data.settingsGap : 8),
            settingsAlign: data.settingsAlign || 'center',
          });
          setList(buildList(Array.isArray(data.order) ? data.order : []));
          setSettingsList(buildSettingsList(Array.isArray(data.settingsOrder) ? data.settingsOrder : []));
          // Apply instantly to the sidebar (also picked up by the poller).
          applySettings(data);
        }

        /**
         * A save/reset was refused because the namespace moved since this form
         * was populated (HTTP 409, stale `expectedRevision`). Re-read the
         * server state, adopt it (form + sidebar) and surface a conflict
         * message so the user sees the other writer's values.
         */
        function handleConflict() {
          fetch(SETTINGS_URL, { cache: 'no-store' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data && typeof data === 'object') {
                // The form now mirrors the server again — the user's unsaved
                // edits were discarded, so stop treating the form as dirty.
                dirtyRef.current = false;
                revisionRef.current = typeof data.revision === 'number' ? data.revision : revisionRef.current;
                setMeta({ hasOverrides: !!data.hasOverrides });
                setFields({
                  layout: data.layout || 'column',
                  gap: String(typeof data.gap === 'number' ? data.gap : 0),
                  align: data.align || 'stretch',
                  settingsLayout: data.settingsLayout || 'row',
                  settingsGap: String(typeof data.settingsGap === 'number' ? data.settingsGap : 8),
                  settingsAlign: data.settingsAlign || 'center',
                });
                setList(buildList(Array.isArray(data.order) ? data.order : []));
                setSettingsList(buildSettingsList(Array.isArray(data.settingsOrder) ? data.settingsOrder : []));
                applySettings(data);
              }
              setSave({ status: 'error', message: t('conflictMessage') });
            })
            .catch(function () {
              setSave({ status: 'error', message: t('conflictMessage') });
            });
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
          var sGap = Number(fields.settingsGap);
          var validLayout = LAYOUT_VALUES.indexOf(fields.layout) !== -1;
          var validAlign = ALIGN_VALUES.indexOf(fields.align) !== -1;
          var validSLayout = SETTINGS_LAYOUT_VALUES.indexOf(fields.settingsLayout) !== -1;
          var validSAlign = SETTINGS_ALIGN_VALUES.indexOf(fields.settingsAlign) !== -1;
          if (!validLayout || !validAlign || !Number.isFinite(gap) || gap < 0 ||
              !validSLayout || !validSAlign || !Number.isFinite(sGap) || sGap < 0) {
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
              settingsLayout: fields.settingsLayout,
              settingsGap: sGap,
              settingsAlign: fields.settingsAlign,
              settingsOrder: settingsList,
              expectedRevision: revisionRef.current,
            }),
          })
            .then(function (res) {
              return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
            })
            .then(function (result) {
              if (result.status === 409) {
                handleConflict();
                return;
              }
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
            body: JSON.stringify({ reset: true, expectedRevision: revisionRef.current }),
          })
            .then(function (res) {
              return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
            })
            .then(function (result) {
              if (result.status === 409) {
                handleConflict();
                return;
              }
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

        var cardStyle = { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', borderRadius: '12px', listStyle: 'none' };
        var headerStyle = { appearance: 'none', width: '100%', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', background: '0 0', border: '0', borderRadius: '12px', alignItems: 'center', gap: '12px', padding: '14px 16px', display: 'flex' };
        var bodyStyle = { borderTop: '1px solid var(--dsw-alias-border-l2)', margin: '0 16px', padding: '12px 0 8px' };
        var fieldStyle = { flexDirection: 'column', gap: '4px', padding: '8px 0', display: 'flex' };
        var rowStyle = { alignItems: 'center', gap: '8px', display: 'flex' };
        var labelStyle = { minWidth: '0', color: 'var(--dsw-alias-label-primary)', flex: '1', fontSize: '13px', fontWeight: '500', lineHeight: '1.5' };
        var hintStyle = { color: 'var(--dsw-alias-label-tertiary)', margin: '0', fontSize: '12px', lineHeight: '1.5' };
        var hostInputClass = hostInputClassName();
        var inputStyle = { background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px', height: '34px', padding: '0 12px', fontSize: '13px', lineHeight: '1.5', minWidth: '0', width: '100%', boxSizing: 'border-box' };
        var inputLayoutStyle = { width: '100%', boxSizing: 'border-box' };
        var groupStyle = { display: 'flex', flexWrap: 'wrap', gap: '8px' };

        function optionButtonStyle(active) {
          return {
            appearance: 'none', font: 'inherit', cursor: 'pointer',
            border: '1px solid ' + (active ? 'var(--dsw-alias-button-primary-fill, #4f6ef7)' : 'var(--dsw-alias-border-l2)'),
            borderRadius: '8px', padding: '6px 12px', fontSize: '13px', lineHeight: '1.5',
            fontWeight: active ? '500' : '400',
            background: active ? 'var(--dsw-alias-button-primary-fill, #4f6ef7)' : 'transparent',
            color: active ? 'var(--dsw-alias-label-primary-inverted, #fff)' : 'var(--dsw-alias-label-secondary)',
          };
        }
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

        var settingsRowStyle = Object.assign({}, idStyle, { fontStyle: 'italic', color: 'var(--dsw-alias-label-secondary)' });
        var orderRows = list.map(function (id, index) {
          // The reserved id only reads as the settings row while no real entry
          // is registered under it.
          var isSettings = id === SETTINGS_ITEM_ID && knownIds().indexOf(id) === -1;
          return react.createElement('div', { key: id, style: rowStyle },
            react.createElement('span', {
              style: isSettings ? settingsRowStyle : idStyle,
              title: isSettings ? SETTINGS_ITEM_ID + ' (' + SETTINGS_SLOT_KEY + ')' : id,
            }, isSettings ? t('settingsRow') : id),
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

        function settingsItemLabel(id) {
          if (id === 'settings') return t('settingsItemTrigger');
          if (id === 'connection') return t('settingsItemConnection');
          return id;
        }

        var settingsOrderRows = settingsList.map(function (id, index) {
          return react.createElement('div', { key: id, style: rowStyle },
            react.createElement('span', {
              style: idStyle,
              title: id,
            }, settingsItemLabel(id)),
            react.createElement('button', {
              type: 'button',
              style: index === 0 ? Object.assign({}, moveButtonStyle, disabledStyle) : moveButtonStyle,
              disabled: index === 0,
              'aria-label': t('moveUp'),
              onClick: function () { moveSettings(index, -1); },
            }, '\u2191'),
            react.createElement('button', {
              type: 'button',
              style: index === settingsList.length - 1 ? Object.assign({}, moveButtonStyle, disabledStyle) : moveButtonStyle,
              disabled: index === settingsList.length - 1,
              'aria-label': t('moveDown'),
              onClick: function () { moveSettings(index, 1); },
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
            // ── Footer action slot arrangement ──────────────────────────────
            react.createElement('div', { style: fieldStyle },
              react.createElement('span', { style: labelStyle }, t('layoutLabel')),
              react.createElement('div', { role: 'group', 'aria-label': t('layoutLabel'), style: groupStyle },
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.layout === 'column',
                  style: optionButtonStyle(fields.layout === 'column'),
                  onClick: function () { setField('layout', 'column'); }
                }, t('layoutColumn')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.layout === 'row',
                  style: optionButtonStyle(fields.layout === 'row'),
                  onClick: function () { setField('layout', 'row'); }
                }, t('layoutRow')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.layout === 'contents',
                  style: optionButtonStyle(fields.layout === 'contents'),
                  onClick: function () { setField('layout', 'contents'); }
                }, t('layoutContents'))
              ),
              react.createElement('p', { style: hintStyle }, t('layoutHint'))
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle, htmlFor: 'dfo-gap' }, t('gapLabel')),
              react.createElement('input', {
                id: 'dfo-gap',
                type: 'number',
                min: 0,
                step: 1,
                className: hostInputClass || undefined,
                style: hostInputClass ? inputLayoutStyle : inputStyle,
                value: fields.gap,
                onChange: function (e) { setField('gap', e.target.value); }
              })
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('span', { style: labelStyle }, t('alignLabel')),
              react.createElement('div', { role: 'group', 'aria-label': t('alignLabel'), style: groupStyle },
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.align === 'stretch',
                  style: optionButtonStyle(fields.align === 'stretch'),
                  onClick: function () { setField('align', 'stretch'); }
                }, t('alignStretch')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.align === 'start',
                  style: optionButtonStyle(fields.align === 'start'),
                  onClick: function () { setField('align', 'start'); }
                }, t('alignStart')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.align === 'center',
                  style: optionButtonStyle(fields.align === 'center'),
                  onClick: function () { setField('align', 'center'); }
                }, t('alignCenter')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.align === 'end',
                  style: optionButtonStyle(fields.align === 'end'),
                  onClick: function () { setField('align', 'end'); }
                }, t('alignEnd'))
              )
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle }, t('orderLabel')),
              orderRows.length > 0 ? react.createElement('div', { style: { flexDirection: 'column', gap: '4px', display: 'flex' } }, orderRows)
                : react.createElement('p', { style: hintStyle }, t('orderEmpty')),
              react.createElement('p', { style: hintStyle }, t('orderHint'))
            ),

            // ── Settings area arrangement ───────────────────────────────────
            react.createElement('div', { style: { borderTop: '1px solid var(--dsw-alias-border-l2)', margin: '14px 0 6px', paddingTop: '12px' } },
              react.createElement('span', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', fontWeight: '600', lineHeight: '1.4' } }, t('settingsAreaGroup')),
              react.createElement('p', { style: hintStyle }, t('settingsAreaGroupHint'))
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('span', { style: labelStyle }, t('settingsLayoutLabel')),
              react.createElement('div', { role: 'group', 'aria-label': t('settingsLayoutLabel'), style: groupStyle },
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsLayout === 'row',
                  style: optionButtonStyle(fields.settingsLayout === 'row'),
                  onClick: function () { setField('settingsLayout', 'row'); }
                }, t('settingsLayoutRow')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsLayout === 'column',
                  style: optionButtonStyle(fields.settingsLayout === 'column'),
                  onClick: function () { setField('settingsLayout', 'column'); }
                }, t('settingsLayoutColumn')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsLayout === 'row-reverse',
                  style: optionButtonStyle(fields.settingsLayout === 'row-reverse'),
                  onClick: function () { setField('settingsLayout', 'row-reverse'); }
                }, t('settingsLayoutRowReverse')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsLayout === 'column-reverse',
                  style: optionButtonStyle(fields.settingsLayout === 'column-reverse'),
                  onClick: function () { setField('settingsLayout', 'column-reverse'); }
                }, t('settingsLayoutColumnReverse')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsLayout === 'contents',
                  style: optionButtonStyle(fields.settingsLayout === 'contents'),
                  onClick: function () { setField('settingsLayout', 'contents'); }
                }, t('settingsLayoutContents'))
              ),
              react.createElement('p', { style: hintStyle }, t('settingsLayoutHint'))
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle, htmlFor: 'dfo-settings-gap' }, t('settingsGapLabel')),
              react.createElement('input', {
                id: 'dfo-settings-gap',
                type: 'number',
                min: 0,
                step: 1,
                className: hostInputClass || undefined,
                style: hostInputClass ? inputLayoutStyle : inputStyle,
                value: fields.settingsGap,
                onChange: function (e) { setField('settingsGap', e.target.value); }
              })
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('span', { style: labelStyle }, t('settingsAlignLabel')),
              react.createElement('div', { role: 'group', 'aria-label': t('settingsAlignLabel'), style: groupStyle },
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsAlign === 'center',
                  style: optionButtonStyle(fields.settingsAlign === 'center'),
                  onClick: function () { setField('settingsAlign', 'center'); }
                }, t('settingsAlignCenter')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsAlign === 'stretch',
                  style: optionButtonStyle(fields.settingsAlign === 'stretch'),
                  onClick: function () { setField('settingsAlign', 'stretch'); }
                }, t('settingsAlignStretch')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsAlign === 'start',
                  style: optionButtonStyle(fields.settingsAlign === 'start'),
                  onClick: function () { setField('settingsAlign', 'start'); }
                }, t('settingsAlignStart')),
                react.createElement('button', {
                  type: 'button',
                  className: 'dfo-option',
                  'aria-pressed': fields.settingsAlign === 'end',
                  style: optionButtonStyle(fields.settingsAlign === 'end'),
                  onClick: function () { setField('settingsAlign', 'end'); }
                }, t('settingsAlignEnd'))
              )
            ),
            react.createElement('div', { style: fieldStyle },
              react.createElement('label', { style: labelStyle }, t('settingsOrderLabel')),
              settingsOrderRows.length > 0 ? react.createElement('div', { style: { flexDirection: 'column', gap: '4px', display: 'flex' } }, settingsOrderRows) : null,
              react.createElement('p', { style: hintStyle }, t('settingsOrderHint'))
            ),

            // ── Save & Reset actions ─────────────────────────────────────────
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
      // Settings → Plugins → configurable card (0.1.2: keyed-kind slot).
      slots.inject('settings.plugin.item', function () {
        return slots.register(
          {
            name: 'settings.plugin.item',
            key: 'footer-order',
            locale: 'footer-order',
          },
          function (props) {
            var t = (props && props.t) || ctx.locale.bind('footer-order');
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
