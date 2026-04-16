import { useEffect, useRef } from 'react'
import { ArrowLeft, Send, X } from 'lucide-react'

interface ImageSendModalProps {
  previewUrl: string
  caption: string
  isSending: boolean
  onCaptionChange: (value: string) => void
  onCancel: () => void
  onSend: () => void
}

export function ImageSendModal({
  previewUrl,
  caption,
  isSending,
  onCaptionChange,
  onCancel,
  onSend,
}: ImageSendModalProps) {
  const captionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    captionRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-3 sm:absolute sm:inset-auto sm:bottom-full sm:left-1/2 sm:mb-3 sm:w-[min(92vw,460px)] sm:-translate-x-1/2 sm:bg-transparent sm:p-0 sm:pointer-events-none">
      <div className="flex h-[86dvh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:pointer-events-auto sm:h-auto sm:max-h-[80vh] sm:w-full">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-foreground hover:bg-raised"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-text-secondary hover:bg-raised hover:text-foreground"
            aria-label="Close image preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col bg-page lg:flex-row">
          <div className="flex flex-1 items-center justify-center bg-black/90 p-3 min-h-0">
            <img
              src={previewUrl}
              alt="Selected image preview"
              className="max-h-full w-full rounded-lg object-contain"
            />
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-surface p-3 lg:w-56 lg:border-l lg:border-t-0 lg:p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Add a message</p>
              <p className="mt-1 text-xs text-text-secondary">Optional caption</p>
            </div>

            <textarea
              ref={captionRef}
              value={caption}
              onChange={(event) => onCaptionChange(event.target.value)}
              rows={3}
              placeholder="Type a message..."
              className="min-h-20 w-full resize-none rounded-xl border border-border bg-page px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="mt-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSend}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? 'Sending...' : 'Send'}
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}