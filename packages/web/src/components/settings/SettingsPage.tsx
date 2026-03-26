import { useAppStore } from '../../stores/appStore'
import { useEffect, useState } from 'react'
import { getHealth } from '../../lib/api'
import type { RAGProfile } from '../../lib/types'

export function SettingsPage() {
  const { profile, setProfile, theme, setTheme } = useAppStore()
  const [version, setVersion] = useState('')

  useEffect(() => {
    getHealth().then(h => setVersion(h.version)).catch(() => {})
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Version */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Version</label>
          <p className="text-sm">{version || 'Loading...'}</p>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Theme</label>
          <div className="flex gap-2">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  theme === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* RAG Profile */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">RAG Profile</label>
          <div className="flex gap-2">
            {(['fast', 'balanced', 'precise'] as RAGProfile[]).map((p) => (
              <button
                key={p}
                onClick={() => setProfile(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  profile === p
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {profile === 'fast' ? 'Quick answers, minimal resources' :
             profile === 'balanced' ? 'Recommended for most use cases' :
             'Thorough search, more resources'}
          </p>
        </div>
      </div>
    </div>
  )
}
