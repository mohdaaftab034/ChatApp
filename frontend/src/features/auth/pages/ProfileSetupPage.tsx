import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { profileSetupSchema, ProfileSetupFormValues } from '../schemas/auth.schemas'
import { AuthLayout } from '../components/AuthLayout'
import { cn } from '../../../lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../../store/authStore'
import { Camera } from 'lucide-react'
import { updateMyProfileApi } from '../../profile/api/profile.api'

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((state) => state.updateUser)
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema) as any,
    defaultValues: {
      status: 'online',
      bio: ''
    }
  })

  const bioValue = watch('bio', '')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const onSubmit = async (data: ProfileSetupFormValues) => {
    setIsLoading(true)
    try {
      const updatedProfile = await updateMyProfileApi({
        username: data.username,
        bio: data.bio,
        status: data.status,
        avatar: avatarFile,
      })
      
      updateUser({
        username: updatedProfile.username,
        bio: updatedProfile.bio,
        status: updatedProfile.status,
        avatar: updatedProfile.avatar,
      })

      toast.success('Profile created')
      navigate('/')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Complete your profile</h1>
          <p className="text-sm text-text-secondary">Set up your profile to start chatting</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              <label htmlFor="avatar" className="cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-raised flex items-center justify-center border border-border group-hover:border-border-strong transition-colors relative">
                  {previewUrl ? (
                     <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                     <Camera className="w-8 h-8 text-text-tertiary" />
                  )}
                  {previewUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </label>
              <input 
                id="avatar" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">@</span>
              <input 
                type="text" 
                className={cn(
                  "flex h-10 w-full rounded-md border border-border bg-surface pl-8 pr-10 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 lowercase",
                  errors.username && "border-destructive focus-visible:ring-destructive"
                )}
                {...register('username')}
              />
            </div>
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium leading-none text-foreground">Bio (Optional)</label>
              <span className="text-xs text-text-tertiary">{(bioValue?.length || 0)}/160</span>
            </div>
            <textarea 
              maxLength={160}
              className={cn(
                "flex min-h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 resize-none",
                errors.bio && "border-destructive focus-visible:ring-destructive"
              )}
              {...register('bio')}
            />
          </div>

          <div className="space-y-3 pb-2">
            <label className="text-sm font-medium leading-none text-foreground">Set your status</label>
            <div className="flex flex-wrap gap-2">
              {(['online', 'away', 'busy', 'invisible'] as const).map(status => (
                <label key={status} className={cn(
                  "flex items-center px-3 py-2 rounded-lg border cursor-pointer border-border transition-colors",
                  watch('status') === status ? "bg-raised border-foreground text-foreground" : "text-text-secondary hover:bg-raised"
                )}>
                  <input type="radio" value={status} {...register('status')} className="hidden" />
                  <span className="capitalize text-sm">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            ) : (
              'Save & Continue'
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
