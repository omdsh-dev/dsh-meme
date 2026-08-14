import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'
import { memeById } from '../catalog.ts'
import css from './MemeCard.module.css'

// 与 server 端 MEME_ASSET_REVISION 保持一致：替换素材后递增。
const MEME_ASSET_REVISION = '1'
// 浏览器端与 web 同源，用相对 URL 即可访问当前进程的 dsh-meme 图片路由。
const API_ROOT = '/api/dsh-meme'

/** 从工具调用 slice 解析 meme id（运行中 block.argsRaw / 结算 block.call.argsRaw）。 */
function idFromBlock(block: ToolCallViewProps['block']): string | undefined {
  const raw = ('kind' in block ? block.call?.argsRaw : block.argsRaw) ?? ''
  if (raw === '') return undefined
  try { return String((JSON.parse(raw) as { id?: unknown }).id ?? '') } catch { return String(raw).trim() }
}

/** keyed toolview 卡片：把 inject_meme 本次调用渲染成一张表情图。 */
export function MemeCard({ block }: ToolCallViewProps) {
  const id = idFromBlock(block)
  const meme = memeById(id ?? '')
  if (meme === undefined) return null
  const src = `${API_ROOT}/${meme.file}?v=${MEME_ASSET_REVISION}`
  return (
    <figure className={css.card} data-meme-id={meme.id}>
      <span>{meme.text}</span>
      <img src={src} alt={meme.text} loading="lazy" />
    </figure>
  )
}
