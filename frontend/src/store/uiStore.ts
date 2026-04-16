import { create } from 'zustand'
import { Message } from '../types/message.types'

const THEME_KEY = 'chat-ui-theme'
const ACCENT_KEY = 'chat-ui-accent'

const getStoredTheme = (): UIState['theme'] => {
  if (typeof window === 'undefined') return 'system'
  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

const getStoredAccent = (): UIState['accentColor'] => {
  if (typeof window === 'undefined') return 'mono'
  const saved = window.localStorage.getItem(ACCENT_KEY)
  if (saved === 'mono' || saved === 'ocean' || saved === 'coral' || saved === 'forest' || saved === 'gold') {
    return saved
  }
  return 'mono'
}

interface UIState {
  theme: 'light' | 'dark' | 'system'
  accentColor: 'mono' | 'ocean' | 'coral' | 'forest' | 'gold'
  isMobileSidebarOpen: boolean
  isRightPanelOpen: boolean
  profilePanelConversationId: string | null
  activeModal: 'newChat' | 'createGroup' | 'groupSettings' | 'search' | 'imageViewer' | null
  imageViewerSrc: string | null
  replyingTo: Message | null
  editingMessage: Message | null
  selectedMessages: Set<string>

  setTheme: (t: UIState['theme']) => void
  setAccentColor: (accent: UIState['accentColor']) => void
  toggleMobileSidebar: () => void
  toggleRightPanel: () => void
  openRightPanel: () => void
  closeRightPanel: () => void
  openProfilePanel: (conversationId: string) => void
  clearProfilePanel: () => void
  openModal: (m: UIState['activeModal']) => void
  closeModal: () => void
  openImageViewer: (src: string) => void
  setReplyingTo: (msg: Message | null) => void
  setEditingMessage: (msg: Message | null) => void
  toggleMessageSelect: (msgId: string) => void
  clearSelectedMessages: () => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: getStoredTheme(),
  accentColor: getStoredAccent(),
  isMobileSidebarOpen: false,
  isRightPanelOpen: false,
  profilePanelConversationId: null,
  activeModal: null,
  imageViewerSrc: null,
  replyingTo: null,
  editingMessage: null,
  selectedMessages: new Set(),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme)
    }
    set({ theme })
  },
  setAccentColor: (accentColor) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACCENT_KEY, accentColor)
    }
    set({ accentColor })
  },
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  openRightPanel: () => set({ isRightPanelOpen: true }),
  closeRightPanel: () => set({ isRightPanelOpen: false }),
  openProfilePanel: (conversationId) => set({ isRightPanelOpen: true, profilePanelConversationId: conversationId }),
  clearProfilePanel: () => set({ profilePanelConversationId: null }),
  openModal: (m) => set({ activeModal: m }),
  closeModal: () => set({ activeModal: null }),
  openImageViewer: (src) => set({ activeModal: 'imageViewer', imageViewerSrc: src }),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),
  toggleMessageSelect: (msgId) => set((state) => {
    const newSet = new Set(state.selectedMessages)
    if (newSet.has(msgId)) {
      newSet.delete(msgId)
    } else {
      newSet.add(msgId)
    }
    return { selectedMessages: newSet }
  }),
  clearSelectedMessages: () => set({ selectedMessages: new Set() })
}))
