import { AlertTriangle, Ban, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useUIStore } from '../../../../store/uiStore'
import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { Avatar } from '../../../../components/shared/Avatar'
import { blockUserApi, unblockUserApi } from '../../../profile/api/profile.api'

export function BlockContactModal() {
  const closeModal = useUIStore((state) => state.closeModal)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const conversation = useChatStore((state) => state.conversations.find((item) => item.id === activeConversationId))
  const updateConversation = useChatStore((state) => state.updateConversation)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const targetUser = useMemo(() => {
    if (!conversation || conversation.type !== 'direct') return null
    return conversation.participants.find((participant) => participant.id !== currentUserId) || null
  }, [conversation, currentUserId])

  const isBlocked = Boolean(conversation?.isBlocked)

  if (!targetUser || !conversation || conversation.type !== 'direct') return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      if (isBlocked) {
        await unblockUserApi(targetUser.id)
        updateConversation(conversation.id, { isBlocked: false })
        toast.success('Contact unblocked')
      } else {
        await blockUserApi(targetUser.id)
        updateConversation(conversation.id, { isBlocked: true })
        toast.success('Contact blocked')
      }
      closeModal()
    } catch {
      // API interceptor already shows the error.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeModal}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">{isBlocked ? 'Unblock contact' : 'Block contact'}</p>
            <h2 className="text-lg font-semibold text-foreground">{isBlocked ? 'Allow this person again?' : 'Block this contact?'}</h2>
          </div>
          <button type="button" onClick={closeModal} className="rounded-lg p-2 text-text-secondary hover:bg-raised hover:text-foreground" aria-label="Close block confirmation">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-page p-3">
            <Avatar src={targetUser.avatar} fallback={targetUser.name} size="md" isOnline={targetUser.status === 'online'} showOnlineDot />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{targetUser.name}</p>
              <p className="truncate text-xs text-text-secondary">@{targetUser.username || targetUser.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{isBlocked ? 'This contact is currently blocked.' : 'Blocking will hide their profile details and prevent new messages.'}</p>
              <p className="text-sm text-current/80">
                {isBlocked
                  ? 'Unblocking will allow their profile and messaging to work again.'
                  : 'They will not be able to view your profile details or send you messages while blocked.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={closeModal} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-raised">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Ban size={16} />
            {isSubmitting ? 'Working...' : (isBlocked ? 'Unblock contact' : 'Block contact')}
          </button>
        </div>
      </div>
    </div>
  )
}