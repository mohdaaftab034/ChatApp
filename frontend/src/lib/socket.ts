import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket.types'

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

// Create a singleton socket.io-client instance
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  timeout: 10000,
  auth: (cb) => {
    const token = useAuthStore.getState().token
    cb({ token })
  }
})
