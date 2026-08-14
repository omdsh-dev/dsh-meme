/**
 * @dsh-external/dsh-meme —— agent 回复正文内联表情包插件。
 *
 * 机制：agent 回复正文通过 markdown 图片 `![text](/api/dsh-meme/<file>)`（相对路径，
 * 浏览器按当前 origin 解析，远程访问同样可用）内联一张表情；DSH WebUI 的 markdown
 * 渲染器对图片 URL 原生渲染成 `<img>`，因此无需修改渲染器。
 *
 * - `inject_meme` 工具让 agent 选表情，返回可嵌入回复正文的 markdown 图片片段；
 * - `systemPrompt.section` 注入动态引导（含情绪节点建议，惰性求值）；
 * - `ctx.webServer` 注册 `/api/dsh-meme/*.png` prefix 路由，流式返回内置 PNG，
 *   带路径穿越防护（basename + .png 白名单 + 查表 + 文件预检）。
 * @module @dsh-external/dsh-meme
 */

import { createReadStream, existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { createUserMessage, type MessageSource } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { MEMES, memeByFile, memeById } from './catalog.ts'

/** 兜底补发消息的来源标记——钩子据此识别"这条 user 消息来自 dsh-meme 而非真人"，以便防回环。 */
const MEME_SOURCE: MessageSource = { kind: 'plugin', plugin: 'dsh-meme' }

export const name = '@dsh-external/dsh-meme'
export const inject = ['tools', 'systemPrompt']

const API_ROOT = '/api/dsh-meme'
// 资产缓存失效版本：替换/更新表情素材后递增，URL 带 ?v=N 使浏览器缓存随版本刷新。
const MEME_ASSET_REVISION = '1'
// 内置表情图片根目录：相对本插件 package 根解析到 assets/memes/。
const memeRoot = fileURLToPath(new URL('../assets/memes/', import.meta.url))

/** 表情图片的相对 URL（浏览器按当前 origin 解析；带资产版本号，替换资源后 bump MEME_ASSET_REVISION）。 */
function memeUrl(file: string): string {
  return `${API_ROOT}/${file}?v=${MEME_ASSET_REVISION}`
}

/** 把表情转成可嵌入回复正文的 markdown 图片片段。 */
function memeMarkdown(id: string): string {
  const meme = memeById(id)
  if (meme === undefined) throw new Error(`表情不存在：${id}`)
  return `![${meme.text}](${memeUrl(meme.file)})`
}

/**
 * 基础引导：无论是否命中情绪节点都保留的默认行为契约。
 * 未命中明确情绪节点时返回这份基础文字，命中时在其后追加节点提醒。
 */
function baseGuidanceText(): string {
  return '默认给每轮回复配一张表情包以增强语气：用 inject_meme 工具选取搭配当前语气的表情，把返回的 markdown 图片片段自然嵌进回复正文（放末尾或最贴合语气的文字处，不单独成段、不说明它是图片）。配表情是本插件的默认行为，例外仅在语境明显不适用（严肃正式报道、或用户明确表态不要表情）时由你判断省略；日常问候、友好交流、鼓励、肯定、完成、祝贺、轻松调侃等氛围应自然使用。一回合最多 1 张，绝不替代实质回答。可用表情（id + 表情语 + 适用语气）：\n' + MEMES.map(meme => `- ${meme.id}：${meme.text}（${meme.tone}）`).join('\n')
}

/** 定位"本轮输入"之后的事件起点索引：最后一个 user/message 之后的第一个事件（无则 0）。 */
function currentTurnStartIndex(agent: Agent): number {
  const events = agent.session.events
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'user/message') return i + 1
  }
  return 0
}

/** 本轮（最后一个 user/message 之后）是否已出现 dsh-meme 表情 markdown。 */
function hasMemeInCurrentTurn(agent: Agent): boolean {
  const events = agent.session.events
  for (let i = currentTurnStartIndex(agent); i < events.length; i++) {
    const e = events[i]
    if (e.type !== 'assistant/message') continue
    const content = (e.data as { content?: readonly { type?: string; text?: string }[] }).content
    if (!Array.isArray(content)) continue
    for (const block of content) {
      if (block.type === 'text' && typeof block.text === 'string' && block.text.includes(API_ROOT)) return true
    }
  }
  return false
}

