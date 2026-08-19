# dsh-footer-order

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Web 端插件，解决侧边栏底部(`sidebar.footer.action` 槽位)多个插件内容挤成一行的布局问题，并让你自由配置这些内容的上下排列顺序。

<table align="center">
  <thead>
    <tr><th style="text-align: center">修改前</th><th style="text-align: center">修改后</th></tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="docs/imgs/before.png" alt="修改前" width="240"></td>
      <td align="center"><img src="docs/imgs/after.png" alt="修改后" width="240"></td>
    </tr>
    <tr>
      <td align="center"><sub>多个 footer 插件挤在同一行</sub></td>
      <td align="center"><sub>上下排列，清晰可读</sub></td>
    </tr>
  </tbody>
</table>

![platform-web](https://img.shields.io/badge/platform-web-blue)

> [!NOTE]
> **AI 生成声明**:本插件由 AI 生成，可能存在错误、安全隐患或不符合预期之处，使用前请自行 review 代码并实测：发现任何问题欢迎提交 issue 或 PR 修正。

## 问题背景

安装多个插件后，插件会往 `sidebar.footer.action` 槽位里注册内容。该槽位的渲染锚点 `div[data-slot="sidebar.footer.action"]` 被 dsh 的 web-react 渲染器赋予了内联样式 `display: contents`，于是所有条目的根元素直接参与父容器(`.footerActions`，`display: flex`，横向)的布局——多个插件的内容就会**挤在同一行**。

本插件通过注入一条带 `!important` 的样式规则，把该锚点改为**纵向 flex 堆叠**(`display: flex: flex-direction: column`)，内容自然就**上下排列**了。

## 特性

- 把 `sidebar.footer.action` 的内容改为上下排列(`display: contents` → `flex column`)，修复多个 footer 插件挤在一行的问题。
- 可配置条目**上下顺序**: 在插件行的 `config.order`(base 层)里按从上到下写出插件 id 列表，或直接在 设置 → 插件 → Sidebar Footer Order 卡片里用 ↑/↓ 调整。
- 可配置 `layout`(column / row / contents)、`gap`(条目间距)、`align`(对齐方式)。
- 兼容**不渲染任何内容的条目**(如 shell 内置的 `cordis-panel`，平时返回 null):排序自动跳过这类条目，不会因「条目数 ≠ DOM 节点数」而失效。
- 配置热加载 —— 在卡片保存(settings 服务热发布)立即生效，无需重启 `dsh web`；编辑 bundle 的 `cordis.patch.yml` base 配置则经 patch 层 HMR 重启此 fiber 生效。
- 不注册任何可见的 footer 条目，只做布局与排序，卸载后不留痕迹（样式与观察器随插件卸载清理）。

## 架构

| 端 | 文件 | 作用 |
| --- | --- | --- |
| Host | `lib/index.js` | 提供 `/footer-order/settings` —— 作为 `footer-order` 设置命名空间的一个薄代理：GET 返回已解析配置 + revision + 是否覆盖标记；POST 通过官方 dsh 设置缝(`ctx.settings`)保存(update)或重置(replace `{}`)。部署期的 patch config 成为该命名空间的 `base` 层；运行时编辑落入其上方的 `user` 层 |
| Client | `lib/client.js` | 注入覆盖样式(锚点改为纵向 flex)：监听 DOM 变化，按配置把锚点的子元素重新排序：在 设置 → 插件 注册可编辑的 Sidebar Footer Order 卡片 |

排序实现:每个注册条目在锚点下渲染为**恰好一个子节点**(渲染器按 `order` 升序输出)，但部分条目可能渲染为空(如 `cordis-panel`、收起侧边栏时隐藏的读数)。客户端用三层策略把子节点与 `ctx.slots.entriesOfSlot('sidebar.footer.action')` 里的条目 id 配对：① 按条目 `label` 的文本匹配子节点(如「重启 DSH」按钮)；② 沿用此前已确认的配对；③ 对剩余子节点做「配置命中优先、位移最小」的子序列枚举。之后按配置顺序重排 DOM。这样即使存在常驻的空渲染条目，排序也始终生效。

## 安装

### 通过 [plugin-registry](https://github.com/vlln/plugin-registry) 安装

设置 → 插件 → 安装，source 填 `@choi-p/dsh-footer-order` 或 `github:Choi-Peng/dsh-footer-order`。

### 手动安装

```bash
dsh plugin --profile web add "github:Choi-Peng/dsh-footer-order"
```

插件包自带 `cordis.patch.yml`（`package.json` 中的 `dsh.bundle.patch`），安装时由 dsh 自动挂载。重启 `dsh web` 后生效。

### 卸载方式

```bash
dsh plugin --profile web remove @choi-p/dsh-footer-order
```

bundle 挂载随插件移除自动消失；若曾在 profile 层手动写过该行，需先删掉它。

## 配置

插件设置遵循 dsh 官方双缝配置模型，**均实时生效，无需重启 `dsh web`**（要求宿主安装 `@deepseek-ai/dsh-settings` ≥ 0.1.0-rc.7，标准 dsh web 发行版内置）：

| 层 | 来源 | 生效方式 |
| --- | --- | --- |
| 默认值 | schema 内置 | — |
| base 层（部署方静态配置） | 插件 bundle 自带 `cordis.patch.yml` 行内 `config`（`dsh.bundle.patch`，安装即自动挂载） | `dsh web` 监听 patch 层（HMR），编辑后自动用新配置重启此 fiber |
| 用户层（运行时设置） | 设置 → 插件 → Sidebar Footer Order 的保存/重置，经 `ctx.settings` 持久化到 `$DSH_HOME/settings.yaml`；重置 = 清空用户层回落 base | settings 服务热发布，立即生效；本插件不再改写 `cordis.patch.yml` |

base 层 `config`（bundle 默认附带）：

```yaml
- insert:
    - id: footer-order
      name: '@choi-p/dsh-footer-order'
      config:
        layout: column   # column = 纵向堆叠（默认）| row = 横向 | contents = 不干预
        gap: 0           # 条目间距，px（>= 0）
        align: stretch   # stretch | start | center | end（纵向堆叠时的交叉轴对齐）
        order: []        # 插件 id 列表，从上到下；未列出的条目保持默认注册顺序，排在已列条目之下
```

> `order` 里的 id 是每个插件向 `sidebar.footer.action` 调用 `slots.register({ name, id, ... })` 时传入的 `id`，不是包名。设置卡片会列出当前所有已注册 id，可用 ↑/↓ 重新排序。

卡片暴露 `layout`（下拉框：上下排列 / 左右排列 / 不干预）、`gap` 条目间距、`align` 对齐方式、`order` 上下顺序，并提供
保存 / 恢复默认值；保存采用 revision 乐观并发，若配置已在别处修改会提示并加载最新值。

## 使用

1. 打开 dsh web —— 侧边栏底部的 footer 条目会上下排列。
2. 设置 → 插件 → **侧边栏底部排序** 卡片：调整 layout、gap、对齐方式与顺序，然后保存。所有修改实时生效，无需重启 `dsh web`。

## 开发

```bash
pnpm install
node --check lib/index.js
node --check lib/client.js
node scripts/smoke-host.mjs    # host 端:路由/持久化/校验冒烟测试
node scripts/smoke-client.mjs  # client 端:CSS 注入/排序/配对冒烟测试
```

## License

[MIT](./LICENSE)
