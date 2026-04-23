// ========== USER ==========
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ========== JOB ==========
export type JobStatus = 
  | 'wishlist'      // Quero aplicar
  | 'applied'       // Aplicado
  | 'interview'     // Entrevista
  | 'offer'         // Proposta
  | 'rejected'      // Rejeitado
  | 'accepted'      // Aceito

export interface Job {
  id: string
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

// ========== INTERACTION ==========
export type InteractionType = 
  | 'application'   // Candidatura enviada
  | 'email'         // Email enviado/recebido
  | 'phone'         // Ligação
  | 'interview'     // Entrevista
  | 'offer'         // Proposta recebida
  | 'follow_up'     // Follow-up
  | 'rejection'     // Rejeição
  | 'note'          // Anotação geral

export interface Interaction {
  id: string
  jobId: string
  type: InteractionType
  title: string
  description?: string
  date: string
  createdAt: string
}

// ========== REMINDER ==========
export interface Reminder {
  id: string
  jobId: string
  title: string
  description?: string
  dueDate: string
  isCompleted: boolean
  createdAt: string
}

// ========== API RESPONSES ==========
export interface ApiError {
  message: string
  statusCode: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}
