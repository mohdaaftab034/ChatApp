export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string | null
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible'
  lastSeen: string | null
  bio: string
  isVerified: boolean
}
