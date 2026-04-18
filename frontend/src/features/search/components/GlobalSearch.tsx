import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, Loader2, MessageSquare, Search, Sparkles, X } from 'lucide-react'
import { useUIStore } from '../../../store/uiStore'
import { useChatStore } from '../../../store/chatStore'
import { useAuthStore } from '../../../store/authStore'
import { Avatar } from '../../../components/shared/Avatar'
import { cn } from '../../../lib/utils'
import { useDebounce } from '../../../hooks/useDebounce'
import { searchGlobalMessagesApi, type MessageSearchResult } from '../../chat/api/chat.api'

type SearchResult = {
  messageId: string
  conversationId: string
  text: string
  createdAt: string
  senderLabel: string
  chatName: string
  chatAvatar: string | null
  chatMeta: string
  isGroup: boolean
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const closeModal = useUIStore(s => s.closeModal)
  const { activeConversationId, conversations } = useChatStore()
  const setActiveConversation = useChatStore(s => s.setActiveConversation)
  const currentUserId = useAuthStore(s => s.user?.id)
  const debouncedQuery = useDebounce(query, 300)

  const conversationMap = useMemo(() => {
    return new Map(conversations.map((conversation) => [conversation.id, conversation]))
  }, [conversations])

  const toResult = useCallback((message: MessageSearchResult): SearchResult => {
    const conversation = conversationMap.get(message.conversationId)
    const isGroup = conversation?.type === 'group'
    const otherUser = conversation?.participants.find((participant) => participant.id !== currentUserId)
    const sender = conversation?.participants.find((participant) => participant.id === message.senderId)

    return {
      messageId: message.messageId,
      conversationId: message.conversationId,
      text: message.text || '',
      createdAt: message.createdAt,
      senderLabel: message.senderId === currentUserId ? 'You' : sender?.name || 'Unknown',
      chatName: isGroup ? conversation?.group?.name || 'Group chat' : otherUser?.name || 'Direct chat',
      chatAvatar: isGroup ? conversation?.group?.avatar || null : otherUser?.avatar || null,
      chatMeta: isGroup ? `${conversation?.participants.length || 0} members` : `@${otherUser?.username || 'chat'}`,
      isGroup: Boolean(isGroup),
    }
  }, [conversationMap, currentUserId])

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim()

    if (!normalizedQuery || normalizedQuery.length < 2) {
      setIsLoading(false)
      setResults([])
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    ;(async () => {
      try {
        const remoteResults = await searchGlobalMessagesApi(normalizedQuery, {
          conversationId: activeConversationId || undefined,
          limit: 30,
          signal: controller.signal,
        })
        setResults(remoteResults.map(toResult))
      } catch (_error) {
        if (controller.signal.aborted) return
        setResults([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [activeConversationId, currentUserId, debouncedQuery, toResult])

  const subtitle = useMemo(() => {
    if (activeConversationId) {
      const conversation = conversationMap.get(activeConversationId)
      if (!conversation) return 'Searching in the selected conversation.'

      if (conversation.type === 'group') {
        return `Searching in ${conversation.group?.name || 'Group chat'}`
      }

      const otherUser = conversation.participants.find((participant) => participant.id !== currentUserId)
      return `Searching in ${otherUser?.name || 'Direct chat'}`
    }

    return 'Searching across all conversations'
  }, [activeConversationId, conversationMap, currentUserId])

  const openChat = (conversationId: string) => {
    setActiveConversation(conversationId)
    closeModal()
  }

  const hasResults = results.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/50 px-3 sm:px-4" onClick={closeModal}>
      <div
        className="w-full max-w-160 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-linear-to-r from-raised to-surface">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles size={14} className="text-text-secondary" />
            Search messages
          </div>
          <button onClick={closeModal} className="p-1.5 hover:bg-raised rounded-md text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-border space-y-2">
          <p className="text-xs text-text-secondary">{subtitle}</p>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-text-tertiary" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages in this conversation"
              className="w-full h-11 bg-raised rounded-xl pl-9 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-none"
              disabled={!activeConversationId}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 p-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-surface"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {hasResults && (
            <div className="space-y-1">
              {results.map((result) => {
                return (
                  <button
                    key={result.messageId}
                    type="button"
                    onClick={() => openChat(result.conversationId)}
                    className="w-full rounded-xl border border-transparent px-3 py-2.5 flex items-center gap-3 text-left hover:bg-raised hover:border-border transition-colors"
                  >
                    <Avatar src={result.chatAvatar} fallback={result.chatName} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground truncate">{result.chatName}</p>
                        <span className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full',
                          result.isGroup ? 'bg-raised text-text-secondary' : 'bg-accent/10 text-accent-foreground'
                        )}>
                          {result.isGroup ? 'Group' : 'Direct'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{result.chatMeta}</p>
                      <p className="text-xs text-text-tertiary truncate mt-0.5">{result.text}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-text-tertiary">
                        <span>{result.senderLabel}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} />
                          {new Date(result.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {isLoading && (
            <div className="py-12 px-4 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-raised flex items-center justify-center text-text-secondary">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">Searching messages</p>
              <p className="text-xs text-text-secondary mt-1">Fetching matches from backend search.</p>
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="py-12 px-4 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-raised flex items-center justify-center text-text-secondary">
                <MessageSquare size={18} />
              </div>
              <p className="text-sm font-medium text-foreground">
                {debouncedQuery.trim().length < 2 ? 'Type at least 2 characters' : 'No messages found'}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {debouncedQuery.trim().length < 2
                  ? 'Search runs through backend indexing when your query is longer.'
                  : 'Try another word or phrase.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