/** 本轮输入是否由本插件补发（防回环：补发轮若仍漏配，不再补，避免无限 steer）。 */
function isCurrentTurnBackfilled(agent: Agent): boolean {
  const events = agent.session.events
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'user/message') {
      const source = (e.data as { source?: { kind?: string; plugin?: string } }).source
      return source?.kind === 'plugin' && source?.plugin === 'dsh-meme'
    }
  }
  return false
}

/**
 * turn-stopping 兜底：`agent/turn-stopping` 触发即代表本轮模型已收尾（error/blocked 不会到达该钩子），
 * 只判断两件事——本轮正文是否已配表情、本轮输入是否刚由本插件补发过。防回环成立。
 */
export function fallbackIfMemeMissing(agent: Agent): boolean {
  if (isCurrentTurnBackfilled(agent)) return false
  if (hasMemeInCurrentTurn(agent)) return false
  return true
}

/**
 * 情绪节点检测：只在本轮（最后一个 user/message 之后）找最后一条成功 tool/result，
 * 命中"成功工具调用"时建议配"改好了，你看看"；否则返回 undefined（由调用方兜底 daily-chat）。
 * 不跨轮扫描，避免陈旧事件误导本轮建议。
 */
export function emotionalNodeSuggestion(agent: Agent): string | undefined {
  const events = agent.session.events
  for (let i = events.length - 1; i >= currentTurnStartIndex(agent); i--) {
    const e = events[i]
    if (e.type !== 'tool/result') continue
    // 工具成功判定：tool-result 内容块的 isError === false（不是顶层 data.error）。
    const block = e.data?.message?.content?.[0]
    if (block && block.type === 'tool-result' && block.isError === false) {
      return 'fixed-review'
    }
  }
  return undefined
}

/**
 * 按会话装配的动态引导：未命中节点返回基础行为契约；命中情绪节点时
 * 追加一句"这里适合配 {X 表情}"，把触发点精确落在出现的情绪位置上。
 * 导出供测试与未来复用。
 */
