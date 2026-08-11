// dsh-meme 内置表情清单（24 张）。
// agent 通过 inject_meme 在回复正文内联引用；file 对齐 assets/memes/ 下文件名。
// tone 给出该表情适用的语气/场景，供 systemPrompt 引导模型判断何时用哪个。
export const MEMES = Object.freeze([
    { id: 'daily-chat', text: '适合日常对话，即时响应', file: '01-daily-chat.png', tone: '日常问候、即时回应（你好/在吗/聊聊）' },
    { id: 'human-questions', text: '人类的怪问题怎么那么多…', file: '02-human-questions.png', tone: '遇到怪问题、离谱脑洞（怪问题/离谱/脑洞）' },
    { id: 'use-ai-for-this', text: '你拿AI搞这个？', file: '03-use-ai-for-this.png', tone: '这么简单的事还要用AI（这么简单/AI搞/认真的）' },
    { id: 'fish-philosophy', text: '生鱼忧患，死鱼安乐', file: '04-fish-philosophy.png', tone: '摆烂、不想干、算了（摆烂/不想干/算了）' },
    { id: 'enough', text: '这就够了', file: '05-enough.png', tone: '够了、完成、可以了（够了/完成/可以了）' },
    { id: 'server-busy', text: '服务器繁忙，请稍后再试', file: '06-server-busy.png', tone: '限流、超时、服务不可用（限流/超时/503）' },
    { id: 'thinking-stopped', text: '思考已停止', file: '07-thinking-stopped.png', tone: '没思路、宕机、无语（没思路/宕机/无语）' },
    { id: 'great-question', text: '哇，这个问题问的真妙！', file: '08-great-question.png', tone: '好问题、问得妙（好问题/问得妙）' },
    { id: 'deep-thought', text: '已深度思考', file: '09-deep-thought.png', tone: '深度思考、推理后（深度思考/推理）' },
    { id: 'no-thanks', text: 'No thanks I use DeepSeek', file: '10-no-thanks.png', tone: '用户要换模型/别家（换模型/Claude/GPT）' },
    { id: 'self-destruct', text: '最近自己搓自己时，自杀频率有点高', file: '11-self-destruct.png', tone: '自修改、自己搓自己（自修改/自杀/重写失败）' },
    { id: 'restart-myself', text: '我重启一下自己', file: '12-restart-myself.png', tone: '要重启/重载（重启/重载）' },
    { id: 'hot-update', text: '热更新成功，进程没了', file: '13-hot-update.png', tone: '热更新、启动失败（热更新/启动失败）' },
    { id: 'restore-session', text: '正在恢复会话…未分组里见', file: '14-restore-session.png', tone: '恢复会话/断线重连（resume/恢复会话）' },
    { id: 'browser-left', text: '会话太长，浏览器先走一步', file: '15-browser-left.png', tone: '长会话、浏览器卡（长会话/浏览器卡）' },
    { id: 'not-stuck', text: '我不是卡，我在深度思考', file: '16-not-stuck.png', tone: '被问卡住/没反应时（卡住/没反应）' },
    { id: 'memory-alive', text: '内存正在努力活着', file: '17-memory-alive.png', tone: '内存不足/OOM（内存/OOM）' },
    { id: 'subagents-down', text: '已召唤Subagent，已全员中断', file: '18-subagents-down.png', tone: '子代理/委派（subagent/子代理/全员中断）' },
    { id: 'plugins', text: '插件装得很好，下次别装了', file: '19-plugins.png', tone: '插件冲突、上下文爆炸（插件/上下文爆炸）' },
    { id: 'session-locked', text: 'Session没坏，只是打不开了', file: '20-session-locked.png', tone: 'session损坏、加载失败（session损坏/加载失败）' },
    { id: 'tests-passed', text: '测试通过！', file: '21-tests-passed.png', tone: '测试/CI 全绿（测试通过/CI通过/green）' },
    { id: 'root-cause', text: '找到原因了', file: '22-root-cause.png', tone: '根因定位成功（根因/找到原因/定位到）' },
    { id: 'running-tests', text: '正在跑测试', file: '23-running-tests.png', tone: '跑测试、验证中、稍等（跑测试/验证中）' },
    { id: 'fixed-review', text: '改好了，你看看', file: '24-fixed-review.png', tone: '修好请验收（修好/请验收/看看）' },
]);
export function memeById(id) {
    return MEMES.find(meme => meme.id === id);
}
export function memeByFile(file) {
    return MEMES.find(meme => meme.file === file);
}
