window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-meme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
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
		//#endregion
		//#region \0dsh-css:D:\github\DeepSeek\dsh-meme\src\client\MemeCard.module.css.mjs
		const css = ".dfz3lW_card{width:min(160px,48vw);margin:8px 0;display:inline-block}.dfz3lW_card span{color:var(--dsw-alias-label-tertiary,#888);margin-bottom:6px;font-size:12px;display:block}.dfz3lW_card img{object-fit:contain;border-radius:8px;width:100%;height:auto;display:block}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"@dsh-external/dsh-meme/MemeCard.module.css\"]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-meme";
			tag.dataset.pluginCss = "@dsh-external/dsh-meme/MemeCard.module.css";
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var MemeCard_module_css_default = { "card": "dfz3lW_card" };
		//#endregion
		//#region src/client/MemeCard.tsx
		const MEME_ASSET_REVISION = "1";
		const API_ROOT = "/api/dsh-meme";
		/** 从工具调用 slice 解析 meme id（运行中 block.argsRaw / 结算 block.call.argsRaw）。 */
		function idFromBlock(block) {
			const raw = ("kind" in block ? block.call?.argsRaw : block.argsRaw) ?? "";
			if (raw === "") return void 0;
			try {
				return String(JSON.parse(raw).id ?? "");
			} catch {
				return String(raw).trim();
			}
		}
		/** keyed toolview 卡片：把 inject_meme 本次调用渲染成一张表情图。 */
		function MemeCard({ block }) {
			const meme = memeById(idFromBlock(block) ?? "");
			if (meme === void 0) return null;
			const src = `${API_ROOT}/${meme.file}?v=${MEME_ASSET_REVISION}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
				className: MemeCard_module_css_default.card,
				"data-meme-id": meme.id,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: meme.text }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					src,
					alt: meme.text,
					loading: "lazy"
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots"];
		/**
		* browser client half：把 inject_meme 工具的调用卡片注册到 `tool.call.toolview`
		* keyed hole（按 wire Tool name 分发），让工具调用在会话里直接渲染成表情图。
		* 即使 agent 忘了把 markdown 粘贴进正文，用户在工具卡片里也能直接看到这张表情，
		* 不依赖模型纪律（方案 B）。
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
				name: "tool.call.toolview",
				key: "inject_meme"
			}, MemeCard)), "dsh-meme: toolview card");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
