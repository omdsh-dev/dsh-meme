export interface Meme {
    readonly id: string;
    readonly text: string;
    readonly file: string;
    /** 建议使用的语气/场景（来自原 dsh-stickers 的 text + triggers）。 */
    readonly tone: string;
}
export declare const MEMES: readonly Meme[];
export declare function memeById(id: string): Meme | undefined;
export declare function memeByFile(file: string): Meme | undefined;
