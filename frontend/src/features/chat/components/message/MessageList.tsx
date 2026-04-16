import { useChatStore } from '../../../../store/chatStore'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../../../store/authStore'
import { markRead } from '../../hooks/useSocket'
import { Check, CheckCheck, FileText, Loader2, MapPin, Trash2, UserRound } from 'lucide-react'
import { deleteMessageApi } from '../../api/messages.api'
import { useUIStore } from '../../../../store/uiStore'
import { useNavigate } from 'react-router-dom'

export function MessageList() {
  const { activeConversationId, messages, conversations, deleteMessage } = useChatStore()
  const openImageViewer = useUIStore((state) => state.openImageViewer)
  const currentUserId = useAuthStore(s => s.user?.id) || '1'
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
  const [pendingDelete, setPendingDelete] = useState<{ messageId: string; conversationId: string } | null>(null)
  const navigate = useNavigate()
  
  const conversationMessages = activeConversationId ? (messages[activeConversationId] || []) : []
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId)
  const isGroupConversation = activeConversation?.type === 'group'
  const otherParticipantIds = (activeConversation?.participants || [])
    .map((participant) => participant.id)
    .filter((participantId) => participantId !== currentUserId)

  const getSenderName = (senderId: string) => {
    if (senderId === currentUserId) return 'You'
    const sender = activeConversation?.participants.find((participant) => participant.id === senderId)
    return sender?.name || 'Unknown'
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDeleteMessage = async (messageId: string, conversationId: string) => {
    try {
      const result = await deleteMessageApi(messageId)
      deleteMessage(conversationId, result.message.id)
      setPendingDelete(null)
    } catch (_error) {
      // Global axios error handler already surfaces this.
    }
  }

  const getMessageStatus = (message: (typeof conversationMessages)[number]) => {
    if (!otherParticipantIds.length) return 'sent'

    const hasBeenSeen = otherParticipantIds.some((participantId) => message.readBy.includes(participantId))
    if (hasBeenSeen) return 'seen'

    const hasBeenDelivered = otherParticipantIds.every((participantId) => message.deliveredTo.includes(participantId))
    if (hasBeenDelivered) return 'delivered'

    return 'sent'
  }

  const scrollToBottom = () => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    bottomAnchorRef.current?.scrollIntoView({ block: 'end' })
  }

  useLayoutEffect(() => {
    // Keep the latest messages in view before paint.
    scrollToBottom()
  }, [activeConversationId, conversationMessages.length])

  useEffect(() => {
    // Some message content (images) can resize after initial paint.
    const frameA = requestAnimationFrame(scrollToBottom)
    const frameB = requestAnimationFrame(scrollToBottom)

    return () => {
      cancelAnimationFrame(frameA)
      cancelAnimationFrame(frameB)
    }
  }, [activeConversationId, conversationMessages.length])

  useEffect(() => {
    if (!activeConversationId || !currentUserId) return

    const unreadIncoming = conversationMessages
      .filter((message) => message.senderId !== currentUserId && !message.readBy.includes(currentUserId))
      .map((message) => message.id)

    if (unreadIncoming.length > 0) {
      markRead(unreadIncoming)
    }
  }, [activeConversationId, conversationMessages, currentUserId])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-2 w-full"
      onLoadCapture={(event) => {
        if (event.target instanceof HTMLImageElement) {
          scrollToBottom()
        }
      }}
    >
      {conversationMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-text-secondary text-sm">
          No messages yet. Send a message to start the conversation!
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-4">
          {conversationMessages.map((msg) => {
            const isSent = msg.senderId === currentUserId
            const isAudioMessage = msg.type === 'audio'
            const senderName = getSenderName(msg.senderId)
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group flex flex-col max-w-[70%] ${isSent ? 'items-end' : 'items-start'}`}>
                  {isGroupConversation && (
                    <p className={`mb-1 px-1 text-[11px] font-medium text-text-secondary ${isSent ? 'text-right' : 'text-left'}`}>
                      {senderName}
                    </p>
                  )}
                  <div className={`relative text-sm ${
                    isAudioMessage
                      ? ''
                      : isSent
                        ? 'px-3 py-2 rounded-[18px] bg-foreground text-surface rounded-br-sm'
                        : 'px-3 py-2 rounded-[18px] bg-surface border border-border text-foreground rounded-bl-sm'
                  }`}>
                    {msg.isDeleted ? (
                      <span className="italic text-text-secondary">Message deleted</span>
                    ) : msg.type === 'image' && (msg.mediaUrl || msg.localPreviewUrl) ? (
                      <button
                        type="button"
                        onClick={() => msg.mediaUrl && openImageViewer(msg.mediaUrl)}
                        className="block overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Open image"
                      >
                        <div className="relative">
                          <img
                            src={msg.mediaUrl || msg.localPreviewUrl}
                            alt={msg.text || 'Sent image'}
                            className="max-h-72 w-full min-w-48 object-cover"
                          />
                          {msg.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white">
                                <Loader2 size={22} className="animate-spin" />
                              </div>
                            </div>
                          )}
                        </div>
                        {msg.text && (
                          <div className="px-2 py-2 text-sm">
                            {msg.text}
                          </div>
                        )}
                      </button>
                    ) : msg.type === 'audio' ? (
                      <div className="relative min-w-56">
                        {msg.mediaUrl || msg.localPreviewUrl ? (
                          <audio
                            controls
                            src={msg.mediaUrl || msg.localPreviewUrl}
                            controlsList="nodownload noplaybackrate noremoteplayback"
                            className="w-full audio-message-player"
                          />
                        ) : (
                          <p className="text-sm text-text-secondary">Voice message</p>
                        )}
                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/35 rounded-md">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                              <Loader2 size={20} className="animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : msg.type === 'location' ? (
                      <div className="relative min-w-56 rounded-xl border border-border/70 bg-page px-3 py-2">
                        {msg.location ? (
                          <a
                            href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <p className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                              <MapPin size={14} />
                              {msg.location.label || msg.text || 'Pinned location'}
                            </p>
                            <p className="mt-1 text-xs text-text-secondary">
                              {msg.location.lat.toFixed(6)}, {msg.location.lng.toFixed(6)}
                            </p>
                            <p className="mt-1 text-xs text-accent-foreground">Open in Maps</p>
                          </a>
                        ) : (
                          <p className="text-sm text-text-secondary">Location unavailable</p>
                        )}
                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                              <Loader2 size={20} className="animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : msg.type === 'contact' ? (
                      <div className="relative min-w-56 rounded-xl border border-border/70 bg-page px-3 py-2">
                        {msg.sharedContact ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/profile/${msg.sharedContact?.userId}`)}
                            className="w-full text-left"
                            aria-label={`Open profile for ${msg.sharedContact.name}`}
                          >
                            <p className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                              <UserRound size={14} />
                              {msg.sharedContact.name}
                            </p>
                            <p className="mt-1 text-xs text-text-secondary">
                              @{msg.sharedContact.username || 'user'}
                            </p>
                            {msg.sharedContact.email && (
                              <p className="mt-1 text-xs text-text-secondary">{msg.sharedContact.email}</p>
                            )}
                            {msg.sharedContact.phone && (
                              <p className="mt-1 text-xs text-text-secondary">{msg.sharedContact.phone}</p>
                            )}
                          </button>
                        ) : (
                          <p className="text-sm text-text-secondary">Shared contact</p>
                        )}
                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                              <Loader2 size={20} className="animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : msg.type === 'file' ? (
                      <div className="relative">
                        <a
                          href={msg.mediaUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={msg.fileName || true}
                          className="flex min-w-56 items-center gap-3 rounded-xl border border-border/70 bg-page px-3 py-2"
                          onClick={(event) => {
                            if (!msg.mediaUrl) {
                              event.preventDefault()
                            }
                          }}
                        >
                          <div className="rounded-lg bg-raised p-2 text-foreground">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {msg.fileName || msg.text || 'Document'}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {formatFileSize(msg.fileSize) || 'Document'}
                            </p>
                          </div>
                        </a>
                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                              <Loader2 size={20} className="animate-spin" />
                            </div>
                          </div>
                        )}
                        {msg.text && (
                          <div className="px-1 pt-2 text-sm">
                            {msg.text}
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}

                    {isSent && !msg.isDeleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ messageId: msg.id, conversationId: msg.conversationId })}
                          className="absolute -right-2 -top-2 inline-flex rounded-full border border-border bg-surface p-1 text-destructive shadow-sm hover:bg-raised md:hidden"
                          aria-label="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ messageId: msg.id, conversationId: msg.conversationId })}
                          className="absolute -right-2 -top-2 hidden rounded-full border border-border bg-surface p-1 text-destructive shadow-sm hover:bg-raised group-hover:inline-flex md:inline-flex"
                          aria-label="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className={`mt-1 flex items-center gap-1 text-[11px] text-text-tertiary ${isSent ? 'pr-1 justify-end' : 'pl-1 justify-start'}`}>
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {isSent && !msg.isDeleted && (() => {
                      const status = getMessageStatus(msg)

                      if (status === 'sent') {
                        return <Check size={13} className="text-text-tertiary" />
                      }

                      if (status === 'delivered') {
                        return <CheckCheck size={13} className="text-text-tertiary" />
                      }

                      return <CheckCheck size={13} className="text-sky-500" />
                    })()}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomAnchorRef} aria-hidden="true" />
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-foreground">Delete message?</h4>
            <p className="mt-2 text-sm text-text-secondary">
              This message will be deleted for everyone in the conversation.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(pendingDelete.messageId, pendingDelete.conversationId)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
