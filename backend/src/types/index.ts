export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export type JobStatus = 
  | 'wishlist'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'accepted'

export interface Job {
  id: string
  userId: string
  company: string
  position: string
  location: string
  salary?: string
  url?: string
  description?: string
  notes?: string
  status: JobStatus
  appliedAt?: string
  createdAt: string
  updatedAt: string
}

// Request com usuário autenticado
import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}
