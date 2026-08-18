# dsh-footer-order

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Web 端插件,解决侧边栏底部(`sidebar.footer.action` 槽位)多个插件内容挤成一行的布局问题,并让你自由配置这些内容的上下排列顺序。

![platform-web](https://img.shields.io/badge/platform-web-blue)

> [!NOTE]
> **AI 生成声明**:本插件由 AI 生成,可能存在错误、安全隐患或不符合预期之处,使用前请自行 review 代码并实测;发现任何问题欢迎提交 issue 或 PR 修正。

## 问题背景

安装多个插件后,插件会往 `sidebar.footer.action` 槽位里注册内容。该槽位的渲染锚点 `div[data-slot="sidebar.footer.action"]` 被 dsh 的 web-react 渲染器赋予了内联样式 `display: contents`,于是所有条目的根元素直接参与父容器(`.footerActions`,`display: flex`,横向)的布局——多个插件的内容就会**挤在同一行**。

本插件通过注入一条带 `!important` 的样式规则,把该锚点改为**纵向 flex 堆叠**(`display: flex; flex-direction: column`),内容自然就**上下排列**了。

## 特性

- 把 `sidebar.footer.action` 的内容改为上下排列(`display: contents` → `flex column`),修复多个 footer 插件挤在一行的问题。
- 可配置条目**上下顺序**:在 `cordis.patch.yml` 的插件行 `config.order` 里按从上到下写出插件 id 列表,或直接在 设置 → 插件 → Sidebar Footer Order 卡片里用 ↑/↓ 调整。
- 可配置 `layout`(column / row / contents)、`gap`(条目间距)、`align`(对齐方式)。
- 配置热加载 —— 编辑 `cordis.patch.yml` 或使用设置卡片保存,均无需重启 `dsh web` 即可生效(保存后客户端约 10 秒内自动同步,卡片内保存则立即生效)。
- 不注册任何可见的 footer 条目,只做布局与排序,卸载后不留痕迹(样式与观察器随插件卸载清理)。

## 架构

| 端 | 文件 | 作用 |
| --- | --- | --- |
| Host | `lib/index.js` | 注册 `/footer-order/settings`(GET 读取生效配置;POST 将设置保存/重置回 profile 的 `cordis.patch.yml` 中本插件所在行,启动时若该行不存在则写入默认配置) |
| Client | `lib/client.js` | 注入覆盖样式(锚点改为纵向 flex);监听 DOM 变化,按配置把锚点的子元素重新排序;在 设置 → 插件 注册可编辑的 Sidebar Footer Order 卡片 |

排序实现:每个注册条目在锚点下渲染为**恰好一个子节点**(渲染器按 `order` 升序输出),客户端把子节点与 `ctx.slots.entriesOfSlot('sidebar.footer.action')` 里的条目 id 逐一配对(增量学习,带未知节点保护),再按配置顺序重排。若某个条目渲染为空(例如侧边栏收起时某些插件返回 null),当轮跳过排序以免错配,展开后自动恢复。

## 配置

配置位于 profile 的 `cordis.patch.yml` 中本插件所在行:

```yaml
- insert:
    - id: footer-order
      name: '@choi-p/dsh-footer-order'
      config:
        layout: column   # column=上下排列(默认) | row=左右排列 | contents=不干预
        gap: 0           # 条目间距(px,>=0)
        align: stretch   # stretch | start | center | end(column 时的交叉轴对齐)
        order: []        # 插件 id 列表,自上而下;未列出的保持默认注册顺序并排在列出的之后
```

`order` 示例 —— 把 `deepseek-balance` 移到最上面:

```yaml
        order:
          - deepseek-balance
```

> `order` 里填的是各插件注册到 `sidebar.footer.action` 时使用的 `id`(见各插件 `slots.register({ name, id, ... })` 的 `id` 字段),不是包名。设置卡片里会列出当前已注册的所有 id,可直接用 ↑/↓ 调整。

## 安装

### 通过 plugin-registry / 插件市场安装

设置 → 插件 → 安装,source 填 `@choi-p/dsh-footer-order` 或 `github:Choi-Peng/dsh-footer-order`。

### 手动安装

1. 将插件安装到 web profile:

```bash
dsh plugin --profile web add "github:Choi-Peng/dsh-footer-order"
```

2. 确认 profile 的 patch 层已挂载插件行(安装时会自动写入默认配置):

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- insert:
    - id: footer-order
      name: '@choi-p/dsh-footer-order'
      config:
        layout: column
        gap: 0
        align: stretch
        order: []
```

### 卸载

先从 `cordis.patch.yml` 移除该行(实时生效),然后:

```bash
dsh plugin --profile web remove footer-order
```

## 使用

1. 打开 dsh web,侧边栏底部多个 footer 插件内容将改为上下排列。
2. 设置 → 插件 → 找到 **Sidebar Footer Order** 卡片,可调整排列方式、间距、对齐与上下顺序并保存。

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
