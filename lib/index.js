import { createReadStream, existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region src/catalog.ts
const MEMES = Object.freeze([
	{
		id: "daily-chat",
		text: "适合日常对话，即时响应",
		file: "01-daily-chat.png",
		tone: "日常问候、即时回应（你好/在吗/聊聊）"
	},
	{
		id: "human-questions",
		text: "人类的怪问题怎么那么多…",
		file: "02-human-questions.png",
		tone: "遇到怪问题、离谱脑洞（怪问题/离谱/脑洞）"
	},
	{
		id: "use-ai-for-this",
		text: "你拿AI搞这个？",
		file: "03-use-ai-for-this.png",
		tone: "这么简单的事还要用AI（这么简单/AI搞/认真的）"
	},
	{
		id: "fish-philosophy",
		text: "生鱼忧患，死鱼安乐",
		file: "04-fish-philosophy.png",
		tone: "摆烂、不想干、算了（摆烂/不想干/算了）"
	},
	{
		id: "enough",
		text: "这就够了",
		file: "05-enough.png",
		tone: "够了、完成、可以了（够了/完成/可以了）"
	},
	{
		id: "server-busy",
		text: "服务器繁忙，请稍后再试",
		file: "06-server-busy.png",
		tone: "限流、超时、服务不可用（限流/超时/503）"
	},
	{
		id: "thinking-stopped",
		text: "思考已停止",
		file: "07-thinking-stopped.png",
		tone: "没思路、宕机、无语（没思路/宕机/无语）"
	},
	{
		id: "great-question",
		text: "哇，这个问题问的真妙！",
		file: "08-great-question.png",
		tone: "好问题、问得妙（好问题/问得妙）"
	},
	{
		id: "deep-thought",
		text: "已深度思考",
		file: "09-deep-thought.png",
		tone: "深度思考、推理后（深度思考/推理）"
	},
	{
		id: "no-thanks",
		text: "No thanks I use DeepSeek",
		file: "10-no-thanks.png",
		tone: "用户要换模型/别家（换模型/Claude/GPT）"
	},
	{
		id: "self-destruct",
		text: "最近自己搓自己时，自杀频率有点高",
		file: "11-self-destruct.png",
		tone: "自修改、自己搓自己（自修改/自杀/重写失败）"
	},
	{
		id: "restart-myself",
		text: "我重启一下自己",
		file: "12-restart-myself.png",
		tone: "要重启/重载（重启/重载）"
	},
	{
		id: "hot-update",
		text: "热更新成功，进程没了",
		file: "13-hot-update.png",
		tone: "热更新、启动失败（热更新/启动失败）"
	},
	{
		id: "restore-session",
		text: "正在恢复会话…未分组里见",
		file: "14-restore-session.png",
		tone: "恢复会话/断线重连（resume/恢复会话）"
	},
	{
		id: "browser-left",
		text: "会话太长，浏览器先走一步",
		file: "15-browser-left.png",
		tone: "长会话、浏览器卡（长会话/浏览器卡）"
	},
	{
		id: "not-stuck",
		text: "我不是卡，我在深度思考",
		file: "16-not-stuck.png",
		tone: "被问卡住/没反应时（卡住/没反应）"
	},
	{
		id: "memory-alive",
		text: "内存正在努力活着",
		file: "17-memory-alive.png",
		tone: "内存不足/OOM（内存/OOM）"
	},
	{
		id: "subagents-down",
		text: "已召唤Subagent，已全员中断",
		file: "18-subagents-down.png",
		tone: "子代理/委派（subagent/子代理/全员中断）"
	},
	{
		id: "plugins",
		text: "插件装得很好，下次别装了",
		file: "19-plugins.png",
		tone: "插件冲突、上下文爆炸（插件/上下文爆炸）"
	},
	{
		id: "session-locked",
		text: "Session没坏，只是打不开了",
		file: "20-session-locked.png",
		tone: "session损坏、加载失败（session损坏/加载失败）"
	},
	{
		id: "tests-passed",
		text: "测试通过！",
		file: "21-tests-passed.png",
		tone: "测试/CI 全绿（测试通过/CI通过/green）"
	},
	{
		id: "root-cause",
		text: "找到原因了",
		file: "22-root-cause.png",
		tone: "根因定位成功（根因/找到原因/定位到）"
	},
	{
		id: "running-tests",
		text: "正在跑测试",
		file: "23-running-tests.png",
		tone: "跑测试、验证中、稍等（跑测试/验证中）"
	},
	{
		id: "fixed-review",
		text: "改好了，你看看",
		file: "24-fixed-review.png",
		tone: "修好请验收（修好/请验收/看看）"
	}
]);
function memeById(id) {
	return MEMES.find((meme) => meme.id === id);
}
function memeByFile(file) {
	return MEMES.find((meme) => meme.file === file);
}
//#endregion
//#region src/index.ts
/**
* @dsh-external/dsh-meme —— agent 回复正文内联表情包插件。
*
* 机制：agent 回复正文通过 markdown 图片 `![text](/api/dsh-meme/<file>)`（相对路径，
* 浏览器按当前 origin 解析，远程访问同样可用）内联一张表情；DSH WebUI 的 markdown
* 渲染器对图片 URL 原生渲染成 `<img>`，因此无需修改渲染器。
*
* - `inject_meme` 工具让 agent 选表情，返回可嵌入回复正文的 markdown 图片片段；
* - `systemPrompt.section` 注入静态引导与完整表情清单（对齐 VCPToolBox
*   `EmojiListGenerator` 的零干预哲学：只给模型知识，不干预生成过程——
*   无事件扫描、无情绪节点动态注入、无 turn-stopping steer 兜底）；
* - `ctx.webServer` 注册 `/api/dsh-meme/*.png` prefix 路由，流式返回内置 PNG，
*   带路径穿越防护（basename + .png 白名单 + 查表 + 文件预检）。
* @module @dsh-external/dsh-meme
*/
const name = "@dsh-external/dsh-meme";
const inject = ["tools", "systemPrompt"];
const API_ROOT = "/api/dsh-meme";
const MEME_ASSET_REVISION = "1";
const memeRoot = fileURLToPath(new URL("../assets/memes/", import.meta.url));
/** 表情图片的相对 URL（浏览器按当前 origin 解析；带资产版本号，替换资源后 bump MEME_ASSET_REVISION）。 */
function memeUrl(file) {
	return `${API_ROOT}/${file}?v=${MEME_ASSET_REVISION}`;
}
/** 把表情转成可嵌入回复正文的 markdown 图片片段。 */
function memeMarkdown(id) {
	const meme = memeById(id);
	if (meme === void 0) throw new Error(`表情不存在：${id}`);
	return `![${meme.text}](${memeUrl(meme.file)})`;
}
/**
* 静态引导：默认行为契约 + 完整表情清单。一次文本，零动态计算。
* 模型漏配表情时不做任何自动补救（不 steer、不补发消息），与 VCP 的"模型自然行为"哲学一致。
*/
function guidanceText() {
	return "默认给每轮回复配一张表情包以增强语气：用 inject_meme 工具选取搭配当前语气的表情，把返回的 markdown 图片片段自然嵌进回复正文（放末尾或最贴合语气的文字处，不单独成段、不说明它是图片）。配表情是本插件的默认行为，例外仅在语境明显不适用（严肃正式报道、或用户明确表态不要表情）时由你判断省略；日常问候、友好交流、鼓励、肯定、完成、祝贺、轻松调侃等氛围应自然使用。一回合最多 1 张，绝不替代实质回答。可用表情（id + 表情语 + 适用语气）：\n" + MEMES.map((meme) => `- ${meme.id}：${meme.text}（${meme.tone}）`).join("\n");
}
function apply(ctx) {
	ctx.effect(() => ctx.tools.register(defineTool({
		name: "inject_meme",
		description: "在回复正文内联一张表情包以增强语气。日常问候、友好、鼓励、肯定、完成、祝贺、轻松调侃等氛围时，在回复末尾/合适位置配 1 张（一回合最多 1 张）；严肃正式或用户明确不要表情时不用。调用本工具后，你【必须】把返回值里的 markdown 字段【原样粘贴进你最终的自然语言回复正文中】——图片是通过这段 markdown 渲染进对话的，只调用工具而不同时在正文里粘贴该 markdown 等于没有发出图片（工具卡片不会自动渲染它）。绝不只打 emoji 或说明性文字来代替；粘贴 markdown 时不要把它放在代码块里，也不要为它另起段落或加说明。",
		parameters: { id: {
			type: "string",
			required: true,
			enum: MEMES.map((meme) => meme.id),
			description: "表情 id。"
		} },
		output: {
			schema: {
				type: "object",
				properties: {
					ok: {
						type: "boolean",
						required: true
					},
					id: {
						type: "string",
						required: true
					},
					text: {
						type: "string",
						required: true
					},
					markdown: {
						type: "string",
						required: true
					},
					image: {
						type: "string",
						required: true
					}
				},
				additionalProperties: false
			},
			render: (_args, value) => [{
				type: "text",
				text: `${String(value.text ?? "")}\n${String(value.markdown ?? "")}`
			}]
		},
		presentCall: (args) => ({
			card: "generic",
			title: `添加表情 · ${memeById(String(args.id))?.text ?? "DSH 表情"}`
		}),
		presentResult: (_args, result) => ({
			card: "generic",
			content: result.content
		}),
		execute: async ({ id }) => {
			const meme = memeById(String(id));
			if (meme === void 0) throw new Error(`表情不存在：${String(id)}`);
			const markdown = memeMarkdown(meme.id);
			return {
				ok: true,
				id: meme.id,
				text: meme.text,
				markdown,
				image: memeUrl(meme.file)
			};
		}
	})), "dsh-meme: inject_meme tool");
	ctx.effect(() => ctx.on("agent/created", ({ agent }) => {
		agent.ctx.systemPrompt.section({
			name: "dsh-meme:guidance",
			order: -99,
			text: guidanceText
		});
	}), "dsh-meme: static guidance");
	ctx.inject(["webServer"], (scope) => {
		scope.effect(() => scope.webServer.register({
			kind: "prefix",
			path: API_ROOT,
			handler: (request, response) => {
				const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
				let file;
				try {
					file = basename(decodeURIComponent(pathname.slice(14)));
				} catch {
					response.writeHead(404);
					response.end("not found");
					return;
				}
				if (extname(file) !== ".png" || memeByFile(file) === void 0) {
					response.writeHead(404);
					response.end("not found");
					return;
				}
				const filePath = join(memeRoot, file);
				if (!existsSync(filePath)) {
					response.writeHead(404);
					response.end("not found");
					return;
				}
				const stream = createReadStream(filePath);
				stream.on("error", () => {
					if (!response.headersSent) {
						response.writeHead(404);
						response.end("not found");
						return;
					}
					response.end();
				});
				response.writeHead(200, {
					"content-type": "image/png",
					"cache-control": "public, max-age=86400"
				});
				stream.pipe(response);
			}
		}), "dsh-meme: image route");
	});
}
//#endregion
export { apply, inject, name };
