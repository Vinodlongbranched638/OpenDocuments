import { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { useAppStore } from './stores/appStore'
import { ChatPage } from './components/chat/ChatPage'
import { DocumentsPage } from './components/documents/DocumentsPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { HealthPage } from './components/health/HealthPage'

const PAGES: Record<string, () => JSX.Element> = {
  chat: ChatPage,
  documents: DocumentsPage,
  settings: SettingsPage,
  health: HealthPage,
}

export function App() {
  const { currentPage, effectiveTheme } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
  }, [effectiveTheme])

  const Page = PAGES[currentPage] || ChatPage

  return (
    <Layout>
      <Page />
    </Layout>
  )
}
