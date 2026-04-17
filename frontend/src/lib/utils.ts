import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeExternalUrl(value?: string | null): string {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)
    ? raw
    : `https://${raw.replace(/^\/+/, '')}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}
