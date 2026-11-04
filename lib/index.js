// AI 生成声明:本插件代码由 AI 生成,可能存在错误或安全隐患,使用前请 review 并实测。
// dsh-footer-order — Host half (dsh 0.2 generation)
//
// dsh 0.2 derives every settings form from the Loader entry's exported `Config`
// schema: the settings seam (@deepseek-ai/dsh-settings) projects the volatile
// fields of that schema into a form and writes them back into this entry's row
// in the profile patch document. This half therefore registers no settings
// namespace and serves no HTTP proxy — it exports the schema the seam projects,
// which is also the only thing the host plane needs: the entire feature (CSS
// injection, DOM ordering, the settings surfaces) lives in the client half.
//
// Every field is volatile so the loader treats a config change confined to them
// as a live update (`loader/volatile-update`): saving from the Plugins page
// never remounts this entry, and the client's `configForms` snapshot sees the
// new values without a restart.
import z from '@deepseek-ai/schemastery';

/** Cordis plugin name. */
const name = 'footer-order';

/**
 * Settings schema; also defines the defaults. The namespace the browser reads
 * through `ctx.configForms` is this entry's Loader id (`footer-order`), which
 * this bundle's own patch fixes.
 */
export const Config = z.object({
  layout: z.union(['column', 'row', 'contents']).default('column').volatile(),
  gap: z.number().step(1).min(0).default(0).volatile(),
  align: z.union(['stretch', 'start', 'center', 'end']).default('stretch').volatile(),
  // string[] of sidebar.footer.action entry ids, top to bottom. The id
  // `settings` is reserved for the shell's settings row (the sidebar.settings
  // slot rendered inside div.settingsArea): listed, it joins the order; a real
  // footer entry registered under that id takes precedence.
  order: z.array(z.string()).default([]).volatile(),
  // Arrangement of the whole settingsArea block: the shell's settings row plus
  // every block another plugin appends to the area (dsh-restart's
  // `.dsh-sidebar-row`, for one). `contents` leaves the area untouched.
  settingsLayout: z
    .union(['row', 'column', 'row-reverse', 'column-reverse', 'contents'])
    .default('contents')
    .volatile(),
  settingsGap: z.number().step(1).min(0).default(8).volatile(),
  settingsAlign: z.union(['center', 'stretch', 'start', 'end']).default('center').volatile(),
  // Block keys inside settingsArea, top to bottom: `settings` for the shell's
  // settings row, then an injected block's id or `plugin:<data-plugin>`.
  // Applied as inline CSS `order`; blocks are never moved in the DOM.
  settingsOrder: z.array(z.string()).default([]).volatile(),
});

/**
 * No host-plane work: the layout and ordering machinery is client-side, and
 * configuration rides the settings seam over the exported schema.
 */
function apply() {}

export { apply, name };
export default { apply, name, Config };
