import { useState, useRef, useEffect } from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { useUIStore } from '../../../../store/uiStore'
import { ChatDropdown } from './ChatDropdown'

export function ChatHeaderActions() {
  const openModal = useUIStore(s => s.openModal)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex items-center gap-1 relative">
      <button 
        onClick={() => openModal('search')}
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-raised text-text-secondary hover:text-foreground transition-colors"
      >
        <Search size={20} strokeWidth={1.5} />
      </button>
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-raised text-text-secondary hover:text-foreground transition-colors"
        >
          <MoreVertical size={20} strokeWidth={1.5} />
        </button>
        {showMenu && <ChatDropdown onClose={() => setShowMenu(false)} />}
      </div>
    </div>
  )
}
