import { useUIStore } from '../../../../store/uiStore'
import { X } from 'lucide-react'

export function Lightbox() {
  const { closeModal, imageViewerSrc } = useUIStore()

  if (!imageViewerSrc) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={closeModal}>
      <button 
        onClick={closeModal}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={24} />
      </button>
      <img 
        src={imageViewerSrc} 
        alt="Fullscreen view" 
        className="h-full w-full object-contain select-none"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
