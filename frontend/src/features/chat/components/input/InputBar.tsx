import { useState, useRef, useEffect, useMemo, type ChangeEvent } from 'react'
import { Smile, Paperclip, Send, Mic, Square, X } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '../../../../store/uiStore'
import { EmojiPicker } from './EmojiPicker'
import { AttachmentMenu } from './AttachmentMenu'
import { cn } from '../../../../lib/utils'
import { sendMessage, startTyping, stopTyping } from '../../hooks/useSocket'
import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { getUserPublicKeyApi, searchAppUsersApi, uploadChatAudioApi, uploadChatDocumentApi, uploadChatImageApi } from '../../api/chat.api'
import { ImageSendModal } from './ImageSendModal'
import { CameraCaptureModal } from './CameraCaptureModal'
import { DocumentSendModal } from './DocumentSendModal'
import { LocationSendModal, type LocationOption } from './LocationSendModal'
import { ContactSendModal } from './ContactSendModal'
import { User } from '../../../../types/user.types'
import { encryptPlaintextForUsers, getCachedUserPublicKey, getCurrentPublicKey, rememberUserPublicKey } from '../../../../lib/e2ee'

export function InputBar() {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null)
  const [documentCaption, setDocumentCaption] = useState('')
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [imageCaption, setImageCaption] = useState('')
  const [isSendingImage, setIsSendingImage] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null)
  const [pendingAudioPreviewUrl, setPendingAudioPreviewUrl] = useState<string | null>(null)
  const [pendingAudioDuration, setPendingAudioDuration] = useState<number>(0)
  const [isSendingAudio, setIsSendingAudio] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [locationResults, setLocationResults] = useState<LocationOption[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null)
  const [isSearchingLocations, setIsSearchingLocations] = useState(false)
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const [isSendingLocation, setIsSendingLocation] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [contactResults, setContactResults] = useState<User[]>([])
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const [isSearchingContacts, setIsSearchingContacts] = useState(false)
  const [isSendingContact, setIsSendingContact] = useState(false)
  const optimisticImageMessageIdRef = useRef<string | null>(null)
  const speechRecognitionRef = useRef<any>(null)
  const dictationBaseTextRef = useRef('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaRecorderChunksRef = useRef<Blob[]>([])
  const mediaRecorderStartedAtRef = useRef<number>(0)
  const mediaRecorderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const discardRecordingRef = useRef(false)
  const touchAudioPressRef = useRef(false)
  const suppressMicClickRef = useRef(false)
  const touchAudioStopRequestedRef = useRef(false)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const { replyingTo, editingMessage, setReplyingTo, setEditingMessage } = useUIStore()
  const addMessage = useChatStore((state) => state.addMessage)
  const removeMessage = useChatStore((state) => state.removeMessage)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const activeConversation = useChatStore((state) =>
    state.conversations.find((conversation) => conversation.id === state.activeConversationId)
  )
  const optimisticImageMessageExists = useChatStore((state) =>
    activeConversationId && optimisticImageMessageIdRef.current
      ? Boolean(
          state.messages[activeConversationId]?.some(
            (message) => message.id === optimisticImageMessageIdRef.current
          )
        )
      : false
  )

  const emojiRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const canSendMessages = useMemo(() => {
    if (!activeConversation) return false
    if (activeConversation.type !== 'group') return true

    if (activeConversation.group?.settings?.whoCanSend !== 'admins') return true

    return Boolean(currentUserId && activeConversation.group?.adminIds.includes(currentUserId))
  }, [activeConversation, currentUserId])

  const sendDisabledReason = useMemo(() => {
    if (!activeConversation?.group) return ''
    if (activeConversation.group.settings?.whoCanSend !== 'admins') return ''
    if (currentUserId && activeConversation.group.adminIds.includes(currentUserId)) return ''
    return 'Only group admins can send messages'
  }, [activeConversation, currentUserId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false)
      }
      if (attachRef.current && !attachRef.current.contains(event.target as Node)) {
        setShowAttach(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview)
      }
    }
  }, [pendingImagePreview])

  useEffect(() => {
    return () => {
      if (pendingAudioPreviewUrl) {
        URL.revokeObjectURL(pendingAudioPreviewUrl)
      }
    }
  }, [pendingAudioPreviewUrl])

  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop?.()
      if (mediaRecorderIntervalRef.current) {
        clearInterval(mediaRecorderIntervalRef.current)
      }
      mediaRecorderRef.current?.stop?.()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!optimisticImageMessageIdRef.current || optimisticImageMessageExists) return

    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview)
    }

    setPendingImagePreview(null)
    optimisticImageMessageIdRef.current = null
  }, [optimisticImageMessageExists, pendingImagePreview])

  useEffect(() => {
    if (!showLocationPicker) return

    const query = locationSearchQuery.trim()
    if (query.length < 2) {
      setLocationResults([])
      setIsSearchingLocations(false)
      return
    }

    let isMounted = true
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearchingLocations(true)
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          q: query,
          limit: '8',
          addressdetails: '1',
        })

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const payload = await response.json() as Array<{ lat: string; lon: string; name?: string; display_name?: string }>
        if (!isMounted) return

        const mapped = payload
          .map((item): LocationOption | null => {
            const lat = Number(item.lat)
            const lng = Number(item.lon)
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

            const title = String(item.name || item.display_name || 'Pinned location').split(',')[0].trim() || 'Pinned location'
            return {
              lat,
              lng,
              title,
              subtitle: item.display_name || title,
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)

        setLocationResults(mapped)
      } catch {
        if (isMounted) {
          setLocationResults([])
        }
      } finally {
        if (isMounted) {
          setIsSearchingLocations(false)
        }
      }
    }, 350)

    return () => {
      isMounted = false
      controller.abort()
      clearTimeout(timer)
    }
  }, [locationSearchQuery, showLocationPicker])

  useEffect(() => {
    if (!showContactPicker) return

    let isMounted = true
    const timer = setTimeout(async () => {
      try {
        setIsSearchingContacts(true)
        const users = await searchAppUsersApi(contactSearchQuery.trim(), 40)
        if (!isMounted) return
        setContactResults(users)
      } catch {
        if (isMounted) {
          setContactResults([])
        }
      } finally {
        if (isMounted) {
          setIsSearchingContacts(false)
        }
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [contactSearchQuery, showContactPicker])

  const clearPendingAudio = () => {
    if (pendingAudioPreviewUrl) {
      URL.revokeObjectURL(pendingAudioPreviewUrl)
    }
    setPendingAudioFile(null)
    setPendingAudioPreviewUrl(null)
    setPendingAudioDuration(0)
  }

  const formatRecordingDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const resolveAudioMimeType = () => {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
      return ''
    }

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ''
  }

  const handleToggleDictation = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => any
      webkitSpeechRecognition?: new () => any
    }

    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice typing is not supported in this browser')
      return
    }

    if (!activeConversationId || !canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this chat')
      return
    }

    if (isDictating) {
      speechRecognitionRef.current?.stop?.()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    dictationBaseTextRef.current = text ? `${text.trimEnd()} ` : ''

    recognition.onstart = () => {
      setIsDictating(true)
    }

    recognition.onresult = (event: any) => {
      let finalChunk = ''
      let interimChunk = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = String(event.results[index][0]?.transcript || '')
        if (event.results[index].isFinal) {
          finalChunk += transcript
        } else {
          interimChunk += transcript
        }
      }

      if (finalChunk) {
        dictationBaseTextRef.current += finalChunk
      }

      const nextValue = `${dictationBaseTextRef.current}${interimChunk}`.trimStart()
      setText(nextValue)

      if (nextValue.trim()) {
        startTyping(activeConversationId)
      } else {
        stopTyping(activeConversationId)
      }
    }

    recognition.onerror = (event: any) => {
      setIsDictating(false)
      if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
        toast.error('Voice typing failed. Please try again.')
      }
    }

    recognition.onend = () => {
      setIsDictating(false)
      speechRecognitionRef.current = null
    }

    speechRecognitionRef.current = recognition
    recognition.start()
  }

  const handleStartAudioRecording = async (startedFromTouch = false) => {
    if (!activeConversationId || !canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this chat')
      return
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Audio recording is not supported in this browser')
      return
    }

    clearPendingAudio()
    speechRecognitionRef.current?.stop?.()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = resolveAudioMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      mediaRecorderChunksRef.current = []
      mediaRecorderStartedAtRef.current = Date.now()
      discardRecordingRef.current = false
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mediaRecorderChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        if (mediaRecorderIntervalRef.current) {
          clearInterval(mediaRecorderIntervalRef.current)
          mediaRecorderIntervalRef.current = null
        }

        const elapsedSeconds = Math.max(1, Math.round((Date.now() - mediaRecorderStartedAtRef.current) / 1000))
        setIsRecordingAudio(false)
        setRecordingSeconds(0)

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null

        if (discardRecordingRef.current) {
          mediaRecorderChunksRef.current = []
          discardRecordingRef.current = false
          return
        }

        const blobType = recorder.mimeType || mediaRecorderChunksRef.current[0]?.type || 'audio/webm'
        const audioBlob = new Blob(mediaRecorderChunksRef.current, { type: blobType })
        mediaRecorderChunksRef.current = []

        if (!audioBlob.size) {
          toast.error('Recorded audio is empty. Please try again.')
          return
        }

        const extension = blobType.includes('ogg') ? 'ogg' : blobType.includes('mp4') ? 'mp4' : 'webm'
        const file = new File([audioBlob], `voice-${Date.now()}.${extension}`, { type: blobType })
        const previewUrl = URL.createObjectURL(audioBlob)

        setPendingAudioFile(file)
        setPendingAudioPreviewUrl(previewUrl)
        setPendingAudioDuration(elapsedSeconds)
      }

      recorder.start()
      setIsRecordingAudio(true)
      setRecordingSeconds(0)
      mediaRecorderIntervalRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - mediaRecorderStartedAtRef.current) / 1000))
      }, 1000)

      if (startedFromTouch && touchAudioStopRequestedRef.current) {
        discardRecordingRef.current = false
        recorder.stop()
      }
    } catch {
      toast.error('Microphone permission is required to record audio')
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }

  const handleStopAudioRecording = () => {
    if (!mediaRecorderRef.current) return
    discardRecordingRef.current = false
    mediaRecorderRef.current?.stop()
  }

  const handleCancelAudioRecording = () => {
    if (isRecordingAudio) {
      discardRecordingRef.current = true
      mediaRecorderRef.current?.stop()
      return
    }

    clearPendingAudio()
  }

  const handleSendAudio = async () => {
    if (!pendingAudioFile || !activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this group')
      return
    }

    const file = pendingAudioFile
    const duration = pendingAudioDuration

    const optimisticMessageId = `local-${crypto.randomUUID()}`
    const clientTempId = `tmp-${crypto.randomUUID()}`
    const nowIso = new Date().toISOString()

    optimisticImageMessageIdRef.current = optimisticMessageId

    addMessage(activeConversationId, {
      id: optimisticMessageId,
      conversationId: activeConversationId,
      senderId: currentUserId || 'me',
      type: 'audio',
      mediaUrl: undefined,
      fileName: file.name,
      fileSize: file.size,
      audioDuration: duration,
      clientTempId,
      reactions: [],
      readBy: currentUserId ? [currentUserId] : [],
      deliveredTo: currentUserId ? [currentUserId] : [],
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      isStarred: false,
      isUploading: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    })

    clearPendingAudio()
    setIsSendingAudio(true)
    stopTyping(activeConversationId)
    setReplyingTo(null)
    setEditingMessage(null)

    try {
      const uploaded = await uploadChatAudioApi(file)

      sendMessage({
        conversationId: activeConversationId,
        mediaUrl: uploaded.mediaUrl,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        audioDuration: duration,
        type: 'audio',
        replyToId: replyingTo?.id,
        participantIds: activeConversation?.participants.map((participant) => participant.id),
        clientTempId,
      })
    } catch {
      if (optimisticImageMessageIdRef.current) {
        removeMessage(activeConversationId, optimisticImageMessageIdRef.current)
      }
      optimisticImageMessageIdRef.current = null
      toast.error('Failed to send audio message')
    } finally {
      setIsSendingAudio(false)
    }
  }

  const handleMicAction = () => {
    if (suppressMicClickRef.current) {
      suppressMicClickRef.current = false
      return
    }

    if (isRecordingAudio) {
      return
    }

    if (pendingAudioFile) {
      handleSendAudio()
      return
    }

    handleStartAudioRecording()
  }

  const handleMicPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    if (isRecordingAudio || pendingAudioFile || isSendingAudio) return

    event.preventDefault()
    touchAudioPressRef.current = true
    touchAudioStopRequestedRef.current = false
    suppressMicClickRef.current = true
    void handleStartAudioRecording(true)
  }

  const handleMicPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    if (!touchAudioPressRef.current) return

    touchAudioPressRef.current = false
    touchAudioStopRequestedRef.current = true
    handleStopAudioRecording()
  }

  const handleMicPointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    if (!touchAudioPressRef.current) return

    touchAudioPressRef.current = false
    touchAudioStopRequestedRef.current = true
    handleCancelAudioRecording()
  }

  const handleOpenLocationPicker = () => {
    if (!activeConversationId || !canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this chat')
      return
    }

    setShowAttach(false)
    setShowEmoji(false)
    setLocationSearchQuery('')
    setLocationResults([])
    setSelectedLocation(null)
    setShowLocationPicker(true)
  }

  const handleOpenContactPicker = () => {
    if (!activeConversationId || !canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this chat')
      return
    }

    setShowAttach(false)
    setShowEmoji(false)
    setContactSearchQuery('')
    setContactResults([])
    setSelectedContact(null)
    setShowContactPicker(true)
  }

  const handleCloseContactPicker = () => {
    if (isSendingContact) return
    setShowContactPicker(false)
  }

  const handleCloseLocationPicker = () => {
    if (isSendingLocation || isResolvingLocation) return
    setShowLocationPicker(false)
  }

  const handleSelectLocation = (option: LocationOption) => {
    setSelectedLocation(option)
    setLocationSearchQuery(option.title)
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json() as { name?: string; display_name?: string }
    const title = String(payload.name || payload.display_name || 'Current location').split(',')[0].trim() || 'Current location'

    return {
      title,
      subtitle: payload.display_name || title,
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported in this browser')
      return
    }

    setIsResolvingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const place = await reverseGeocode(latitude, longitude)
        const nextLocation: LocationOption = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          title: place?.title || 'Current location',
          subtitle: place?.subtitle,
        }

        setSelectedLocation(nextLocation)
        setLocationSearchQuery(nextLocation.title)
        setLocationResults([])
        setIsResolvingLocation(false)
      },
      () => {
        setIsResolvingLocation(false)
        toast.error('Unable to fetch current location')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }

  const handleSendLocation = () => {
    if (!activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this chat')
      return
    }

    if (!selectedLocation) {
      toast.error('Please pick a location first')
      return
    }

    const { lat, lng, title } = selectedLocation

    const clientTempId = `tmp-${crypto.randomUUID()}`
    const optimisticMessageId = `local-${crypto.randomUUID()}`
    const nowIso = new Date().toISOString()

    optimisticImageMessageIdRef.current = optimisticMessageId
    setIsSendingLocation(true)

    addMessage(activeConversationId, {
      id: optimisticMessageId,
      conversationId: activeConversationId,
      senderId: currentUserId || 'me',
      type: 'location',
      text: title,
      location: {
        lat,
        lng,
        label: title,
      },
      clientTempId,
      reactions: [],
      readBy: currentUserId ? [currentUserId] : [],
      deliveredTo: currentUserId ? [currentUserId] : [],
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      isStarred: false,
      isUploading: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    })

    sendMessage({
      conversationId: activeConversationId,
      type: 'location',
      text: title,
      location: {
        lat,
        lng,
        label: title,
      },
      replyToId: replyingTo?.id,
      participantIds: activeConversation?.participants.map((participant) => participant.id),
      clientTempId,
    })

    stopTyping(activeConversationId)
    setReplyingTo(null)
    setEditingMessage(null)
    setShowLocationPicker(false)
    setSelectedLocation(null)
    setLocationSearchQuery('')
    setLocationResults([])
    setIsSendingLocation(false)
  }

  const handleSendContact = () => {
    if (!activeConversationId || !selectedContact) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this chat')
      return
    }

    setIsSendingContact(true)

    const clientTempId = `tmp-${crypto.randomUUID()}`
    const optimisticMessageId = `local-${crypto.randomUUID()}`
    const nowIso = new Date().toISOString()

    optimisticImageMessageIdRef.current = optimisticMessageId

    addMessage(activeConversationId, {
      id: optimisticMessageId,
      conversationId: activeConversationId,
      senderId: currentUserId || 'me',
      type: 'contact',
      text: `Shared contact: ${selectedContact.name}`,
      sharedContact: {
        userId: selectedContact.id,
        name: selectedContact.name,
        username: selectedContact.username,
        email: selectedContact.email,
        phone: '',
        avatar: selectedContact.avatar,
      },
      clientTempId,
      reactions: [],
      readBy: currentUserId ? [currentUserId] : [],
      deliveredTo: currentUserId ? [currentUserId] : [],
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      isStarred: false,
      isUploading: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    })

    sendMessage({
      conversationId: activeConversationId,
      type: 'contact',
      text: `Shared contact: ${selectedContact.name}`,
      sharedContact: {
        userId: selectedContact.id,
        name: selectedContact.name,
        username: selectedContact.username,
        email: selectedContact.email,
        phone: '',
        avatar: selectedContact.avatar,
      },
      replyToId: replyingTo?.id,
      participantIds: activeConversation?.participants.map((participant) => participant.id),
      clientTempId,
    })

    stopTyping(activeConversationId)
    setReplyingTo(null)
    setEditingMessage(null)
    setSelectedContact(null)
    setContactSearchQuery('')
    setContactResults([])
    setShowContactPicker(false)
    setIsSendingContact(false)
  }

  const handleSend = async () => {
    if (!text.trim() || !activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this group')
      return
    }

    const plaintext = text.trim()
    const participantIds = activeConversation?.participants.map((participant) => participant.id) || []
    const currentKey = getCurrentPublicKey()

    if (!currentUserId || !currentKey) {
      toast.error('Unable to access your encryption keys. Please sign in again.')
      return
    }

    try {
      const publicKeysByUserId: Record<string, string> = {
        [currentUserId]: currentKey.publicKey,
      }

      const recipients = participantIds.length > 0 ? participantIds : [currentUserId]
      for (const participantId of recipients) {
        if (participantId === currentUserId) continue

        const cached = getCachedUserPublicKey(participantId)
        if (cached) {
          publicKeysByUserId[participantId] = cached
          continue
        }

        const keyPayload = await getUserPublicKeyApi(participantId)
        publicKeysByUserId[participantId] = keyPayload.publicKey
        rememberUserPublicKey(keyPayload)
      }

      const encryptedPayload = await encryptPlaintextForUsers(plaintext, publicKeysByUserId, currentKey.keyId)

      sendMessage({
        conversationId: activeConversationId,
        type: 'text',
        encryptedPayload,
        replyToId: replyingTo?.id,
        participantIds,
      })
    } catch {
      toast.error('Unable to encrypt and send this message')
      return
    }

    stopTyping(activeConversationId)
    setText('')
    setReplyingTo(null)
    setEditingMessage(null)

    requestAnimationFrame(() => {
      messageInputRef.current?.focus()
    })
  }

  const preparePendingImage = (file: File) => {
    if (!activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this group')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview)
    }

    const nextPreview = URL.createObjectURL(file)
    setPendingImageFile(file)
    setPendingImagePreview(nextPreview)
    setImageCaption('')
    setShowAttach(false)
    setShowEmoji(false)
  }

  const handlePickImage = (mode: 'gallery' | 'camera') => {
    if (mode === 'camera') {
      if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function') {
        setShowCameraCapture(true)
      } else {
        cameraInputRef.current?.click()
      }
      return
    }

    galleryInputRef.current?.click()
  }

  const handlePickDocument = () => {
    documentInputRef.current?.click()
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    preparePendingImage(file)
  }

  const handleCaptureFromCamera = (file: File) => {
    preparePendingImage(file)
  }

  const handleDocumentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this group')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Document exceeds 20MB limit')
      return
    }

    setPendingDocumentFile(file)
    setDocumentCaption('')
    setShowAttach(false)
    setShowEmoji(false)
  }

  const handleCancelDocument = () => {
    setPendingDocumentFile(null)
    setDocumentCaption('')
  }

  const handleSendDocument = async () => {
    if (!pendingDocumentFile || !activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this group')
      return
    }

    const file = pendingDocumentFile
    const captionToSend = documentCaption.trim()

    const optimisticMessageId = `local-${crypto.randomUUID()}`
    const clientTempId = `tmp-${crypto.randomUUID()}`
    const nowIso = new Date().toISOString()

    optimisticImageMessageIdRef.current = optimisticMessageId

    addMessage(activeConversationId, {
      id: optimisticMessageId,
      conversationId: activeConversationId,
      senderId: currentUserId || 'me',
      type: 'file',
      text: captionToSend || undefined,
      mediaUrl: undefined,
      fileName: file.name,
      fileSize: file.size,
      clientTempId,
      reactions: [],
      readBy: currentUserId ? [currentUserId] : [],
      deliveredTo: currentUserId ? [currentUserId] : [],
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      isStarred: false,
      isUploading: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    })

    setPendingDocumentFile(null)
    setDocumentCaption('')
    setIsSendingImage(true)
    setShowAttach(false)
    setShowEmoji(false)
    stopTyping(activeConversationId)
    setReplyingTo(null)
    setEditingMessage(null)

    try {
      const uploaded = await uploadChatDocumentApi(file)

      sendMessage({
        conversationId: activeConversationId,
        mediaUrl: uploaded.mediaUrl,
        text: captionToSend || undefined,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        type: 'file',
        replyToId: replyingTo?.id,
        participantIds: activeConversation?.participants.map((participant) => participant.id),
        clientTempId,
      })
    } catch {
      if (optimisticImageMessageIdRef.current) {
        removeMessage(activeConversationId, optimisticImageMessageIdRef.current)
      }
      optimisticImageMessageIdRef.current = null
      toast.error('Failed to send document')
    } finally {
      setIsSendingImage(false)
    }
  }

  const handleCancelImage = () => {
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview)
    }

    setPendingImageFile(null)
    setPendingImagePreview(null)
    setImageCaption('')
  }

  const handleSendImage = async () => {
    if (!pendingImageFile || !activeConversationId) return

    if (!canSendMessages) {
      toast.error(sendDisabledReason || 'You cannot send messages in this group')
      return
    }

    const fileToSend = pendingImageFile
    const captionToSend = imageCaption.trim()
    const localPreviewUrl = pendingImagePreview
    const optimisticMessageId = `local-${crypto.randomUUID()}`
    const clientTempId = `tmp-${crypto.randomUUID()}`

    optimisticImageMessageIdRef.current = optimisticMessageId

    addMessage(activeConversationId, {
      id: optimisticMessageId,
      conversationId: activeConversationId,
      senderId: currentUserId || 'me',
      type: 'image',
      text: captionToSend || undefined,
      mediaUrl: undefined,
      localPreviewUrl: localPreviewUrl || undefined,
      clientTempId,
      reactions: [],
      readBy: currentUserId ? [currentUserId] : [],
      deliveredTo: currentUserId ? [currentUserId] : [],
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      isStarred: false,
      isUploading: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setPendingImageFile(null)
    setPendingImagePreview(null)
    setImageCaption('')
    setIsSendingImage(true)
    setShowAttach(false)
    setShowEmoji(false)
    stopTyping(activeConversationId)
    setReplyingTo(null)
    setEditingMessage(null)

    try {
      const { mediaUrl } = await uploadChatImageApi(fileToSend)

      sendMessage({
        conversationId: activeConversationId,
        mediaUrl,
        text: captionToSend || undefined,
        fileName: undefined,
        fileSize: undefined,
        clientTempId,
        type: 'image',
        replyToId: replyingTo?.id,
        participantIds: activeConversation?.participants.map((participant) => participant.id),
      })
    } catch {
      if (optimisticImageMessageIdRef.current) {
        removeMessage(activeConversationId, optimisticImageMessageIdRef.current)
      }
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
      optimisticImageMessageIdRef.current = null
      toast.error('Failed to send image')
    } finally {
      setIsSendingImage(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji)
  }

  return (
    <div className="shrink-0 px-4 py-3 bg-surface border-t border-border flex flex-col w-full relative">
      {/* Reply/Edit Strip */}
      {(replyingTo || editingMessage) && (
        <div className="bg-raised rounded-t-lg px-3 py-2 flex items-center justify-between mb-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground">
              {replyingTo ? `Replying to ${replyingTo.senderId}` : 'Editing message'}
            </span>
            <span className="text-xs text-text-secondary truncate">
              {replyingTo?.text || editingMessage?.text || 'Preview'}
            </span>
          </div>
          <button 
            onClick={() => { setReplyingTo(null); setEditingMessage(null); }}
            className="text-text-tertiary hover:text-foreground p-1 rounded-md hover:bg-surface transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-end gap-2 w-full relative">
        <div className="relative" ref={emojiRef}>
          <button 
            onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }}
            className="h-9 w-9 shrink-0 flex items-center justify-center text-text-secondary hover:bg-raised hover:text-foreground rounded-lg transition-colors"
          >
            <Smile size={20} strokeWidth={1.5} />
          </button>
          {showEmoji && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />}
        </div>
        
        <div className="relative" ref={attachRef}>
          <button 
            onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }}
            className="h-9 w-9 shrink-0 flex items-center justify-center text-text-secondary hover:bg-raised hover:text-foreground rounded-lg transition-colors"
          >
            <Paperclip size={20} strokeWidth={1.5} />
          </button>
          {showAttach && (
            <AttachmentMenu
              onClose={() => setShowAttach(false)}
              onPickImage={handlePickImage}
              onPickDocument={handlePickDocument}
              onRecordAudio={handleStartAudioRecording}
              onPickLocation={handleOpenLocationPicker}
              onPickContact={handleOpenContactPicker}
            />
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleDictation}
          disabled={!canSendMessages || isSendingImage || isSendingAudio || isRecordingAudio}
          title={isDictating ? 'Stop voice typing' : 'Start voice typing'}
          className={cn(
            'h-9 w-9 shrink-0 flex items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            isDictating ? 'bg-accent/15 text-accent-foreground' : 'text-text-secondary hover:bg-raised hover:text-foreground'
          )}
        >
          <Mic size={18} strokeWidth={1.7} />
        </button>

        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          className="hidden"
          onChange={handleDocumentChange}
        />

        <textarea
          ref={messageInputRef}
          value={text}
          onChange={(e) => {
            const value = e.target.value
            setText(value)
            if (!activeConversationId || !canSendMessages) return
            if (value.trim()) {
              startTyping(activeConversationId)
            } else {
              stopTyping(activeConversationId)
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (activeConversationId && canSendMessages) {
              stopTyping(activeConversationId)
            }
          }}
          placeholder={sendDisabledReason || 'Message...'}
          disabled={!canSendMessages || isSendingImage || isSendingAudio || isRecordingAudio || Boolean(pendingImageFile)}
          className="flex-1 rounded-2xl bg-raised px-4 py-2 text-sm text-foreground focus:outline-none resize-none min-h-10 max-h-37.5 overflow-y-auto disabled:cursor-not-allowed disabled:opacity-60"
          rows={1}
          style={{ height: text ? 'auto' : '40px' }}
        />

        {text.trim() ? (
          <button 
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleSend}
            disabled={!canSendMessages || isSendingImage || isSendingAudio || isRecordingAudio || Boolean(pendingImageFile)}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-foreground text-surface transition-transform active:scale-95 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMicAction}
            onPointerDown={handleMicPointerDown}
            onPointerUp={handleMicPointerUp}
            onPointerCancel={handleMicPointerCancel}
            onPointerLeave={(event) => {
              if (event.pointerType === 'touch' || event.pointerType === 'pen') {
                handleMicPointerCancel(event)
              }
            }}
            disabled={!canSendMessages || isSendingImage || isSendingAudio || Boolean(pendingImageFile)}
            className={cn(
              'h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              isRecordingAudio ? 'bg-destructive text-white hover:opacity-90' : 'text-text-secondary hover:bg-raised hover:text-red-500',
              touchAudioPressRef.current && !isRecordingAudio && 'ring-2 ring-destructive/30'
            )}
            title={isRecordingAudio ? 'Recording... release to stop' : pendingAudioFile ? 'Send recorded audio' : 'Hold to record audio message'}
          >
            {isRecordingAudio ? <Square size={16} strokeWidth={2} /> : pendingAudioFile ? <Send size={16} strokeWidth={2} /> : <Mic size={20} strokeWidth={1.5} />}
          </button>
        )}

      </div>

      {(isRecordingAudio || pendingAudioFile) && (
        <div className="mt-2 rounded-xl border border-border bg-raised px-3 py-2">
          {isRecordingAudio ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-foreground">Recording voice message {formatRecordingDuration(recordingSeconds)}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelAudioRecording}
                  className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStopAudioRecording}
                  className="rounded-md bg-foreground px-2 py-1 text-xs font-medium text-surface hover:opacity-90"
                >
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingAudioPreviewUrl && (
                <audio
                  controls
                  src={pendingAudioPreviewUrl}
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  className="w-full audio-message-player"
                />
              )}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary">Voice message {formatRecordingDuration(pendingAudioDuration)}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelAudioRecording}
                    disabled={isSendingAudio}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSendAudio}
                    disabled={isSendingAudio}
                    className="rounded-md bg-foreground px-2 py-1 text-xs font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingAudio ? 'Sending...' : 'Send audio'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {pendingImagePreview && (
        <ImageSendModal
          previewUrl={pendingImagePreview}
          caption={imageCaption}
          isSending={isSendingImage}
          onCaptionChange={setImageCaption}
          onCancel={handleCancelImage}
          onSend={handleSendImage}
        />
      )}

      {pendingDocumentFile && (
        <DocumentSendModal
          file={pendingDocumentFile}
          caption={documentCaption}
          isSending={isSendingImage}
          onCaptionChange={setDocumentCaption}
          onCancel={handleCancelDocument}
          onSend={handleSendDocument}
        />
      )}

      {showCameraCapture && (
        <CameraCaptureModal
          onClose={() => setShowCameraCapture(false)}
          onCapture={handleCaptureFromCamera}
        />
      )}

      {showLocationPicker && (
        <LocationSendModal
          searchQuery={locationSearchQuery}
          results={locationResults}
          selectedLocation={selectedLocation}
          isSearching={isSearchingLocations}
          isResolvingLocation={isResolvingLocation}
          isSending={isSendingLocation}
          onSearchChange={setLocationSearchQuery}
          onSelectLocation={handleSelectLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
          onCancel={handleCloseLocationPicker}
          onSend={handleSendLocation}
        />
      )}

      {showContactPicker && (
        <ContactSendModal
          query={contactSearchQuery}
          onQueryChange={setContactSearchQuery}
          results={contactResults}
          selectedContact={selectedContact}
          isSearching={isSearchingContacts}
          isSending={isSendingContact}
          onSelectContact={setSelectedContact}
          onCancel={handleCloseContactPicker}
          onSend={handleSendContact}
        />
      )}
    </div>
  )
}
