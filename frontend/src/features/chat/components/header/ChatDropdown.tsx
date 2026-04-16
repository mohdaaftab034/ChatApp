import { Info, VolumeX, Trash2, Ban } from 'lucide-react'
import { useUIStore } from '../../../../store/uiStore'
import { useChatStore } from '../../../../store/chatStore'

interface ChatDropdownProps {
  onClose: () => void;
}

export function ChatDropdown({ onClose }: ChatDropdownProps) {
  const openProfilePanel = useUIStore(s => s.openProfilePanel)
  const openRightPanel = useUIStore(s => s.openRightPanel)
  const openModal = useUIStore(s => s.openModal)
  const activeConversationId = useChatStore(s => s.activeConversationId)
  const conversation = useChatStore(s => s.conversations.find((item) => item.id === activeConversationId))

  return (
    <div className="absolute right-0 top-full mt-2 bg-surface rounded-xl shadow-lg border border-border w-56 animate-in zoom-in-95 fade-in duration-200 z-50 overflow-hidden">
      <div className="flex flex-col py-1">
        <button 
          onClick={() => {
            if (activeConversationId) {
              openProfilePanel(activeConversationId)
            } else {
              openRightPanel()
            }
            onClose()
          }}
          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-raised transition-colors text-left"
        >
          <Info size={16} className="text-text-secondary" />
          Contact Info
        </button>
        {conversation?.type === 'group' && (
          <button 
            onClick={() => {
              openModal('groupSettings')
              onClose()
            }}
            className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-raised transition-colors text-left"
          >
            <Info size={16} className="text-text-secondary" />
            Group Settings
          </button>
        )}
        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-raised transition-colors text-left"
        >
          <VolumeX size={16} className="text-text-secondary" />
          Mute Notifications
        </button>
        <div className="h-px bg-border my-1" />
        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-raised transition-colors text-left"
        >
          <Trash2 size={16} className="text-text-secondary" />
          Clear Message History
        </button>
        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-raised transition-colors text-left"
        >
          <Ban size={16} />
          Block Contact
        </button>
      </div>
    </div>
  )
}
