import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Job, JobStatus } from '../../types'

interface JobsState {
  jobs: Job[]
  filter: JobStatus | 'all'
  searchTerm: string
}

// Dados iniciais de exemplo (usados apenas se não houver dados salvos)
const defaultJobs: Job[] = [
  {
    id: '1',
    company: 'Nubank',
    position: 'Frontend Developer',
    location: 'Remoto',
    salary: 'R$ 12.000 - R$ 18.000',
    url: 'https://nubank.com.br/carreiras',
    status: 'applied',
    appliedAt: '2026-04-10',
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-04-10T10:00:00Z',
  },
  {
    id: '2',
    company: 'iFood',
    position: 'React Developer',
    location: 'São Paulo, SP',
    salary: 'R$ 10.000 - R$ 15.000',
    status: 'interview',
    appliedAt: '2026-04-05',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-04-08T14:00:00Z',
  },
  {
    id: '3',
    company: 'PicPay',
    position: 'Full Stack Developer',
    location: 'Remoto',
    status: 'wishlist',
    createdAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-04-12T10:00:00Z',
  },
]

// Carrega do localStorage ou usa dados padrão
const loadJobsFromStorage = (): Job[] => {
  try {
    const stored = localStorage.getItem('jobs')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Erro ao carregar vagas do localStorage:', error)
  }
  return defaultJobs
}

// Salva no localStorage
const saveJobsToStorage = (jobs: Job[]) => {
  try {
    localStorage.setItem('jobs', JSON.stringify(jobs))
  } catch (error) {
    console.error('Erro ao salvar vagas no localStorage:', error)
  }
}

const initialState: JobsState = {
  jobs: loadJobsFromStorage(),
  filter: 'all',
  searchTerm: '',
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    addJob: (state, action: PayloadAction<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newJob: Job = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      state.jobs.unshift(newJob)
      saveJobsToStorage(state.jobs)
    },

    updateJob: (state, action: PayloadAction<{ id: string; data: Partial<Job> }>) => {
      const index = state.jobs.findIndex((job) => job.id === action.payload.id)
      if (index !== -1) {
        state.jobs[index] = {
          ...state.jobs[index],
          ...action.payload.data,
          updatedAt: new Date().toISOString(),
        }
        saveJobsToStorage(state.jobs)
      }
    },

    deleteJob: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter((job) => job.id !== action.payload)
      saveJobsToStorage(state.jobs)
    },

    setFilter: (state, action: PayloadAction<JobStatus | 'all'>) => {
      state.filter = action.payload
    },

    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },

    updateJobStatus: (state, action: PayloadAction<{ id: string; status: JobStatus }>) => {
      const job = state.jobs.find((job) => job.id === action.payload.id)
      if (job) {
        job.status = action.payload.status
        job.updatedAt = new Date().toISOString()
        if (action.payload.status === 'applied' && !job.appliedAt) {
          job.appliedAt = new Date().toISOString().split('T')[0]
        }
        saveJobsToStorage(state.jobs)
      }
    },
  },
})

export const { 
  addJob, 
  updateJob, 
  deleteJob, 
  setFilter, 
  setSearchTerm,
  updateJobStatus 
} = jobsSlice.actions

export default jobsSlice.reducer
