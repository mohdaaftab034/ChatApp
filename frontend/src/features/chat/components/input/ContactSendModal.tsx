import { Loader2, Search, Send, UserRound, X } from 'lucide-react'
import { Avatar } from '../../../../components/shared/Avatar'
import { User } from '../../../../types/user.types'

interface ContactSendModalProps {
  query: string
  onQueryChange: (value: string) => void
  results: User[]
  selectedContact: User | null
  isSearching: boolean
  isSending: boolean
  onSelectContact: (user: User) => void
  onCancel: () => void
  onSend: () => void
}

export function ContactSendModal({
  query,
  onQueryChange,
  results,
  selectedContact,
  isSearching,
  isSending,
  onSelectContact,
  onCancel,
  onSend,
}: ContactSendModalProps) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-3 sm:absolute sm:inset-auto sm:bottom-full sm:left-1/2 sm:mb-3 sm:w-[min(92vw,460px)] sm:-translate-x-1/2 sm:bg-transparent sm:p-0 sm:pointer-events-none">
      <div className="flex h-[86dvh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:pointer-events-auto sm:h-auto sm:max-h-[80vh] sm:w-full">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Share contact</p>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-text-secondary hover:bg-raised hover:text-foreground"
            aria-label="Close contact picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col bg-page p-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search registered users"
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {isSearching && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-secondary">
              <Loader2 size={14} className="animate-spin" />
              Searching users...
            </div>
          )}

          <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-surface">
            {results.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-secondary">No users found</div>
            ) : (
              results.map((user) => {
                const isActive = selectedContact?.id === user.id
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onSelectContact(user)}
                    className={`flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 ${isActive ? 'bg-raised' : 'hover:bg-raised'}`}
                  >
                    <Avatar src={user.avatar} fallback={user.name} size="md" isOnline={user.status === 'online'} showOnlineDot />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-text-secondary">@{user.username || user.email}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <UserRound size={16} />
              Selected contact
            </p>
            {selectedContact ? (
              <div className="mt-2">
                <p className="text-sm text-foreground">{selectedContact.name}</p>
                <p className="text-xs text-text-secondary">@{selectedContact.username || '-'}</p>
                <p className="text-xs text-text-secondary">{selectedContact.email}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-text-secondary">Choose a user to send their contact.</p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-raised"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={isSending || !selectedContact}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? 'Sending...' : 'Send contact'}
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
