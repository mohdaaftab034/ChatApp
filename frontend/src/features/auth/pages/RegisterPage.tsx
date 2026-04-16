import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { registerSchema, RegisterFormValues } from '../schemas/auth.schemas'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordInput } from '../components/PasswordInput'
import { cn } from '../../../lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { signupApi } from '../api/auth.api'
import { useAuthStore } from '../../../store/authStore'
import { unlockOrCreateKeyring } from '../../../lib/e2ee'
import { updateMyPublicKeyApi } from '../../chat/api/chat.api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  })

  const passwordValue = watch('password', '')

  const getPasswordStrength = (pass: string) => {
    let score = 0
    if (pass.length > 0) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    return score // 0 to 4
  }

  const getStrengthBarColor = (score: number) => {
    switch (score) {
      case 1: return 'bg-destructive' // weak (red)
      case 2: return 'bg-amber-500' // fair
      case 3: return 'bg-[#22C55E]' // strong (green)
      case 4: return 'bg-green-700' // very strong
      default: return 'bg-border'
    }
  }

  const score = getPasswordStrength(passwordValue)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    try {
      const auth = await signupApi({
        name: data.name,
        email: data.email,
        password: data.password,
      })

      login(auth.user, auth.token, auth.refreshToken)

      const keyInfo = await unlockOrCreateKeyring(data.password)
      await updateMyPublicKeyApi({
        keyId: keyInfo.keyId,
        publicKey: keyInfo.publicKey,
      })

      toast.success('Account created successfully')
      navigate(auth.user.username ? '/' : '/profile/setup')
    } catch (error) {
      toast.error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create an account</h1>
          <p className="text-sm text-text-secondary">Enter your details to sign up</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative group cursor-pointer">
              <label htmlFor="avatar" className="cursor-pointer">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-raised flex items-center justify-center border border-border group-hover:border-border-strong transition-colors relative">
                  {previewUrl ? (
                     <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                     <Camera className="w-6 h-6 text-text-tertiary" />
                  )}
                  {previewUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
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
            <label className="text-sm font-medium leading-none text-foreground">Display Name</label>
            <input 
              type="text" 
              className={cn(
                "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                errors.name && "border-destructive focus-visible:ring-destructive"
              )}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">Email</label>
            <input 
              type="email" 
              className={cn(
                "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                errors.email && "border-destructive focus-visible:ring-destructive"
              )}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">Password</label>
            <PasswordInput 
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            
            {passwordValue && (
              <div className="flex h-1 mt-2 space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "flex-1 rounded-full transition-colors",
                      score >= level ? getStrengthBarColor(score) : "bg-raised"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">Confirm Password</label>
            <PasswordInput 
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full mt-2 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline focus-visible:outline-none">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
