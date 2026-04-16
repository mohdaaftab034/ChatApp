import { FileText, Send, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface DocumentSendModalProps {
  file: File
  caption: string
  isSending: boolean
  onCaptionChange: (value: string) => void
  onCancel: () => void
  onSend: () => void
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentSendModal({
  file,
  caption,
  isSending,
  onCaptionChange,
  onCancel,
  onSend,
}: DocumentSendModalProps) {
  const captionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    captionRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-3 sm:absolute sm:inset-auto sm:bottom-full sm:left-1/2 sm:mb-3 sm:w-[min(92vw,460px)] sm:-translate-x-1/2 sm:bg-transparent sm:p-0 sm:pointer-events-none">
      <div className="flex h-[86dvh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:pointer-events-auto sm:h-auto sm:max-h-[80vh] sm:w-full">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Send document</p>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-text-secondary hover:bg-raised hover:text-foreground"
            aria-label="Close document preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col bg-page p-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-raised p-3 text-foreground">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">Add a message</p>
            <p className="mt-1 text-xs text-text-secondary">Optional caption</p>
          </div>

          <textarea
            ref={captionRef}
            value={caption}
            onChange={(event) => onCaptionChange(event.target.value)}
            rows={4}
            placeholder="Type a message..."
            className="mt-3 min-h-24 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-raised"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? 'Sending...' : 'Send'}
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}