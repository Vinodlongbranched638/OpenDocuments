import type { SearchResult } from '../../lib/types'

interface Props {
  source: SearchResult
}

export function SourceCard({ source }: Props) {
  const filename = source.sourcePath.split('/').pop() || source.sourcePath

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">
      <span className="text-primary-500">&#x1F4CE;</span>
      <span className="font-medium truncate">{filename}</span>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span>{(source.score * 100).toFixed(0)}% match</span>
      {source.headingHierarchy.length > 0 && (
        <>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="truncate">{source.headingHierarchy[source.headingHierarchy.length - 1]}</span>
        </>
      )}
    </div>
  )
}
