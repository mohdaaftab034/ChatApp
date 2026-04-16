import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { OtpInput } from '../components/OtpInput'
import { toast } from 'sonner'

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const email = location.state?.email || ''
  const mode = location.state?.mode || 'reset'

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleComplete = async (code: string) => {
    if (code.length !== 6) return
    
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      navigate('/reset-password', { state: { email, otp: code, mode } })
    } catch (error) {
      toast.error('Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setCountdown(60)
    toast.success(`Code resent to ${email}`)
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Check your email</h1>
          <p className="text-sm text-text-secondary">
            Enter the 6-digit reset code sent to <span className="font-medium text-foreground">{email || 'your email'}</span>
          </p>
        </div>

        <div className="flex justify-center py-4">
          <OtpInput 
            value={otp} 
            onChange={setOtp} 
            onComplete={handleComplete}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={() => handleComplete(otp)}
          disabled={isLoading || otp.length !== 6}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
          ) : (
            'Verify code'
          )}
        </button>

        <p className="text-center text-sm text-text-secondary pt-2">
          Didn't receive the code?{' '}
          <button 
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className="font-medium text-foreground hover:underline focus-visible:outline-none disabled:opacity-50 disabled:hover:no-underline"
          >
            Resend {countdown > 0 && `(${countdown}s)`}
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
