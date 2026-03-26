import { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { useAppStore } from './stores/appStore'

// Lazy page placeholders (will be replaced in T4/T5)
function ChatPlaceholder() {
  return <div className="p-8 text-gray-500">Chat page (coming next)</div>
}
function DocumentsPlaceholder() {
  return <div className="p-8 text-gray-500">Documents page</div>
}
function SettingsPlaceholder() {
  return <div className="p-8 text-gray-500">Settings page</div>
}
function HealthPlaceholder() {
  return <div className="p-8 text-gray-500">Health page</div>
}

const PAGES: Record<string, () => JSX.Element> = {
  chat: ChatPlaceholder,
  documents: DocumentsPlaceholder,
  settings: SettingsPlaceholder,
  health: HealthPlaceholder,
}

export function App() {
  const { currentPage, effectiveTheme } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
  }, [effectiveTheme])

  const Page = PAGES[currentPage] || ChatPlaceholder

  return (
    <Layout>
      <Page />
    </Layout>
  )
}
