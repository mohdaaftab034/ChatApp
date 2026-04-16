import { AppShell } from '../../chat/components/layout/AppShell'

export default function SearchPage() {
  return (
    <div className="flex h-screen w-full bg-page">
      <AppShell>
        <div className="flex-1 flex flex-col h-full bg-page items-center justify-center">
          <h1 className="text-xl font-semibold mb-2 text-foreground">Search functionality is available as an overlay</h1>
          <p className="text-sm text-text-secondary">Please use the sidebar icon to trigger search.</p>
        </div>
      </AppShell>
    </div>
  )
}
