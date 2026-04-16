import { Loader2, MapPin, Navigation, Send, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export interface LocationOption {
  lat: number
  lng: number
  title: string
  subtitle?: string
}

interface LocationSendModalProps {
  searchQuery: string
  results: LocationOption[]
  selectedLocation: LocationOption | null
  isSearching: boolean
  isResolvingLocation: boolean
  isSending: boolean
  onSearchChange: (value: string) => void
  onSelectLocation: (option: LocationOption) => void
  onUseCurrentLocation: () => void
  onCancel: () => void
  onSend: () => void
}

export function LocationSendModal({
  searchQuery,
  results,
  selectedLocation,
  isSearching,
  isResolvingLocation,
  isSending,
  onSearchChange,
  onSelectLocation,
  onUseCurrentLocation,
  onCancel,
  onSend,
}: LocationSendModalProps) {
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-3 sm:absolute sm:inset-auto sm:bottom-full sm:left-1/2 sm:mb-3 sm:w-[min(92vw,460px)] sm:-translate-x-1/2 sm:bg-transparent sm:p-0 sm:pointer-events-none">
      <div className="flex h-[86dvh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:pointer-events-auto sm:h-auto sm:max-h-[80vh] sm:w-full">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Send location</p>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-text-secondary hover:bg-raised hover:text-foreground"
            aria-label="Close location picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col bg-page p-4 gap-3">
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isResolvingLocation || isSending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-raised disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResolvingLocation ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            {isResolvingLocation ? 'Getting current location...' : 'Use my current location'}
          </button>

          <div>
            <label className="mb-1 block text-xs text-text-secondary">Search location</label>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by place, area, or address"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {isSearching && (
            <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-secondary inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Searching locations...
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-surface">
              {results.map((result) => {
                const isActive = selectedLocation?.lat === result.lat && selectedLocation?.lng === result.lng
                return (
                  <button
                    key={`${result.lat}-${result.lng}-${result.title}`}
                    type="button"
                    onClick={() => onSelectLocation(result)}
                    className={`w-full border-b border-border px-3 py-2 text-left last:border-b-0 ${isActive ? 'bg-raised' : 'hover:bg-raised'}`}
                  >
                    <p className="text-sm font-medium text-foreground">{result.title}</p>
                    {result.subtitle && <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{result.subtitle}</p>}
                  </button>
                )
              })}
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin size={16} />
              Preview
            </p>
            {selectedLocation ? (
              <>
                <p className="mt-1 text-xs text-text-secondary">{selectedLocation.title}</p>
                {selectedLocation.subtitle && (
                  <p className="mt-1 text-xs text-text-secondary line-clamp-2">{selectedLocation.subtitle}</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-xs text-text-secondary">Pick a place from search results or use your current location.</p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 pt-1">
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
              disabled={isSending || isResolvingLocation || !selectedLocation}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? 'Sending...' : 'Send location'}
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