export function dynamicGuidance(agent: Agent): string {
  const base = baseGuidanceText()
  const suggestion = emotionalNodeSuggestion(agent)
  if (suggestion === undefined) return base
  const meme = memeById(suggestion)
  if (meme === undefined) return base
  return `${base}\n\n（注意：你刚完成了一次成功的工具调用——这里是适合配一张表情的情绪节点，建议用 inject_meme 选择 ${meme.id}（${meme.text}）。）`
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'inject_meme',
    description: '在回复正文内联一张表情包以增强语气。日常问候、友好、鼓励、肯定、完成、祝贺、轻松调侃等氛围时，在回复末尾/合适位置配 1 张（一回合最多 1 张）；严肃正式或用户明确不要表情时不用。调用本工具后，你【必须】把返回值里的 markdown 字段【原样粘贴进你最终的自然语言回复正文中】——图片是通过这段 markdown 渲染进对话的，只调用工具而不同时在正文里粘贴该 markdown 等于没有发出图片（工具卡片不会自动渲染它）。绝不只打 emoji 或说明性文字来代替；粘贴 markdown 时不要把它放在代码块里，也不要为它另起段落或加说明。',
    parameters: {
      id: { type: 'string', required: true, enum: MEMES.map(meme => meme.id), description: '表情 id。' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', required: true },
          id: { type: 'string', required: true },
          text: { type: 'string', required: true },
          markdown: { type: 'string', required: true },
          image: { type: 'string', required: true },
        },
        additionalProperties: false,
      },
      render: (_args, value) => [
        { type: 'text', text: `${String((value as { text?: unknown }).text ?? '')}\n${String((value as { markdown?: unknown }).markdown ?? '')}` },
      ],
    },
    presentCall: (args) => ({ card: 'generic', title: `添加表情 · ${memeById(String((args as { id?: unknown }).id))?.text ?? 'DSH 表情'}` }),
    presentResult: (_args, result) => ({ card: 'generic', content: result.content }),
    execute: async ({ id }) => {
      const meme = memeById(String(id))
      if (meme === undefined) throw new Error(`表情不存在：${String(id)}`)
      const markdown = memeMarkdown(meme.id)
      return { ok: true, id: meme.id, text: meme.text, markdown, image: memeUrl(meme.file) }
    },
  })), 'dsh-meme: inject_meme tool')

  ctx.effect(() => ctx.on('agent/created', ({ agent }) => {
    // 按会话（agent 作用域）装配：把表情引导挂进该 agent 自己的 context，
    // section.text 惰性读该 agent 的 session 事件流，在"情绪节点"动态命中。
    // 相比全局静态 section，这是 Cordis 的动态装配：只对该 agent 生效，
    // 且能感知最近的工具结果 / 回合结束原因。
    agent.ctx.systemPrompt.section({
      name: 'dsh-meme:guidance',
      // order -99：紧跟 harness:identity(-100) 之后、persona(0) 之前。
      // 让"你可以、且应在回复中配表情"成为模型每次请求读到的首批指令，
      // 而非 order 175 时排在末尾的附注——提升模型对"我有发表情能力"的认知权重。
      order: -99,
      text: () => { return dynamicGuidance(agent) },
    })
    // 机制兜底：每回合停顿时，若该配表情但正文漏了，且非刚兜底过，
    // 则 steer 一条"请补表情"的 user 消息（带 dsh-meme 来源标记，防回环）。
    // 这是把"表情必有"从模型自觉变成机制保证的一层。
    agent.ctx.on('agent/turn-stopping', async ({ agent: thisAgent, signal }) => {
      if (signal.aborted) return
      if (!fallbackIfMemeMissing(thisAgent)) return
      // 挑一个具体的表情：优先取情绪节点对应的表情；模型完全没调工具（全文字）时
      // emotionalNodeSuggestion 会返回 undefined，此时退回通用收尾表情。
      const suggestion = emotionalNodeSuggestion(thisAgent) ?? 'daily-chat'
      const meme = memeById(suggestion)
      const prompt = meme === undefined
        ? '你上一回合回复正文里没有表情包（配表情是默认行为）。请在补充回复中真正调用 inject_meme 工具选一张表情，然后把返回的 markdown 图片片段原样粘贴进正文末尾——不要只写工具名或说明文字。'
        : `你上一回合回复正文里没有表情包（配表情是默认行为）。请在补充回复中真正调用 inject_meme(id=${meme.id}) 工具取一张表情，然后把返回的 markdown 图片片段原样粘贴进正文末尾——不要只写工具名或说明文字。`
      thisAgent.steer(createUserMessage({ content: [{ type: 'text', text: prompt }], source: MEME_SOURCE }))
    })
  }), 'dsh-meme: per-agent guidance')

  ctx.inject(['webServer'], (scope: Context) => {
    scope.effect(() => scope.webServer.register({
      kind: 'prefix',
      path: API_ROOT,
      handler: (request, response) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        // 解码用户可控路径；非法百分号/编码（如 %zz、截断的 UTF-8）会让
        // decodeURIComponent 抛 URIError。在输入边界拦截，回 404 而非让异常外抛
        // （即使 webserver 有 catch 兜底，400 日志噪音也应避免）。
        let file: string
        try {
          file = basename(decodeURIComponent(pathname.slice(API_ROOT.length + 1)))
        } catch {
          response.writeHead(404); response.end('not found'); return
        }
        if (extname(file) !== '.png' || memeByFile(file) === undefined) {
          response.writeHead(404); response.end('not found'); return
        }
        // 先在写 200 之前预检文件是否真实存在，避免 createReadStream 的 ENOENT
        // 在 header 已发后触发 error（此时无法改为 404，只能 destroy 切断 socket）。
        const filePath = join(memeRoot, file)
        if (!existsSync(filePath)) {
          response.writeHead(404); response.end('not found'); return
        }
        // 流式返回内置 PNG；若后续读取失败（极端竞态），在 header 未发时回 404，
        // 已发时尽力 end，绝不把未捕获的 stream error 泄漏到进程导致整个 web 崩溃。
        const stream = createReadStream(filePath)
        stream.on('error', () => {
          if (!response.headersSent) { response.writeHead(404); response.end('not found'); return }
          response.end()
        })
        // 不带 immutable：配合 ?v= 版本号（MEME_ASSET_REVISION）控制缓存失效，
        // 避免换图后浏览器长时间复用旧缓存。
        response.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' })
        stream.pipe(response)
      },
    }), 'dsh-meme: image route')
  })
}
