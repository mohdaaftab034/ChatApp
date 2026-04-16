import { motion } from 'framer-motion'
import { Image, FileText, Camera, MapPin, Mic, Contact } from 'lucide-react'

interface AttachmentMenuProps {
  onClose: () => void;
  onPickImage: (mode: 'gallery' | 'camera') => void;
  onPickDocument: () => void;
  onRecordAudio: () => void;
  onPickLocation: () => void;
  onPickContact: () => void;
}

export function AttachmentMenu({ onClose, onPickImage, onPickDocument, onRecordAudio, onPickLocation, onPickContact }: AttachmentMenuProps) {
  const options = [
    { id: 'document', label: 'Document', icon: FileText, color: 'bg-indigo-500', action: onPickDocument },
    { id: 'camera', label: 'Camera', icon: Camera, color: 'bg-rose-500', action: () => onPickImage('camera') },
    { id: 'gallery', label: 'Gallery', icon: Image, color: 'bg-blue-500', action: () => onPickImage('gallery') },
    { id: 'audio', label: 'Audio', icon: Mic, color: 'bg-amber-500', action: onRecordAudio },
    { id: 'location', label: 'Location', icon: MapPin, color: 'bg-emerald-500', action: onPickLocation },
    { id: 'contact', label: 'Contact', icon: Contact, color: 'bg-cyan-500', action: onPickContact },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.72, rotateX: 18 }}
      animate={{ opacity: 1, y: 0, scale: [0.72, 1.04, 1], rotateX: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.9, 0.2, 1] }}
      className="fixed left-2 right-2 bottom-24 sm:absolute sm:left-0 sm:right-auto sm:bottom-full sm:mb-4 bg-surface/95 backdrop-blur rounded-2xl shadow-xl border border-border p-4 sm:w-72 z-50 origin-bottom-left"
    >
      <div className="grid grid-cols-3 gap-y-6 gap-x-4">
        {options.map((opt) => (
          <button 
            key={opt.id}
            onClick={() => {
              if ('action' in opt && opt.action) {
                opt.action()
              }
              onClose()
            }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 ${opt.color} text-white rounded-full flex items-center justify-center transform transition-transform group-hover:scale-110 shadow-sm`}>
              <opt.icon size={24} />
            </div>
            <span className="text-xs text-text-secondary group-hover:text-foreground font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
