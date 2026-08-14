import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import { MemeCard } from './MemeCard.tsx'

export const inject = ['slots']

/**
 * browser client half：把 inject_meme 工具的调用卡片注册到 `tool.call.toolview`
 * keyed hole（按 wire Tool name 分发），让工具调用在会话里直接渲染成表情图。
 * 即使 agent 忘了把 markdown 粘贴进正文，用户在工具卡片里也能直接看到这张表情，
 * 不依赖模型纪律（方案 B）。
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.slots.inject('tool.call.toolview', () => ctx.slots.register(
    { name: 'tool.call.toolview', key: 'inject_meme' }, MemeCard,
  )), 'dsh-meme: toolview card')
}
