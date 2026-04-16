import { useNavigate, useLocation } from 'react-router-dom'
import { MessageSquare, Users, Settings } from 'lucide-react'
import { useAuthStore } from '../../../../store/authStore'
import { useUIStore } from '../../../../store/uiStore'
import { useChatStore } from '../../../../store/chatStore'
import { Avatar } from '../../../../components/shared/Avatar'
import { cn } from '../../../../lib/utils'

interface LeftSidebarProps {
  mobile?: boolean
}

export function LeftSidebar({ mobile = false }: LeftSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const openProfilePanel = useUIStore((state) => state.openProfilePanel)
  const openRightPanel = useUIStore((state) => state.openRightPanel)

  const navItems = [
    { icon: MessageSquare, id: 'chats', path: '/' },
    { icon: Users, id: 'contacts', path: '/contacts' },
    { icon: Settings, id: 'settings', path: '/settings' },
  ]

  if (mobile) {
    return (
      <div className="flex h-full items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.match(/^\/[0-9a-zA-Z-]+$/))
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 p-2",
                isActive ? "text-foreground" : "text-text-secondary"
              )}
            >
              <item.icon size={24} strokeWidth={1.5} />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-full w-17 flex-col items-center bg-surface py-4 border-r border-border">
      {/* Top Section */}
      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-accent-foreground font-bold">
          C
        </div>
        <div className="h-px w-8 bg-border" />
      </div>

      {/* Nav Icons */}
      <div className="mt-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.match(/^\/[0-9a-zA-Z-]+$/))
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                isActive 
                  ? "bg-raised text-foreground" 
                  : "text-text-secondary hover:bg-raised"
              )}
            >
              <item.icon size={20} strokeWidth={1.5} className={isActive ? "stroke-foreground" : "stroke-text-secondary"} />
              
              {/* Tooltip */}
              <div className="absolute left-14 hidden rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground opacity-0 group-hover:block group-hover:opacity-100 whitespace-nowrap z-50">
                <span className="capitalize">{item.id}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto flex w-full flex-col items-center">
        <button 
          onClick={() => {
            if (activeConversationId) {
              openProfilePanel(activeConversationId)
            } else {
              openRightPanel()
            }
          }}
          className="relative rounded-full hover:ring-2 hover:ring-ring hover:ring-offset-2 transition-all focus-visible:outline-none"
        >
          <Avatar 
            src={user?.avatar} 
            fallback={user?.name || 'U'} 
            size="md"
            isOnline={user?.status === 'online'}
            showOnlineDot={true}
          />
        </button>
      </div>
    </div>
  )
}
