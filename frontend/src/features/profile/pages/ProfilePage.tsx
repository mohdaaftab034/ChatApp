import { AppShell } from '../../chat/components/layout/AppShell'
import { Avatar } from '../../../components/shared/Avatar'
import { Mail, Phone, MapPin, Briefcase, CalendarDays, Link as LinkIcon, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyProfileApi, getProfileByIdApi, ProfileData, updateMyProfileApi } from '../api/profile.api'
import { useAuthStore } from '../../../store/authStore'
import { cn } from '../../../lib/utils'
import { startDirectConversationApi } from '../../contacts/api/contacts.api'
import { useChatStore } from '../../../store/chatStore'

export default function ProfilePage() {
  const { profileId } = useParams()
  const navigate = useNavigate()
  const [dpPreview, setDpPreview] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    headline: '',
    bio: '',
    phone: '',
    location: '',
    department: '',
    role: '',
    website: '',
    linkedin: '',
    x: '',
  })
  const updateUser = useAuthStore((state) => state.updateUser)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const addConversation = useChatStore((state) => state.addConversation)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        setIsLoading(true)
        const data = profileId ? await getProfileByIdApi(profileId) : await getMyProfileApi()
        if (isMounted) {
          setSelectedProfile(data)
          setDpPreview(null)
          setEditForm({
            name: data.name || '',
            headline: data.headline || '',
            bio: data.bio || '',
            phone: data.phone || '',
            location: data.location || '',
            department: data.department || '',
            role: data.role || '',
            website: data.social?.website || '',
            linkedin: data.social?.linkedin || '',
            x: data.social?.x || '',
          })

          if (!profileId) {
            updateUser({
              name: data.name,
              username: data.username,
              email: data.email,
              avatar: data.avatar,
              bio: data.bio,
              status: data.status,
            })
          }
        }
      } catch {
        if (isMounted) {
          setSelectedProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [profileId, updateUser])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-page">
        <AppShell>
          <div className="flex-1 flex flex-col h-full bg-page items-center justify-center px-4 text-center">
            <p className="text-text-secondary">Loading profile...</p>
          </div>
        </AppShell>
      </div>
    )
  }

  if (!selectedProfile) {
    return (
      <div className="flex h-screen w-full bg-page">
        <AppShell>
          <div className="flex-1 flex flex-col h-full bg-page items-center justify-center px-4 text-center">
            <h1 className="text-2xl font-semibold mb-2 text-foreground">Profile not found</h1>
            <p className="text-text-secondary">The selected profile is not available.</p>
          </div>
        </AppShell>
      </div>
    )
  }

  const isOwnProfile = Boolean(currentUserId && selectedProfile.id === currentUserId)

  const openOrCreateDirectConversation = async () => {
    const targetUserId = selectedProfile.id

    if (!targetUserId) return null
    if (currentUserId && targetUserId === currentUserId) {
      toast.info('This is your own profile')
      navigate('/profile')
      return null
    }

    setIsStartingConversation(true)
    try {
      const conversation = await startDirectConversationApi(targetUserId)
      addConversation(conversation)
      return conversation
    } catch {
      toast.error('Unable to start conversation right now')
      return null
    } finally {
      setIsStartingConversation(false)
    }
  }

  const handleMessage = async () => {
    const conversation = await openOrCreateDirectConversation()
    if (!conversation) return
    navigate(`/${conversation.id}`)
  }

  const handleEmail = () => {
    const emailValue = String(selectedProfile.email || '').trim()
    if (!emailValue) {
      toast.error('No email available for this profile')
      return
    }

    window.location.href = `mailto:${emailValue}`
  }

  const updateEditField = (field: keyof typeof editForm, value: string) => {
    setEditForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return

    setIsSaving(true)
    try {
      const updated = await updateMyProfileApi({
        name: editForm.name,
        headline: editForm.headline,
        bio: editForm.bio,
        phone: editForm.phone,
        location: editForm.location,
        department: editForm.department,
        jobTitle: editForm.role,
        website: editForm.website,
        linkedin: editForm.linkedin,
        x: editForm.x,
      })

      setSelectedProfile(updated)
      setIsEditMode(false)
      updateUser({
        name: updated.name,
        username: updated.username,
        email: updated.email,
        avatar: updated.avatar,
        bio: updated.bio,
        status: updated.status,
      })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDpFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setDpPreview(objectUrl)

    try {
      const updatedProfile = await updateMyProfileApi({ avatar: file })
      setSelectedProfile(updatedProfile)
      setDpPreview(null)
      updateUser({ avatar: updatedProfile.avatar })
      toast.success('Display photo updated')
    } catch {
      toast.error('Failed to upload display photo')
    }
  }

  return (
    <div className="flex h-screen w-full bg-page">
      <AppShell>
        <div className="flex-1 h-full bg-page overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <Avatar
                  src={dpPreview ?? selectedProfile.avatar}
                  fallback={selectedProfile.name}
                  size="xl"
                  isOnline={selectedProfile.status === 'online'}
                  showOnlineDot
                />
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">{selectedProfile.name}</h1>
                  <p className="text-sm text-text-secondary">@{selectedProfile.username}</p>
                  <p className="mt-2 text-text-secondary">{selectedProfile.headline}</p>
                  {isOwnProfile && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-raised px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                        Edit Display Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDpFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsEditMode((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-raised px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                      >
                        {isEditMode ? 'Cancel Editing' : 'Edit Profile'}
                      </button>
                    </div>
                  )}
                  {!isOwnProfile && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleMessage}
                        disabled={isStartingConversation}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <MessageCircle size={14} />
                        {isStartingConversation ? 'Opening...' : 'Message'}
                      </button>
                      <button
                        type="button"
                        onClick={handleEmail}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-raised px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Mail size={14} />
                        Email
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isOwnProfile && isEditMode && (
                <div className="mt-6 rounded-xl border border-border bg-page p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">Edit profile details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={editForm.name} onChange={(event) => updateEditField('name', event.target.value)} placeholder="Full name" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.headline} onChange={(event) => updateEditField('headline', event.target.value)} placeholder="Headline" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.phone} onChange={(event) => updateEditField('phone', event.target.value)} placeholder="Phone" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.location} onChange={(event) => updateEditField('location', event.target.value)} placeholder="Location" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.department} onChange={(event) => updateEditField('department', event.target.value)} placeholder="Department" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.role} onChange={(event) => updateEditField('role', event.target.value)} placeholder="Role" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.website} onChange={(event) => updateEditField('website', event.target.value)} placeholder="Website" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.linkedin} onChange={(event) => updateEditField('linkedin', event.target.value)} placeholder="LinkedIn" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <input value={editForm.x} onChange={(event) => updateEditField('x', event.target.value)} placeholder="X profile" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </div>
                  <textarea value={editForm.bio} onChange={(event) => updateEditField('bio', event.target.value)} placeholder="Bio" className="min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={cn(
                        'inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-50',
                        isSaving && 'pointer-events-none'
                      )}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-6 text-sm sm:text-base text-foreground leading-relaxed">{selectedProfile.bio}</p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl bg-raised border border-border p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Contact</p>
                  <p className="mt-2 text-sm text-foreground inline-flex items-center gap-2"><Mail size={14} />{selectedProfile.email}</p>
                  <p className="mt-1 text-sm text-foreground inline-flex items-center gap-2"><Phone size={14} />{selectedProfile.phone}</p>
                </div>

                <div className="rounded-xl bg-raised border border-border p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Work</p>
                  <p className="mt-2 text-sm text-foreground inline-flex items-center gap-2"><Briefcase size={14} />{selectedProfile.role}</p>
                  <p className="mt-1 text-sm text-foreground">{selectedProfile.department}</p>
                </div>

                <div className="rounded-xl bg-raised border border-border p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Location</p>
                  <p className="mt-2 text-sm text-foreground inline-flex items-center gap-2"><MapPin size={14} />{selectedProfile.location}</p>
                </div>

                <div className="rounded-xl bg-raised border border-border p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Joined</p>
                  <p className="mt-2 text-sm text-foreground inline-flex items-center gap-2"><CalendarDays size={14} />{selectedProfile.joinedAt}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-border p-3 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Social</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <a href={selectedProfile.social.website} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-raised transition-colors">
                    <LinkIcon size={14} /> Website
                  </a>
                  <a href={selectedProfile.social.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-raised transition-colors">
                    <LinkIcon size={14} /> LinkedIn
                  </a>
                  <a href={selectedProfile.social.x} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-raised transition-colors">
                    <LinkIcon size={14} /> X
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}
