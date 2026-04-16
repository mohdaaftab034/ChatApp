import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCcw, X } from 'lucide-react'

interface CameraCaptureModalProps {
  onClose: () => void
  onCapture: (file: File) => void
}

export function CameraCaptureModal({ onClose, onCapture }: CameraCaptureModalProps) {
  const [error, setError] = useState<string>('')
  const [isStarting, setIsStarting] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopStream = () => {
    if (!streamRef.current) return
    for (const track of streamRef.current.getTracks()) {
      track.stop()
    }
    streamRef.current = null
  }

  const getFriendlyCameraError = (error: unknown) => {
    if (!window.isSecureContext) {
      return 'Camera works only on HTTPS or localhost.'
    }

    if (error && typeof error === 'object' && 'name' in error) {
      const name = String((error as { name?: string }).name || '')

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return 'Camera access was blocked. Please allow camera access in browser settings.'
      }

      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return 'No camera device was found on this device.'
      }

      if (name === 'NotReadableError' || name === 'TrackStartError') {
        return 'Camera is busy in another app/tab. Close other camera apps and try again.'
      }

      if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
        return 'Requested camera was not available. Try switching camera.'
      }
    }

    return 'Unable to open camera right now. Please try again.'
  }

  const requestStream = async (mode: 'user' | 'environment') => {
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: mode } }, audio: false },
      { video: true, audio: false },
    ]

    let lastError: unknown = null

    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error) {
        lastError = error
      }
    }

    throw lastError
  }

  const startStream = async (mode: 'user' | 'environment') => {
    setError('')
    setIsStarting(true)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser.')
        return
      }

      stopStream()
      const stream = await requestStream(mode)

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
    } catch (error) {
      setError(getFriendlyCameraError(error))
    } finally {
      setIsStarting(false)
    }
  }

  useEffect(() => {
    startStream(facingMode)

    return () => {
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSwitchCamera = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    await startStream(nextMode)
  }

  const handleCapture = async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return

    setIsCapturing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')

      if (!context) {
        setError('Unable to capture photo right now.')
        return
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      })

      if (!blob) {
        setError('Unable to capture photo right now.')
        return
      }

      const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(capturedFile)
      onClose()
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 px-3 py-4 sm:px-6">
      <div className="grid h-[86dvh] w-[94vw] max-w-115 grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl sm:h-[82dvh]">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <h3 className="text-sm font-medium">Camera</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/20"
            aria-label="Close camera"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative min-h-0">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />

          {(isStarting || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center text-sm text-white">
              <div className="space-y-3">
                <p>{isStarting ? 'Starting camera...' : error}</p>
                {!isStarting && error && (
                  <button
                    type="button"
                    onClick={() => startStream(facingMode)}
                    className="rounded-full border border-white/50 px-4 py-2 text-xs font-medium hover:bg-white/15"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-2 text-sm text-white hover:bg-white/15"
          >
            <RefreshCcw size={16} />
            Switch
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={isStarting || isCapturing || Boolean(error)}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Capture photo"
          >
            <Camera size={24} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/40 px-3 py-2 text-sm text-white hover:bg-white/15"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}