import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { resetPasswordSchema, ResetPasswordFormValues } from '../schemas/auth.schemas'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordInput } from '../components/PasswordInput'
import { cn } from '../../../lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { resetPasswordApi } from '../api/auth.api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  const email = location.state?.email as string | undefined
  const otp = location.state?.otp as string | undefined

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const passwordValue = watch('password', '')

  const getPasswordStrength = (pass: string) => {
    let score = 0
    if (pass.length > 0) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    return score
  }

  const getStrengthBarColor = (score: number) => {
    switch (score) {
      case 1: return 'bg-destructive'
      case 2: return 'bg-amber-500'
      case 3: return 'bg-[#22C55E]'
      case 4: return 'bg-green-700'
      default: return 'bg-border'
    }
  }

  const score = getPasswordStrength(passwordValue)

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!email || !otp) {
      toast.error('Reset session expired. Please request a new code.')
      navigate('/forgot-password')
      return
    }

    setIsLoading(true)
    try {
      await resetPasswordApi({
        email,
        otp,
        password: data.password,
      })
      
      toast.success('Password reset successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Set new password</h1>
          <p className="text-sm text-text-secondary">Must be at least 8 characters</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">New Password</label>
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
              'Reset password'
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
