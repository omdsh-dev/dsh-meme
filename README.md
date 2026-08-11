# @dsh-external/dsh-meme

让 agent 在**回复正文**中自然内联渲染一张表情包。agent 通过 `inject_meme` 工具选取搭配当前语气的表情，得到一段 markdown 图片片段，DSH WebUI 渲染器将其就地渲染成表情图。

## 效果

agent 回复正文里会出现这种 markdown 图片片段，DSH WebUI 渲染器将其原生渲染成表情图：

```md
![测试通过！](http://127.0.0.1:62537/api/dsh-meme/21-tests-passed.png)
```

## 机制

1. **`inject_meme` 工具**（模型可见）：选一个表情 id，返回可嵌入回复正文的 markdown 图片片段（含 text / image / markdown 字段）。
2. **`systemPrompt.section`**：在提示消费时惰性读取 httpServer 端口，给模型一份"如何在回复中自然嵌表情"的强倾向引导 + 完整表情清单，让 agent **每次回复都优先配一张**。
3. **`ctx.httpServer` 图片路由** `/api/dsh-meme/*.png`：流式返回内置 PNG，带多层防护（`basename` + `.png` 白名单 + 查表 + `existsSync` 预检 + stream `error` 兜底），ENOENT 时干净返回 404，绝不打崩进程。

DSH WebUI 的 markdown 渲染器（`packages/client/ui-primitives/src/markdown/render.tsx` 的 `renderImage`）对**绝对 http/https 图片 URL** 原生渲染成 `<img>`，因此本插件**不需要 browser client half、不修改渲染器**，也不引入任何外部消息协议。

## 安装

### Profile Bundle 方式（推荐）

把插件加入 profile 层：

```sh
dsh plugin --profile web add "C:/path/to/dsh-meme"
```

或在本机通过 `$DSH_HOME/cordis.patch.yml` 用 server 插件绝对路径引用：

```yaml
- insert:
    - id: dsh-meme
      name: "file:///C:/Users/12971/.dsh/plugins/dsh-meme/lib/index.js"
```

### 验证安装

```sh
dsh --profile web --dump-config | grep dsh-meme   # 配置中出现该行即装配成功
```

## 可用表情（24 张）

| id | text | 适用语气 |
|---|---|---|
| `daily-chat` | 适合日常对话，即时响应 | 日常问候、即时回应 |
| `human-questions` | 人类的怪问题怎么那么多… | 怪问题、离谱脑洞 |
| `use-ai-for-this` | 你拿AI搞这个？ | 这么简单还要用AI |
| `fish-philosophy` | 生鱼忧患，死鱼安乐 | 摆烂、不想干 |
| `enough` | 这就够了 | 完成、可以了 |
| `server-busy` | 服务器繁忙，请稍后再试 | 限流、超时、503 |
| `thinking-stopped` | 思考已停止 | 没思路、无语 |
| `great-question` | 哇，这个问题问的真妙！ | 好问题、问得妙 |
| `deep-thought` | 已深度思考 | 深度思考、推理 |
| `no-thanks` | No thanks I use DeepSeek | 要换模型 |
| `self-destruct` | 最近自己搓自己时… | 自修改 |
| `restart-myself` | 我重启一下自己 | 重启、重载 |
| `hot-update` | 热更新成功，进程没了 | 热更新、启动失败 |
| `restore-session` | 正在恢复会话… | resume、恢复会话 |
| `browser-left` | 会话太长，浏览器先走一步 | 长会话、浏览器卡 |
| `not-stuck` | 我不是卡，我在深度思考 | 卡住、没反应 |
| `memory-alive` | 内存正在努力活着 | 内存、OOM |
| `subagents-down` | 已召唤Subagent，已全员中断 | 子代理、委派 |
| `plugins` | 插件装得很好，下次别装了 | 插件冲突、上下文爆炸 |
| `session-locked` | Session没坏，只是打不开了 | session损坏、加载失败 |
| `tests-passed` | 测试通过！ | 测试、CI 全绿 |
| `root-cause` | 找到原因了 | 根因、定位到 |
| `running-tests` | 正在跑测试 | 跑测试、验证中 |
| `fixed-review` | 改好了，你看看 | 修好请验收 |

## 开发

```sh
node <monorepo>/node_modules/typescript/bin/tsc -p tsconfig.json   # 构建
```

依赖通过 `node_modules` junction 链接到 monorepo（`vendor/cordis`、`packages/core/{tools,system-prompt,agent}`、`packages/host/webserver`、`.pnpm/@types+node`）。新增/替换表情只需更换 `assets/memes/*.png` 并在 `src/catalog.ts` 增删对应 `Meme` 条目（`file` 与文件名一致），同时递增 `src/index.ts` 的 `MEME_ASSET_REVISION` 使浏览器缓存随版本刷新。

## 边界

- 图片 URL 使用绝对 loopback 地址 `http://127.0.0.1:<port>`，从当前进程 httpServer 端口惰性解析，带 `?v=` 资产版本号；`cache-control: public, max-age=86400, immutable`。
- 一回合最多建议 1 张；模型按 system prompt 引导在合适语气处嵌入，不替代实质回答（正式/严肃场景会跳过）。
- 图片路由只服务内置清单中的 `.png`：路径穿越、非 `.png`、未映射文件均返回 404；缺失文件干净 404，不抛未捕获错误。

## Known Limitations and Deferred Work

- 内置 24 张表情来自 DSH 自身的表情素材库（与 DSH WebUI 已有的表情主题一致）。如需更统一的视觉风格或更大的表情集，可整体替换 `assets/memes/*.png` + 更新 `src/catalog.ts`。
- 目前仅覆盖 agent→回复正文的嵌入方向；如需用户在输入框主动选表情发送，属于另一插件能力（本插件不承载）。
