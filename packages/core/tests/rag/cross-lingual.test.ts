import { describe, it, expect } from 'vitest'
import { expandQuery, reciprocalRankFusion } from '../../src/rag/cross-lingual.js'

describe('Cross-Lingual', () => {
  it('expands Korean query with English terms', () => {
    const expanded = expandQuery('인증 설정 방법')
    expect(expanded.length).toBeGreaterThan(1)
    expect(expanded[1]).toContain('authentication')
  })

  it('expands English query with Korean terms', () => {
    const expanded = expandQuery('How to configure authentication')
    expect(expanded.length).toBeGreaterThan(1)
    expect(expanded[1]).toContain('인증')
  })

  it('does not expand when no matching terms', () => {
    const expanded = expandQuery('hello world')
    expect(expanded).toHaveLength(1)
  })

  it('RRF merges multiple result sets', () => {
    const set1 = [{ id: 'a', score: 0.9 }, { id: 'b', score: 0.8 }]
    const set2 = [{ id: 'b', score: 0.95 }, { id: 'c', score: 0.7 }]
    const merged = reciprocalRankFusion([set1, set2])
    // 'b' appears in both sets, should rank highest
    expect(merged[0].id).toBe('b')
    expect(merged.length).toBe(3)
  })
})
