import React from 'react'
import { useUIStore } from '../../../../store/uiStore'
import { useChatStore } from '../../../../store/chatStore'
import { cn } from '../../../../lib/utils'
import { LeftSidebar } from './LeftSidebar'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { RightPanel } from './RightPanel'
import { GlobalSearch } from '../../../search/components/GlobalSearch'
import { CreateGroupWizard } from '../../../groups/components/CreateGroupWizard'
import { GroupSettingsModal } from '../../../groups/components/GroupSettingsModal'
import { Lightbox } from './Lightbox'
// Import NewChatModal here too once created

interface AppShellProps {
  children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isRightPanelOpen, activeModal, closeRightPanel, clearProfilePanel } = useUIStore()
  const activeConversationId = useChatStore((s) => s.activeConversationId)

  const closePanel = () => {
    clearProfilePanel()
    closeRightPanel()
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-page text-foreground">
      {/* Left Sidebar (Desktop/Tablet) */}
      <div className="hidden md:flex h-full shrink-0 z-20">
        <LeftSidebar />
      </div>

      {children ? (
        <div className="flex-1 flex min-w-0 h-full">
          {children}
        </div>
      ) : (
        <>
          {/* Mobile: WhatsApp-style flow - list first, then conversation */}
          <div className="md:hidden flex h-full w-full flex-col">
            {!activeConversationId ? <ConversationList /> : <ChatWindow />}
          </div>

          {/* Conversation List Panel (Desktop/Tablet) */}
          <div className="hidden md:flex h-full shrink-0 w-75 border-r border-border bg-surface z-10">
            <ConversationList />
          </div>

          {/* Main Chat Window */}
          <div className="hidden md:flex flex-1 min-w-0 h-full relative">
            <ChatWindow />
          </div>

          {/* Desktop Profile Drawer */}
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close contact info panel"
            className={cn(
              'hidden md:block fixed inset-0 z-40 bg-black/30 transition-opacity duration-300',
              isRightPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          />
          <div
            className={cn(
              'hidden md:flex fixed right-0 top-0 z-50 h-screen w-98 border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out',
              isRightPanelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            )}
          >
            <RightPanel />
          </div>

          {/* Mobile Profile Overlay */}
          {isRightPanelOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-surface animate-in fade-in duration-200">
              <RightPanel />
            </div>
          )}
        </>
      )}

      {/* Mobile Overlays & Add-ons */}
      {activeModal === 'search' && <GlobalSearch />}
      {activeModal === 'createGroup' && <CreateGroupWizard />}
      {activeModal === 'groupSettings' && <GroupSettingsModal />}
      {activeModal === 'imageViewer' && <Lightbox />}
      
      {/* Mobile nav placeholder - To be fully implemented with Sheet/Drawer mechanisms */}
      {!(activeConversationId && !children) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-surface z-50">
          <LeftSidebar mobile />
        </div>
      )}
    </div>
  )
}
