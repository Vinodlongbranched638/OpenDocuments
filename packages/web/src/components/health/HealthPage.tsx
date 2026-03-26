import { useState, useEffect } from 'react'
import { getStats, getHealth } from '../../lib/api'
import type { StatsResponse } from '../../lib/types'

export function HealthPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [health, setHealth] = useState<{ status: string; version: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getStats(), getHealth()])
      .then(([s, h]) => { setStats(s); setHealth(h) })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Cannot connect to server: {error}</p>
          <p className="text-xs text-red-400 mt-1">Is <code>opendocs start</code> running?</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">System Health</h2>

      {!stats ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary-600">{stats.documents}</p>
              <p className="text-xs text-gray-400 mt-1">Documents</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary-600">{stats.workspaces}</p>
              <p className="text-xs text-gray-400 mt-1">Workspaces</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary-600">{stats.plugins}</p>
              <p className="text-xs text-gray-400 mt-1">Plugins</p>
            </div>
          </div>

          {/* Server info */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Server</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-500 font-medium">{health?.status || 'unknown'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Version</span>
                <span>{health?.version || '-'}</span>
              </div>
            </div>
          </div>

          {/* Plugins */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Plugins</h3>
            <div className="space-y-1">
              {stats.pluginList.map((p) => (
                <div key={p.name} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-mono text-xs">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{p.type}</span>
                    <span className="text-xs text-gray-500">v{p.version}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
