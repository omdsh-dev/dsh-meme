import { describe, expect, it } from 'vitest'
import { readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MEMES, memeById, memeByFile } from '../src/catalog.ts'

const memeRoot = fileURLToPath(new URL('../assets/memes/', import.meta.url))

describe('dsh-meme catalog', () => {
  it('offers the full 24-slot DSH-theme meme pack', () => {
    expect(MEMES).toHaveLength(24)
    const ids = MEMES.map(meme => meme.id)
    expect(ids).toEqual(expect.arrayContaining([
      'daily-chat', 'human-questions', 'tests-passed', 'root-cause', 'running-tests', 'fixed-review',
    ]))
  })

  it('keeps every id unique', () => {
    const ids = MEMES.map(meme => meme.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps every file unique and mappable through both lookups', () => {
    const files = MEMES.map(meme => meme.file)
    expect(new Set(files).size).toBe(files.length)
    for (const meme of MEMES) {
      expect(memeById(meme.id)?.file).toBe(meme.file)
      expect(memeByFile(meme.file)?.id).toBe(meme.id)
    }
  })

  it('has a matching PNG present on disk for every catalog file', () => {
    for (const meme of MEMES) {
      expect(existsSync(join(memeRoot, meme.file))).toBe(true)
    }
  })

  it('catalog file set exactly equals the shipped asset directory', () => {
    const onDisk = readdirSync(memeRoot).filter(name => name.endsWith('.png'))
    const inCatalog = MEMES.map(meme => meme.file)
    expect(inCatalog.sort()).toEqual(onDisk.sort())
  })

  it('returns undefined for unknown ids and unknown files', () => {
    expect(memeById('nope')).toBeUndefined()
    expect(memeByFile('99-unknown.png')).toBeUndefined()
  })
})
