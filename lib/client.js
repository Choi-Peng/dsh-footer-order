// AI 生成声明:本插件代码由 AI 生成,可能存在错误或安全隐患,使用前请 review 并实测。
// dsh-footer-order — Client half (dsh 0.2 generation)
// Forces the sidebar footer action slot anchor (`div[data-slot=sidebar.footer.action]`,
// which the web-react renderer gives `display: contents`) into a vertical flex
// stack so multiple footer plugins no longer squeeze into one row, and
// reorders the rendered entries to match the configured top-to-bottom order.
//
// Settings ride the dsh 0.2 config model: the Host half exports a schemastery
// `Config` whose volatile fields the settings seam projects, and the browser
// reaches them through `ctx.configForms` — one shared controller per Loader
// entry, whose snapshot carries the effective value (schema defaults → bundle
// patch base → profile patch user layer), the revision, the user-layer
// overrides, and writability. Writes go through `form.mutate(ops)`, which the
// provider serializes and folds back into the shared describe mirror, so the
// sidebar and the settings surfaces read one document and an accepted save
// reaches both without a poll or a page reload.
//
// Two settings surfaces are contributed:
//   1. `plugins.bundle.config` — the settings section on this bundle's own page
//      in Settings → Plugins, keyed by the package name.
//   2. `plugins.row.config` — the editable page the Plugins page dispatches for
//      this bundle's `footer-order` row, keyed by `<package name>#<row id>`.
//
// The namespace is the Loader ENTRY id, which this bundle's own patch fixes to
// `footer-order`.
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
//
// The settings-area arrangement owns the WHOLE `div.settingsArea` block, not
// just the `sidebar.settings` outlet inside it: the area is a container the
// shell shares with other plugins, and 0.2.1's shell hands it to whoever
// appends to it. @zhengjunyao/dsh-restart, for instance, appends its own
// `.dsh-sidebar-row` as the area's last child. Arranging only the outlet
// would leave those injected blocks outside every control, so the plugin
// treats the area itself as the container:
//
//   items = the area's in-flow element children, descending through outlet
//   anchors (the renderer gives them `display: contents`, so their children
//   are the real flex items).
//
// The shell's settings block is detected structurally (it contains the
// settings launcher or the `aria-haspopup="dialog"` trigger) and keyed
// `settings`; every other block is keyed from its own identity (`id`,
// `data-plugin`, `data-slot`, then its first class token), so a configured
// `settingsOrder` survives restarts for as long as the plugin's own DOM does.
//
// Ordering inside the area is applied ONLY as an inline `order` declaration
// with `!important` — never by moving nodes. Flex lays items out by CSS
// `order` first, DOM order second, so the inline pin wins over any foreign
// stylesheet rule, and leaving the DOM alone keeps plugins that re-assert
// their own placement from fighting this one: dsh-restart's observer
// re-appends its row whenever `area.lastElementChild` is not that row, so a
// node move here would ping-pong forever.
window.__ModuleLoader__.load({
  id: '@choi-p/dsh-footer-order',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var react = require('react');

    /** Required client services. `configForms` is the browser face of the settings seam. */
    var inject = ['slots', 'locale', 'configForms'];

    /** Settings namespace: the Loader entry id this bundle's patch inserts. */
    var NS = 'footer-order';
    /** `plugins.bundle.config` key: the npm package name the bundle page opens. */
    var BUNDLE_KEY = '@choi-p/dsh-footer-order';
    /** `plugins.row.config` cell key: `<package name>#<row id>`. */
    var ROW_KEY = '@choi-p/dsh-footer-order#footer-order';

    var en = {
      cardTitle: 'Sidebar Footer Order',
      cardDescription: 'Stacks sidebar footer actions vertically and controls their top-to-bottom order.',
      summary: 'Vertical footer stacking, top-to-bottom entry order, and settingsArea arrangement.',
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
      settingsAreaGroupHint: 'Controls the whole settingsArea block (settings trigger, connection status, and anything another plugin injects into the area) — its layout, spacing, alignment, and block order.',
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
      settingsOrderLabel: 'Settings area block order',
      settingsOrderHint: 'Orders the blocks inside settingsArea — the shell\'s settings row and any row a plugin injects into the area (e.g. dsh-restart). Blocks left out keep their default order and sit after the listed ones.',
      settingsItemRow: 'Settings row (settings button · connection status)',
      moveUp: 'Move up',
      moveDown: 'Move down',
      saveLabel: 'Save',
      resetLabel: 'Reset to defaults',
      savingStatus: 'Saving…',
      savedStatus: 'Saved — applies immediately.',
      invalidFields: 'Invalid value(s) for:',
      saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
      loadingStatus: 'Loading settings…',
      unavailableStatus: 'These settings are not served by this deployment right now.',
      readOnlyStatus: 'This deployment stores settings read-only.',
      configSource: 'These values are this bundle\'s row in the profile patch document, edited through the dsh settings service: saved fields apply immediately and need no restart. Reset clears the overrides and falls back to the bundle defaults.',
      unknownEntry: '(not registered)',
    };
    var zh = {
      cardTitle: '侧边栏底部排序',
      cardDescription: '将侧边栏底部的条目改为上下排列,并控制它们的先后顺序。',
      summary: '页脚竖向堆叠、条目上下排序,以及设置区内部排列管理。',
      layoutLabel: '排列方式',
      layoutHint: '上下排列可修复挤成一行的问题;也可以改为左右排列,或保持默认不干预。',
      layoutColumn: '上下排列',
      layoutRow: '左右排列',
      layoutContents: '不干预',
      gapLabel: '条目间距(px)',
      alignLabel: '对齐方式',
      alignStretch: '拉伸(占满宽度)',
      alignStart: '顶部对齐',
      alignCenter: '居中',
      alignEnd: '底部对齐',
      orderLabel: '上下顺序(自上而下)',
      orderHint: '未列出的条目保持默认注册顺序,排在已列出的条目之后。',
      orderEmpty: '还没有注册任何页脚插件。',
      settingsRow: '设置行',
      settingsAreaGroup: '设置区排列管理',
      settingsAreaGroupHint: '控制整个设置区(设置行，以及其它插件注入到该区域的内容，例如重启插件的条目行)的排列方式、间距、对齐与前后顺序。',
      settingsLayoutLabel: '设置区排列方式',
      settingsLayoutHint: '左右横向、上下纵向、反向排列，或保持默认不干预。',
      settingsLayoutRow: '左右排列',
      settingsLayoutColumn: '上下排列',
      settingsLayoutRowReverse: '左右反向',
      settingsLayoutColumnReverse: '上下反向',
      settingsLayoutContents: '不干预',
      settingsGapLabel: '设置区间距(px)',
      settingsAlignLabel: '设置区对齐方式',
      settingsAlignStretch: '拉伸',
      settingsAlignStart: '起始对齐',
      settingsAlignCenter: '居中对齐',
      settingsAlignEnd: '结束对齐',
      settingsOrderLabel: '设置区内部顺序',
      settingsOrderHint: '按块排列设置区内的内容：外壳的设置行，以及其它插件注入到该区域的条目行。未列出的块保持默认顺序，排在已列出的块之后。',
      settingsItemRow: '设置行(设置按钮 · 连接状态)',
      moveUp: '上移',
      moveDown: '下移',
      saveLabel: '保存',
      resetLabel: '恢复默认',
      savingStatus: '保存中…',
      savedStatus: '已保存,立即生效。',
      invalidFields: '以下字段的值不合法:',
      saveFailed: '本部署没有接受这些值,已保留供你修改。',
      loadingStatus: '正在读取设置…',
      unavailableStatus: '本部署当前没有提供这些设置。',
      readOnlyStatus: '本部署的设置为只读。',
      configSource: '这些值就是插件配置文档中本插件的配置行,经 dsh 设置服务读写:保存后立即生效,无需重启;恢复默认会清除覆盖值并回落到插件自带默认值。',
      unknownEntry: '(未注册)',
    };

    /** The sidebar footer action slot this plugin targets. */
    var SLOT_KEY = 'sidebar.footer.action';
    /** The sidebar settings slot: rendered inside the shell's `settingsArea` div. */
    var SETTINGS_SLOT_KEY = 'sidebar.settings';
    /** Reserved `order` id standing for the shell's settings row (settingsArea). */
    var SETTINGS_ITEM_ID = 'settings';
    /**
     * Marker this plugin puts on the shell's `div.settingsArea`, so the stylesheet
     * can target it without the build-hashed CSS-module class.
     */
    var SETTINGS_AREA_ATTR = 'data-dfo-settings-area';
    /** Per-item marker carrying the key a block is ordered by inside the area. */
    var SETTINGS_ITEM_ATTR = 'data-dfo-settings-item';
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
      // The whole `div.settingsArea` block is the container: the shell's
      // settings row and anything another plugin appends to the area (e.g.
      // dsh-restart's `.dsh-sidebar-row`) are its items. The marker attribute
      // is set from JS (see `syncSettingsArea`) because the class is hashed.
      var sLayout = cfg.settingsLayout;
      if (SETTINGS_LAYOUT_VALUES.indexOf(sLayout) === -1) sLayout = 'contents';
      if (sLayout !== 'contents') {
        var sGap = typeof cfg.settingsGap === 'number' && cfg.settingsGap >= 0 ? cfg.settingsGap : 8;
        var sAlign = alignKeyword(cfg.settingsAlign || 'center');
        var areaSel = '[' + SETTINGS_AREA_ATTR + '="1"]';
        // Two composed selectors, built so the attribute VALUE stays inside the
        // brackets: `[attr]="x"` is not an attribute match, it is an invalid
        // selector, and a browser drops the whole rule that carries it.
        var settingsItemSel = '[' + SETTINGS_ITEM_ATTR + '="' + SETTINGS_ITEM_ID + '"]';
        var otherItemSel = '[' + SETTINGS_ITEM_ATTR + ']:not(' + settingsItemSel + ')';

        lines.push(
          areaSel + '{' +
          'display:flex !important;' +
          'flex-direction:' + sLayout + ' !important;' +
          'align-items:' + sAlign + ' !important;' +
          'gap:' + sGap + 'px !important;' +
          'box-sizing:border-box !important;' +
          'max-width:100% !important;' +
          '}'
        );
        // The shell's settings row normally claims the full width
        // (`width:calc(100% + 4px)` with `-2px` side margins, so it bleeds into
        // the sidebar padding); as one item of the shared line it must instead
        // take exactly the space that is left, and lose the bleed.
        lines.push(
          areaSel + ' ' + settingsItemSel + '{' +
          'flex:1 1 auto !important;' +
          'width:auto !important;' +
          'min-width:0 !important;' +
          'max-width:100% !important;' +
          'margin:0 !important;' +
          '}'
        );
        // Injected blocks keep their intrinsic size, so they read as one
        // compact cluster at the end of the line rather than stretching — but
        // they may still shrink, and never exceed the area: a block whose own
        // stylesheet says `width:100%` (dsh-restart's row says
        // `flex:1 1 auto; min-width:0`) would otherwise push the line past the
        // settingsArea and get itself clipped to zero on the way.
        lines.push(
          areaSel + ' ' + otherItemSel + '{' +
          'flex:0 1 auto !important;' +
          'min-width:0 !important;' +
          'max-width:100% !important;' +
          'box-sizing:border-box !important;' +
          '}'
        );
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
        // Settings-area blocks whose inline `order` this plugin pinned. Only
        // these are ever cleared again — an injected block may carry its own
        // inline order, and the plugin must not wipe a foreign declaration.
        pinnedItems: [],
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
      // this plugin had moved it into the footer column, and release every
      // settings-area pin (attribute + inline order) this plugin added.
      ctx.effect(function () {
        return function () {
          try {
            var anchor = findAnchor();
            var settings = findSettingsBlock();
            if (anchor && settings && settings.parentElement === anchor) {
              var area = footAreaOf(anchor);
              if (area) area.appendChild(settings);
            }
            clearSettingsAreaPins();
            var settingsArea = findSettingsArea();
            if (settingsArea) settingsArea.removeAttribute(SETTINGS_AREA_ATTR);
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

      /** The settings-area container itself — the block this plugin arranges. */
      function findSettingsArea() {
        return findSettingsBlock();
      }

      /**
       * Whether a node is out of flow (`position: fixed` / `absolute`), i.e. a
       * child the flex layout does not place: the settings panel and the
       * onboarding outlet render inside the outlet anchor this way, and they
       * must never be treated as area items.
       */
      function isOutOfFlow(el) {
        var inline = el.style ? el.style.position : '';
        if (inline === 'fixed' || inline === 'absolute') return true;
        try {
          if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
            var position = window.getComputedStyle(el).position;
            return position === 'fixed' || position === 'absolute';
          }
        } catch (err) { /* treat as in flow */ }
        return false;
      }

      /**
       * Whether a child is chrome rather than a block: out of flow, or a modal
       * surface (`role="dialog"` / `aria-modal`) that the shell renders inline
       * when it is open. Neither belongs in the area's item list.
       */
      function isOverlay(el) {
        if (isOutOfFlow(el)) return true;
        if (!el.getAttribute) return false;
        return el.getAttribute('role') === 'dialog' || el.getAttribute('aria-modal') === 'true';
      }

      /**
       * The area's in-flow items. Outlet anchors are `display: contents`, so
       * their children ARE the area's flex items and the walk descends through
       * them; every other in-flow child is an item of its own — which is how a
       * block another plugin appends to the area (dsh-restart's
       * `.dsh-sidebar-row`) becomes arrangeable.
       */
      function settingsAreaItems() {
        var area = findSettingsArea();
        var out = [];
        if (!area) return out;
        collectSettingsItems(area, out);
        return out;
      }

      function collectSettingsItems(parent, out) {
        var children = parent.children || [];
        for (var i = 0; i < children.length; i += 1) {
          var child = children[i];
          if (!child || child.nodeType === 3) continue; // text nodes are not items
          if (child.getAttribute && child.getAttribute('data-slot')) {
            collectSettingsItems(child, out); // display: contents outlet anchor
            continue;
          }
          if (isOverlay(child)) continue;
          out.push(child);
        }
      }

      /**
       * Stable key for one settings-area item. The shell's settings row is
       * detected structurally — it holds the settings launcher outlet or the
       * `aria-haspopup="dialog"` trigger — so it keeps the reserved key
       * `settings` across shell revisions. Any other block is keyed by its own
       * identity: `id`, then `data-plugin`, then `data-slot`, then its first
       * class token, and only a structure-less node falls back to its position.
       */
      function settingsItemKey(el, index) {
        if (!el) return 'item-' + (index + 1);
        var hasLauncher =
          typeof el.querySelector === 'function' &&
          (el.querySelector('[data-slot="settings.launcher"]') !== null ||
            el.querySelector('button[aria-haspopup="dialog"]') !== null);
        var isTrigger =
          (el.tagName === 'BUTTON' && el.getAttribute('aria-haspopup') === 'dialog') || hasLauncher;
        if (isTrigger) return SETTINGS_ITEM_ID;
        if (el.id) return el.id;
        var plugin = el.getAttribute ? el.getAttribute('data-plugin') : null;
        if (plugin) return 'plugin:' + plugin;
        var slot = el.getAttribute ? el.getAttribute('data-slot') : null;
        if (slot) return 'slot:' + slot;
        var cls = typeof el.className === 'string' ? el.className : '';
        var token = cls.trim().split(/\s+/)[0];
        if (token) return 'class:' + token;
        return 'item-' + (index + 1);
      }

      /**
       * The area's items with their keys, de-duplicated (`key`, then `key#2`,
       * …) so two blocks that look alike stay separately orderable.
       */
      function settingsItemsKeyed() {
        var items = settingsAreaItems();
        var seen = {};
        var out = [];
        for (var i = 0; i < items.length; i += 1) {
          var key = settingsItemKey(items[i], i);
          var count = seen[key] || 0;
          seen[key] = count + 1;
          out.push({ el: items[i], key: count === 0 ? key : key + '#' + (count + 1) });
        }
        return out;
      }

      /** Release every inline `order` this plugin pinned inside the area. */
      function clearSettingsAreaPins() {
        for (var i = 0; i < state.pinnedItems.length; i += 1) {
          try { state.pinnedItems[i].style.order = ''; } catch (err) { /* detached */ }
        }
        state.pinnedItems = [];
      }

      /**
       * Mark the area and arrange it: publish each item's key on the element so
       * the stylesheet can size it, then pin the configured sequence as inline
       * `order` values. Only `order` is written — nodes are never moved, because
       * plugins that re-assert their own placement (dsh-restart re-appends its
       * row whenever it is not the area's last child) would otherwise trade
       * moves with this one forever.
       */
      function syncSettingsArea() {
        var area = findSettingsArea();
        if (!area) return;
        if (area.getAttribute(SETTINGS_AREA_ATTR) !== '1') area.setAttribute(SETTINGS_AREA_ATTR, '1');

        var items = settingsItemsKeyed();
        for (var m = 0; m < items.length; m += 1) {
          if (items[m].el.getAttribute(SETTINGS_ITEM_ATTR) !== items[m].key) {
            items[m].el.setAttribute(SETTINGS_ITEM_ATTR, items[m].key);
          }
        }

        // Rebuild the pins from scratch: an element that disappeared (or was
        // re-keyed) must not leave a stale order behind.
        clearSettingsAreaPins();

        var order = state.config.settingsOrder || [];
        if (order.length === 0) return; // no configured order: the area keeps its own

        var seq = [];
        var placed = {};
        for (var c = 0; c < order.length; c += 1) {
          var key = order[c];
          if (placed[key]) continue;
          for (var i = 0; i < items.length; i += 1) {
            if (items[i].key === key) {
              placed[key] = true;
              seq.push(items[i].el);
              break;
            }
          }
        }
        for (var r = 0; r < items.length; r += 1) {
          if (!placed[items[r].key]) {
            placed[items[r].key] = true;
            seq.push(items[r].el);
          }
        }
        for (var p = 0; p < seq.length; p += 1) {
          seq[p].style.setProperty('order', String(p), 'important');
          state.pinnedItems.push(seq[p]);
        }
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
        // The settings area is its own container with its own items (the shell's
        // settings row plus anything another plugin appends there), so it is
        // arranged even when no footer entry is registered at all.
        try { syncSettingsArea(); } catch (err) { /* best effort */ }

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
      // One shared controller per Loader entry: `getSnapshot()` carries the
      // effective value (schema defaults → bundle patch base → profile patch
      // user layer), and `subscribe()` fires when the seam folds a write back
      // into the describe mirror — so the sidebar follows a save with no poll.
      var form = ctx.configForms.get(NS);
      // The mirror may have been read before this entry was active; one explicit
      // read settles the initial state instead of leaving it `unavailable`
      // until some unrelated invalidation arrives.
      ctx.configForms.describe().load();

      /** The effective settings object out of a form snapshot. */
      function settingsOf(snapshot) {
        return normalizeConfig(snapshot && snapshot.value);
      }

      /** Apply a fresh effective config: rebuild CSS, re-schedule reorder. */
      function applySettings(data) {
        var next = normalizeConfig(data);
        if (!sameConfig(state.config, next)) {
          state.config = next;
          applyCss();
          schedule();
        }
      }

      ctx.effect(function () {
        function sync() {
          applySettings(settingsOf(form.getSnapshot()));
        }
        sync();
        var offForm = form.subscribe(sync);
        var offSlots = null;
        try { offSlots = slots.subscribe(SLOT_KEY, schedule); } catch (err) { /* slot not yet declared */ }
        return function () {
          offForm();
          if (offSlots) offSlots();
        };
      }, 'footer-order: settings sync');

      /** Subscribe a component to the shared settings snapshot. */
      function useSettingsSnapshot() {
        var pair = react.useState(function () { return form.getSnapshot(); });
        var snapshot = pair[0];
        var setSnapshot = pair[1];
        react.useEffect(function () {
          setSnapshot(form.getSnapshot());
          return form.subscribe(function () { setSnapshot(form.getSnapshot()); });
        }, []);
        return snapshot;
      }

      // ── settings form helpers ───────────────────────────────────────────────
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
        var config = Array.isArray(orderConfig) ? orderConfig : [];
        var listed = [];
        var set = {};
        for (var i = 0; i < config.length; i += 1) {
          var id = config[i];
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

      /**
       * Known settings-area item keys, in the area's current DOM order. The
       * shell's settings row always leads (the editor must stay usable while the
       * sidebar is still mounting); each block another plugin appended follows
       * under its own key.
       */
      function knownSettingsIds() {
        var ids = [SETTINGS_ITEM_ID];
        try {
          var items = settingsItemsKeyed();
          for (var i = 0; i < items.length; i += 1) {
            if (/^item-\d+$/.test(items[i].key)) continue; // no stable identity
            if (ids.indexOf(items[i].key) === -1) ids.push(items[i].key);
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

      /** The editable input state for one effective settings object. */
      function toFields(settings) {
        return {
          layout: settings.layout,
          gap: String(settings.gap),
          align: settings.align,
          settingsLayout: settings.settingsLayout,
          settingsGap: String(settings.settingsGap),
          settingsAlign: settings.settingsAlign,
        };
      }

      /** Whether a snapshot holds user-layer overrides a reset could clear. */
      function snapshotHasOverrides(snapshot) {
        var user = snapshot && snapshot.user;
        return !!user && typeof user === 'object' && Object.keys(user).length > 0;
      }

      /** Display label for one settingsArea item key. */
      function settingsItemLabel(id, t) {
        if (id === SETTINGS_ITEM_ID) return t('settingsItemRow');
        if (id.indexOf('plugin:') === 0) return id.slice(7);
        if (id.indexOf('class:') === 0) return id.slice(6);
        if (id.indexOf('slot:') === 0) return id.slice(5);
        return id;
      }

      /** One segmented option button; the active one mirrors the primary fill. */
      function optionButton(args) {
        return react.createElement('button', {
          type: 'button',
          className: 'dfo-option',
          disabled: !args.writable,
          'aria-pressed': args.active,
          style: args.styleOf(args.active),
          onClick: function () { args.onPick(args.field, args.value); },
        }, args.t(args.labelKey));
      }

      /** One ↑/↓ reorder control (disabled at the inaccessible end). */
      function moveButton(args) {
        return react.createElement('button', {
          type: 'button',
          style: args.disabled ? Object.assign({}, args.baseStyle, args.dimStyle) : args.baseStyle,
          disabled: args.disabled,
          'aria-label': args.ariaLabel,
          onClick: args.onClick,
        }, args.glyph);
      }

      function FooterOrderForm(props) {
        var t = props.t;
        var snapshot = useSettingsSnapshot();
        var effective = settingsOf(snapshot);
        var writable = !!(snapshot && snapshot.writable !== false);
        var dirtyRef = react.useRef(false);
        var fieldsState = react.useState(function () { return toFields(effective); });
        var fields = fieldsState[0];
        var setFields = fieldsState[1];
        var listState = react.useState(function () { return buildList(effective.order); });
        var list = listState[0];
        var setList = listState[1];
        var settingsListState = react.useState(function () { return buildSettingsList(effective.settingsOrder); });
        var settingsList = settingsListState[0];
        var setSettingsList = settingsListState[1];
        var statusState = react.useState({ kind: 'idle', message: '' });
        var status = statusState[0];
        var setStatus = statusState[1];

        // Follow the shared document: re-seed the editors whenever the effective
        // value moves, but never clobber in-progress edits.
        react.useEffect(function () {
          if (dirtyRef.current) return;
          var next = settingsOf(snapshot);
          setFields(toFields(next));
          setList(buildList(next.order));
          setSettingsList(buildSettingsList(next.settingsOrder));
        }, [snapshot.value, snapshot.revision]);

        // Registered footer entries change without a settings write (a footer
        // plugin mounting or unmounting later), so the order editor follows the
        // slot registry too.
        react.useEffect(function () {
          var off = null;
          try {
            off = slots.subscribe(SLOT_KEY, function () {
              if (dirtyRef.current) return;
              var next = settingsOf(form.getSnapshot());
              setList(buildList(next.order));
              setSettingsList(buildSettingsList(next.settingsOrder));
            });
          } catch (err) { /* slot not declared yet */ }
          return function () {
            if (off) off();
          };
        }, []);

        function setField(field, value) {
          dirtyRef.current = true;
          setStatus({ kind: 'idle', message: '' });
          setFields(function (prev) {
            var next = {};
            for (var key in prev) next[key] = prev[key];
            next[field] = value;
            return next;
          });
        }

        function move(index, delta) {
          dirtyRef.current = true;
          setStatus({ kind: 'idle', message: '' });
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
          setStatus({ kind: 'idle', message: '' });
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

        /** Queue one atomic write; the controller fences it with the revision. */
        function write(ops) {
          setStatus({ kind: 'saving', message: '' });
          form.mutate(ops).then(function (ok) {
            if (!ok) {
              setStatus({ kind: 'error', message: t('saveFailed') });
              return;
            }
            dirtyRef.current = false;
            setStatus({ kind: 'saved', message: '' });
          }, function () {
            setStatus({ kind: 'error', message: t('saveFailed') });
          });
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
            setStatus({ kind: 'error', message: t('invalidFields') + ' ' + t('cardTitle') });
            return;
          }
          write([
            { op: 'set', path: ['layout'], value: fields.layout },
            { op: 'set', path: ['gap'], value: gap },
            { op: 'set', path: ['align'], value: fields.align },
            { op: 'set', path: ['order'], value: list },
            { op: 'set', path: ['settingsLayout'], value: fields.settingsLayout },
            { op: 'set', path: ['settingsGap'], value: sGap },
            { op: 'set', path: ['settingsAlign'], value: fields.settingsAlign },
            { op: 'set', path: ['settingsOrder'], value: settingsList },
          ]);
        }

        function onReset() {
          write([
            { op: 'unset', path: ['layout'] },
            { op: 'unset', path: ['gap'] },
            { op: 'unset', path: ['align'] },
            { op: 'unset', path: ['order'] },
            { op: 'unset', path: ['settingsLayout'] },
            { op: 'unset', path: ['settingsGap'] },
            { op: 'unset', path: ['settingsAlign'] },
            { op: 'unset', path: ['settingsOrder'] },
          ]);
        }

        var fieldStyle = { flexDirection: 'column', gap: '4px', padding: '8px 0', display: 'flex' };
        var rowStyle = { alignItems: 'center', gap: '8px', display: 'flex' };
        var labelStyle = { minWidth: '0', color: 'var(--dsw-alias-label-primary)', flex: '1', fontSize: '13px', fontWeight: '500', lineHeight: '1.5' };
        var hintStyle = { color: 'var(--dsw-alias-label-tertiary)', margin: '0', fontSize: '12px', lineHeight: '1.5' };
        var inputStyle = { background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px', height: '34px', padding: '0 12px', fontSize: '13px', lineHeight: '1.5', minWidth: '0', width: '100%', boxSizing: 'border-box' };
        var groupStyle = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
        var saveButtonStyle = { background: 'var(--dsw-alias-button-primary-fill, #4f6ef7)', color: 'var(--dsw-alias-label-primary-inverted, #fff)', border: '0', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' };
        var ghostButtonStyle = { background: 'transparent', color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' };
        var moveButtonStyle = { background: 'transparent', color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer', flex: 'none' };
        var idStyle = { color: 'var(--dsw-alias-label-primary)', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1' };
        var settingsRowStyle = Object.assign({}, idStyle, { fontStyle: 'italic', color: 'var(--dsw-alias-label-secondary)' });
        var disabledStyle = { opacity: 0.5, cursor: 'default' };
        var statusStyle = { margin: '0', fontSize: '12px', lineHeight: '1.5' };
        var groupHeadingStyle = { borderTop: '1px solid var(--dsw-alias-border-l2)', margin: '14px 0 6px', paddingTop: '12px' };
        var saving = status.kind === 'saving';
        var resettable = snapshotHasOverrides(snapshot) && writable;

        function optionStyle(active) {
          return {
            appearance: 'none', font: 'inherit', cursor: writable ? 'pointer' : 'default',
            border: '1px solid ' + (active ? 'var(--dsw-alias-button-primary-fill, #4f6ef7)' : 'var(--dsw-alias-border-l2)'),
            borderRadius: '8px', padding: '6px 12px', fontSize: '13px', lineHeight: '1.5',
            fontWeight: active ? '500' : '400',
            background: active ? 'var(--dsw-alias-button-primary-fill, #4f6ef7)' : 'transparent',
            color: active ? 'var(--dsw-alias-label-primary-inverted, #fff)' : 'var(--dsw-alias-label-secondary)',
            opacity: writable ? 1 : 0.6,
          };
        }

        /** One option button bound to a form field. */
        function option(field, value, labelKey, active) {
          return optionButton({
            t: t, field: field, value: value, labelKey: labelKey, active: active === value,
            writable: writable, onPick: setField, styleOf: optionStyle,
          });
        }

        /** One ↑/↓ control bound to the footer order list. */
        function moveControl(index, length, delta) {
          var disabled = delta < 0 ? index === 0 : index === length - 1;
          return moveButton({
            glyph: delta < 0 ? '\u2191' : '\u2193',
            ariaLabel: delta < 0 ? t('moveUp') : t('moveDown'),
            disabled: disabled,
            onClick: disabled ? undefined : function () { move(index, delta); },
            baseStyle: moveButtonStyle,
            dimStyle: disabledStyle,
          });
        }

        /** One ↑/↓ control bound to the settingsArea order list. */
        function moveSettingsControl(index, length, delta) {
          var disabled = delta < 0 ? index === 0 : index === length - 1;
          return moveButton({
            glyph: delta < 0 ? '\u2191' : '\u2193',
            ariaLabel: delta < 0 ? t('moveUp') : t('moveDown'),
            disabled: disabled,
            onClick: disabled ? undefined : function () { moveSettings(index, delta); },
            baseStyle: moveButtonStyle,
            dimStyle: disabledStyle,
          });
        }

        if (snapshot && snapshot.status === 'loading') {
          return react.createElement('p', { style: hintStyle }, t('loadingStatus'));
        }
        if (snapshot && snapshot.status === 'unavailable') {
          return react.createElement('p', { style: hintStyle }, t('unavailableStatus'));
        }

        var orderRows = list.map(function (id, index) {
          // The reserved id only reads as the settings row while no real entry
          // is registered under it.
          var isSettings = id === SETTINGS_ITEM_ID && knownIds().indexOf(id) === -1;
          return react.createElement('div', { key: id, style: rowStyle },
            react.createElement('span', {
              style: isSettings ? settingsRowStyle : idStyle,
              title: isSettings ? SETTINGS_ITEM_ID + ' (' + SETTINGS_SLOT_KEY + ')' : id,
            }, isSettings ? t('settingsRow') : id),
            moveControl(index, list.length, -1),
            moveControl(index, list.length, 1)
          );
        });

        var settingsOrderRows = settingsList.map(function (id, index) {
          return react.createElement('div', { key: id, style: rowStyle },
            react.createElement('span', { style: idStyle, title: id }, settingsItemLabel(id, t)),
            moveSettingsControl(index, settingsList.length, -1),
            moveSettingsControl(index, settingsList.length, 1)
          );
        });

        return react.createElement('div', null,
          // ── Footer action slot arrangement ────────────────────────────────
          react.createElement('div', { style: fieldStyle },
            react.createElement('span', { style: labelStyle }, t('layoutLabel')),
            react.createElement('div', { role: 'group', 'aria-label': t('layoutLabel'), style: groupStyle },
              option('layout', 'column', 'layoutColumn', fields.layout),
              option('layout', 'row', 'layoutRow', fields.layout),
              option('layout', 'contents', 'layoutContents', fields.layout)
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
              disabled: !writable,
              style: inputStyle,
              value: fields.gap,
              onChange: function (e) { setField('gap', e.target.value); },
            })
          ),
          react.createElement('div', { style: fieldStyle },
            react.createElement('span', { style: labelStyle }, t('alignLabel')),
            react.createElement('div', { role: 'group', 'aria-label': t('alignLabel'), style: groupStyle },
              option('align', 'stretch', 'alignStretch', fields.align),
              option('align', 'start', 'alignStart', fields.align),
              option('align', 'center', 'alignCenter', fields.align),
              option('align', 'end', 'alignEnd', fields.align)
            )
          ),
          react.createElement('div', { style: fieldStyle },
            react.createElement('label', { style: labelStyle }, t('orderLabel')),
            orderRows.length > 0
              ? react.createElement('div', { style: { flexDirection: 'column', gap: '4px', display: 'flex' } }, orderRows)
              : react.createElement('p', { style: hintStyle }, t('orderEmpty')),
            react.createElement('p', { style: hintStyle }, t('orderHint'))
          ),

          // ── Settings area arrangement ─────────────────────────────────────
          react.createElement('div', { style: groupHeadingStyle },
            react.createElement('span', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', fontWeight: '600', lineHeight: '1.4' } }, t('settingsAreaGroup')),
            react.createElement('p', { style: hintStyle }, t('settingsAreaGroupHint'))
          ),
          react.createElement('div', { style: fieldStyle },
            react.createElement('span', { style: labelStyle }, t('settingsLayoutLabel')),
            react.createElement('div', { role: 'group', 'aria-label': t('settingsLayoutLabel'), style: groupStyle },
              option('settingsLayout', 'row', 'settingsLayoutRow', fields.settingsLayout),
              option('settingsLayout', 'column', 'settingsLayoutColumn', fields.settingsLayout),
              option('settingsLayout', 'row-reverse', 'settingsLayoutRowReverse', fields.settingsLayout),
              option('settingsLayout', 'column-reverse', 'settingsLayoutColumnReverse', fields.settingsLayout),
              option('settingsLayout', 'contents', 'settingsLayoutContents', fields.settingsLayout)
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
              disabled: !writable,
              style: inputStyle,
              value: fields.settingsGap,
              onChange: function (e) { setField('settingsGap', e.target.value); },
            })
          ),
          react.createElement('div', { style: fieldStyle },
            react.createElement('span', { style: labelStyle }, t('settingsAlignLabel')),
            react.createElement('div', { role: 'group', 'aria-label': t('settingsAlignLabel'), style: groupStyle },
              option('settingsAlign', 'center', 'settingsAlignCenter', fields.settingsAlign),
              option('settingsAlign', 'stretch', 'settingsAlignStretch', fields.settingsAlign),
              option('settingsAlign', 'start', 'settingsAlignStart', fields.settingsAlign),
              option('settingsAlign', 'end', 'settingsAlignEnd', fields.settingsAlign)
            )
          ),
          react.createElement('div', { style: fieldStyle },
            react.createElement('label', { style: labelStyle }, t('settingsOrderLabel')),
            settingsOrderRows.length > 0
              ? react.createElement('div', { style: { flexDirection: 'column', gap: '4px', display: 'flex' } }, settingsOrderRows)
              : null,
            react.createElement('p', { style: hintStyle }, t('settingsOrderHint'))
          ),

          // ── Save & Reset actions ──────────────────────────────────────────
          writable ? null : react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-label-tertiary, #888)' }) }, t('readOnlyStatus')),
          react.createElement('div', { style: Object.assign({}, rowStyle, { paddingTop: '8px' }) },
            react.createElement('button', {
              style: saving || !writable ? Object.assign({}, saveButtonStyle, disabledStyle) : saveButtonStyle,
              disabled: saving || !writable,
              onClick: onSave,
            }, t('saveLabel')),
            react.createElement('button', {
              style: saving || !resettable ? Object.assign({}, ghostButtonStyle, disabledStyle) : ghostButtonStyle,
              disabled: saving || !resettable,
              onClick: onReset,
            }, t('resetLabel'))
          ),
          saving ? react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-label-tertiary, #888)' }) }, t('savingStatus'))
            : status.kind === 'saved' ? react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-state-success-primary, #2f9e44)' }) }, t('savedStatus'))
            : status.kind === 'error' ? react.createElement('p', { style: Object.assign({}, statusStyle, { color: 'var(--dsw-alias-state-error-primary, #e53e3e)' }) }, status.message)
            : null,
          react.createElement('p', { style: hintStyle }, t('configSource'))
        );
      }

      // ── settings surfaces ───────────────────────────────────────────────────
      // The bundle page draws no chrome around `plugins.bundle.config`, so the
      // section carries its own heading and one-liner.
      function FooterOrderSection(props) {
        var t = props.t;
        return react.createElement('section', {
          'aria-label': t('cardTitle'),
          style: { display: 'flex', flexDirection: 'column', gap: '12px' },
        },
          react.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
            react.createElement('h3', { style: { margin: '0', fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: 'var(--dsw-alias-label-primary)' } }, t('cardTitle')),
            react.createElement('p', { style: { margin: '0', fontSize: '13px', lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' } }, t('cardDescription'))
          ),
          react.createElement(FooterOrderForm, { t: t })
        );
      }

      function FooterOrderPage(props) {
        if (props.view === 'summary') return props.t('summary');
        return react.createElement(FooterOrderForm, { t: props.t });
      }

      // ── slot registrations ──────────────────────────────────────────────────
      // The settings section on this bundle's own page in Settings → Plugins.
      // Declared by @deepseek-ai/dsh-client-ui-plugin-manager's `main` entry, so
      // `inject` waits until that page is mounted.
      slots.inject('plugins.bundle.config', function () {
        return slots.register(
          { name: 'plugins.bundle.config', key: BUNDLE_KEY, locale: NS },
          FooterOrderSection
        );
      });

      // The row's configuration page on the Plugins screen, keyed by the row id
      // this bundle's patch declares (`footer-order`).
      slots.inject('plugins.row.config', function () {
        return slots.register(
          { name: 'plugins.row.config', key: ROW_KEY, locale: NS },
          FooterOrderPage
        );
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
