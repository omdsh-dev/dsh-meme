/**
 * @dsh-external/dsh-meme —— agent 回复正文内联表情包插件。
 *
 * 机制：agent 回复正文通过 markdown 图片 `![text](http://127.0.0.1:<port>/api/dsh-meme/<file>)`
 * 内联一张表情；DSH WebUI 的 markdown 渲染器（`renderImage`）对绝对 http/https
 * 图片 URL 原生渲染成 `<img>`，因此无需修改渲染器、也不需要 browser client half。
 *
 * - `inject_meme` 工具让 agent 选表情，返回可嵌入回复正文的 markdown 图片片段；
 * - `systemPrompt.section` 在提示消费时惰性读取 httpServer 端口，保证 agent
 *   拿到的 URL 永远指向当前进程的监听端口；
 * - `ctx.httpServer` 注册 `/api/dsh-meme/*.png` prefix 路由，流式返回内置 PNG，
 *   带路径穿越防护（basename + .png 白名单 + 查表 + 文件预检）。
 * @module @dsh-external/dsh-meme
 */
import type { Context } from 'cordis';
export declare const name = "@dsh-external/dsh-meme";
export declare const inject: string[];
export declare function apply(ctx: Context): void;
