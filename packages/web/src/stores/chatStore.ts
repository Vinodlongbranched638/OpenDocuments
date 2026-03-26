import { create } from 'zustand'
import type { ChatMessage, SearchResult, ConfidenceResult } from '../lib/types'

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentStreamText: string
  currentSources: SearchResult[]
  currentConfidence: ConfidenceResult | null

  addUserMessage: (content: string) => void
  startStreaming: () => void
  appendStreamChunk: (text: string) => void
  setSources: (sources: SearchResult[]) => void
  setConfidence: (confidence: ConfidenceResult) => void
  finishStreaming: (profile: string) => void
  clearMessages: () => void
}

let messageCounter = 0

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',
  currentSources: [],
  currentConfidence: null,

  addUserMessage: (content) => {
    set((s) => ({
      messages: [...s.messages, {
        id: `msg-${++messageCounter}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      }],
    }))
  },

  startStreaming: () => set({
    isStreaming: true,
    currentStreamText: '',
    currentSources: [],
    currentConfidence: null,
  }),

  appendStreamChunk: (text) => set((s) => ({
    currentStreamText: s.currentStreamText + text,
  })),

  setSources: (sources) => set({ currentSources: sources }),

  setConfidence: (confidence) => set({ currentConfidence: confidence }),

  finishStreaming: (profile) => {
    const state = get()
    set((s) => ({
      messages: [...s.messages, {
        id: `msg-${++messageCounter}`,
        role: 'assistant',
        content: state.currentStreamText,
        sources: state.currentSources,
        confidence: state.currentConfidence || undefined,
        profile,
        timestamp: Date.now(),
      }],
      isStreaming: false,
      currentStreamText: '',
      currentSources: [],
      currentConfidence: null,
    }))
  },

  clearMessages: () => set({ messages: [], isStreaming: false, currentStreamText: '' }),
}))
