import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../components/AuthLayout'
import { cn } from '../../../lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { forgotPasswordApi } from '../api/auth.api'

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = response?.data?.message
    if (message) return message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

const forgotSchema = z.object({
  email: z.string().email('Invalid email address')
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema)
  })

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true)
    try {
      await forgotPasswordApi({ email: data.email })
      
      toast.success(`Check your inbox — code sent to ${data.email}`)
      navigate('/verify-otp', { state: { email: data.email, mode: 'reset' } })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send code'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reset password</h1>
          <p className="text-sm text-text-secondary">Enter your email and we'll send you a code</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            ) : (
              'Send code'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline focus-visible:outline-none">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
