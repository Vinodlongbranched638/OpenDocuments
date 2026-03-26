import ReactMarkdown from 'react-markdown'
import { SourceCard } from './SourceCard'
import type { ChatMessage as ChatMessageType } from '../../lib/types'

interface Props {
  message: ChatMessageType
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-bold shrink-0">
          O
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-primary-600 dark:[&_code]:text-primary-400 [&_pre_code]:text-gray-100">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.sources.map((source, i) => (
              <SourceCard key={i} source={source} />
            ))}
          </div>
        )}

        {/* Confidence badge */}
        {message.confidence && (
          <div className="mt-1.5">
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
              message.confidence.level === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              message.confidence.level === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              message.confidence.level === 'low' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
            }`}>
              Confidence: {message.confidence.level} ({(message.confidence.score * 100).toFixed(0)}%)
            </span>
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1" />
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold shrink-0">
          U
        </div>
      )}
    </div>
  )
}
