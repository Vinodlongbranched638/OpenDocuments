import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import type { RAGProfile } from '../../lib/types'

interface Props {
  onSend: (query: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { profile, setProfile } = useAppStore()

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 placeholder-gray-400"
          style={{ minHeight: '42px', maxHeight: '120px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? '...' : 'Send'}
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <select className="text-xs bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-0.5 text-gray-400">
          <option value="">All sources</option>
          <option value="local">Local</option>
          <option value="github">GitHub</option>
          <option value="notion">Notion</option>
          <option value="web">Web</option>
        </select>
        <span className="text-gray-400">Profile:</span>
        {(['fast', 'balanced', 'precise'] as RAGProfile[]).map((p) => (
          <button
            key={p}
            onClick={() => setProfile(p)}
            className={`px-2 py-0.5 rounded transition-colors ${
              profile === p
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
