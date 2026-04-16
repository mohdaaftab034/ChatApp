import { AppShell } from '../../chat/components/layout/AppShell'
import { ContactsList } from '../components/ContactsList'
import { AddContactSection } from '../components/AddContactSection'

export default function ContactsPage() {
  return (
    <div className="flex h-screen w-full bg-page">
      <AppShell>
        <div className="flex-1 flex min-w-0 h-full w-full">
          <ContactsList />
          <AddContactSection />
        </div>
      </AppShell>
    </div>
  )
}
