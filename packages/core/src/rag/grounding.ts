import type { SearchResult } from '../ingest/document-store.js'

const STOPWORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'been', 'will', 'they',
  'their', 'there', 'what', 'when', 'where', 'which', 'about', 'into',
  'more', 'some', 'than', 'them', 'then', 'these', 'very', 'also',
  'just', 'only', 'other', 'such',
])

export interface GroundingResult {
  groundedSentences: number
  ungroundedSentences: number
  totalSentences: number
  warnings: string[]
  annotatedAnswer: string
}

/**
 * Check if each sentence in the answer is grounded in the retrieved sources.
 * Uses simple word overlap heuristic (not LLM-based).
 */
export function checkGrounding(
  answer: string,
  sources: SearchResult[],
  strictMode = false
): GroundingResult {
  const sentences = splitSentences(answer)
  const sourceText = sources.map(s => s.content.toLowerCase()).join(' ')
  const sourceWords = new Set(sourceText.split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w)))

  let grounded = 0
  let ungrounded = 0
  const warnings: string[] = []
  const annotated: string[] = []

  for (const sentence of sentences) {
    const sentenceWords = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w))
    if (sentenceWords.length === 0) {
      annotated.push(sentence)
      continue
    }

    const overlap = sentenceWords.filter(w => sourceWords.has(w)).length
    const coverage = overlap / sentenceWords.length

    // Threshold: at least 40% of significant words should appear in sources
    const threshold = strictMode ? 0.5 : 0.4

    if (coverage >= threshold) {
      grounded++
      annotated.push(sentence)
    } else {
      ungrounded++
      if (strictMode) {
        warnings.push(`Unverified: "${sentence.substring(0, 80)}..."`)
        annotated.push(`[unverified] ${sentence}`)
      } else {
        annotated.push(sentence)
      }
    }
  }

  return {
    groundedSentences: grounded,
    ungroundedSentences: ungrounded,
    totalSentences: grounded + ungrounded,
    warnings,
    annotatedAnswer: annotated.join(' '),
  }
}

function splitSentences(text: string): string[] {
  // Split on period/question/exclamation followed by space or end
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}
