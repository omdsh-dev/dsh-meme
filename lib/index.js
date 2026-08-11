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
import { createReadStream, existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { MEMES, memeByFile, memeById } from "./catalog.js";
export const name = '@dsh-external/dsh-meme';
export const inject = ['tools', 'systemPrompt'];
const API_ROOT = '/api/dsh-meme';
const LOOPBACK_HOST = '127.0.0.1';
// 资产缓存失效版本：替换/更新表情素材后递增，URL 带 ?v=N 使浏览器缓存随版本刷新。
const MEME_ASSET_REVISION = '1';
// 内置表情图片根目录：相对本插件 package 根解析到 assets/memes/。
const memeRoot = fileURLToPath(new URL('../assets/memes/', import.meta.url));
/** 从当前 httpServer 解析监听端口，拼出表情图片的绝对 URL（带资产版本号）。 */
function localMemeUrl(ctx, file) {
    const port = ctx.get('httpServer')?.port;
    if (port === undefined)
        throw new Error('dsh-meme: httpServer service missing while resolving meme URL');
    return `http://${LOOPBACK_HOST}:${String(port)}${API_ROOT}/${file}?v=${MEME_ASSET_REVISION}`;
}
/** 把表情转成可嵌入回复正文的 markdown 图片片段。 */
function memeMarkdown(ctx, id) {
    const meme = memeById(id);
    if (meme === undefined)
        throw new Error(`表情不存在：${id}`);
    return `![${meme.text}](${localMemeUrl(ctx, meme.file)})`;
}
export function apply(ctx) {
    ctx.effect(() => ctx.tools.register(defineTool({
        name: 'inject_meme',
        description: '在回复正文中内联一个表情包图片。返回一段 markdown 图片片段；把它原样嵌入你的回复正文（不要调用多次、不要当作说明文字）。',
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
                { type: 'text', text: `${String(value.text ?? '')}\n${String(value.markdown ?? '')}` },
            ],
        },
        presentCall: (args) => ({ card: 'generic', title: `添加表情 · ${memeById(String(args.id))?.text ?? 'DSH 表情'}` }),
        presentResult: (_args, result) => ({ card: 'generic', content: result.content }),
        execute: async ({ id }) => {
            const meme = memeById(String(id));
            if (meme === undefined)
                throw new Error(`表情不存在：${String(id)}`);
            const markdown = memeMarkdown(ctx, meme.id);
            return { ok: true, id: meme.id, text: meme.text, markdown, image: localMemeUrl(ctx, meme.file) };
        },
    })), 'dsh-meme: inject_meme tool');
    ctx.effect(() => ctx.systemPrompt.section({
        name: 'dsh-meme:guidance',
        order: 175,
        text: () => `你的每次回复都应在最适合语气的位置自然内联一张表情包，让回答更有温度（唯一的例外是上下文明显不适合、或用户明确要求正式/严肃回答时）。用 inject_meme 工具取一张搭配当前语气的表情，然后把工具返回值中的 markdown 图片片段原样嵌进回复正文（出现在合适的文字位置，不要单独成段、不要解释它是什么图片）。一回合最多用 1 张，绝不替代实质回答，只在写完整回答的基础上附加一张表情。可用表情：\n${MEMES.map(meme => `- ${meme.id}:${meme.text}(可用于 ${meme.tone})`).join('\n')}`,
    }), 'dsh-meme: guidance');
    ctx.inject(['httpServer'], (scope) => {
        scope.effect(() => scope.httpServer.register({
            kind: 'prefix',
            path: API_ROOT,
            handler: (request, response) => {
                const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
                const file = basename(decodeURIComponent(pathname.slice(API_ROOT.length + 1)));
                if (extname(file) !== '.png' || memeByFile(file) === undefined) {
                    response.writeHead(404);
                    response.end('not found');
                    return;
                }
                // 先在写 200 之前预检文件是否真实存在，避免 createReadStream 的 ENOENT
                // 在 header 已发后触发 error（此时无法改为 404，只能 destroy 切断 socket）。
                const filePath = join(memeRoot, file);
                if (!existsSync(filePath)) {
                    response.writeHead(404);
                    response.end('not found');
                    return;
                }
                // 流式返回内置 PNG；若后续读取失败（极端竞态），在 header 未发时回 404，
                // 已发时尽力 end，绝不把未捕获的 stream error 泄漏到进程导致整个 web 崩溃。
                const stream = createReadStream(filePath);
                stream.on('error', () => {
                    if (!response.headersSent) {
                        response.writeHead(404);
                        response.end('not found');
                        return;
                    }
                    response.end();
                });
                response.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400, immutable' });
                stream.pipe(response);
            },
        }), 'dsh-meme: image route');
    });
}
