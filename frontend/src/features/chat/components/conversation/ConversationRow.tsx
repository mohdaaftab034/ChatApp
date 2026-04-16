import { cn } from '../../../../lib/utils'
import { Avatar } from '../../../../components/shared/Avatar'
import { Badge } from '../../../../components/shared/Badge'
import { VolumeX, MapPin, Image, Video, File, Mic, Contact, Link as LinkIcon } from 'lucide-react'
import { Message } from '../../../../types/message.types'
import { useChatStore } from '../../../../store/chatStore'
import { useUIStore } from '../../../../store/uiStore'
import { useNavigate } from 'react-router-dom'

interface ConversationRowProps {
  id: string
  name: string
  avatar: string | null
  lastMessage: Message | null
  unreadCount: number
  isMuted: boolean
  isOnline: boolean
  isActive: boolean
}

export function ConversationRow({
  id, name, avatar, lastMessage, unreadCount, isMuted, isOnline, isActive
}: ConversationRowProps) {
  const navigate = useNavigate()
  const setActiveConversation = useChatStore(s => s.setActiveConversation)
  const openProfilePanel = useUIStore(s => s.openProfilePanel)
  const clearProfilePanel = useUIStore(s => s.clearProfilePanel)
  
  const handleClick = () => {
    clearProfilePanel()
    setActiveConversation(id)
    navigate(`/${id}`)
  }

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet'
    
    switch (lastMessage.type) {
      case 'text':
        return lastMessage.text || ''
      case 'image':
        return <span className="flex items-center gap-1"><Image size={12} /> Photo</span>
      case 'video':
        return <span className="flex items-center gap-1"><Video size={12} /> Video</span>
      case 'file':
        return <span className="flex items-center gap-1"><File size={12} /> Document</span>
      case 'audio':
        return <span className="flex items-center gap-1"><Mic size={12} /> Voice message</span>
      case 'location':
        return <span className="flex items-center gap-1"><MapPin size={12} /> Location</span>
      case 'contact':
        return <span className="flex items-center gap-1"><Contact size={12} /> Contact</span>
      case 'link':
        return <span className="flex items-center gap-1"><LinkIcon size={12} /> Link</span>
      default:
        return 'Message'
    }
  }

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-center h-[68px] px-3 gap-3 cursor-pointer transition-colors relative group",
        isActive 
          ? "bg-raised" 
          : "hover:bg-raised",
      )}
    >
      {/* Active Indicator Left Border */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-foreground" />
      )}
      
      {/* Avatar */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setActiveConversation(null)
          openProfilePanel(id)
        }}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open profile for ${name}`}
      >
        <Avatar 
          src={avatar} 
          fallback={name} 
          size="lg" 
          isOnline={isOnline} 
          showOnlineDot={true} 
        />
      </button>
      
      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground truncate pl-1">{name}</h4>
          <span className="text-xs text-text-tertiary flex-shrink-0 ml-2">
            {formatMessageTime(lastMessage?.createdAt)}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-0.5">
          <div className="text-xs text-text-secondary truncate pr-2 pl-1 h-4">
            {renderLastMessagePreview()}
          </div>
          
          <div className="flex-shrink-0 flex items-center space-x-1">
            {isMuted && <VolumeX size={14} className="text-text-tertiary" />}
            {!isMuted && unreadCount > 0 && <Badge count={unreadCount} />}
          </div>
        </div>
      </div>
    </div>
  )
}
