import fs from 'fs'
import path from 'path'
import type { Database, User, Job } from '../types'

const DB_PATH = path.join(__dirname, 'db.json')

// Dados iniciais
const initialData: Database = {
  users: [],
  jobs: []
}

// Carrega o banco de dados
export const loadDb = (): Database => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Erro ao carregar banco de dados:', error)
  }
  return initialData
}

// Salva o banco de dados
export const saveDb = (data: Database): void => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Erro ao salvar banco de dados:', error)
  }
}

// Helper para gerar IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// CRUD de usuários
export const findUserByEmail = (email: string): User | undefined => {
  const db = loadDb()
  return db.users.find(u => u.email === email)
}

export const findUserById = (id: string): User | undefined => {
  const db = loadDb()
  return db.users.find(u => u.id === id)
}

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const db = loadDb()
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString()
  }
  db.users.push(newUser)
  saveDb(db)
  return newUser
}

// CRUD de vagas
export const getJobsByUserId = (userId: string): Job[] => {
  const db = loadDb()
  return db.jobs.filter(j => j.userId === userId)
}

export const getJobById = (id: string, userId: string): Job | undefined => {
  const db = loadDb()
  return db.jobs.find(j => j.id === id && j.userId === userId)
}

export const createJob = (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Job => {
  const db = loadDb()
  const newJob: Job = {
    ...job,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  db.jobs.push(newJob)
  saveDb(db)
  return newJob
}

export const updateJob = (id: string, userId: string, data: Partial<Job>): Job | null => {
  const db = loadDb()
  const index = db.jobs.findIndex(j => j.id === id && j.userId === userId)
  if (index === -1) return null
  
  db.jobs[index] = {
    ...db.jobs[index],
    ...data,
    id: db.jobs[index].id, // Não permite alterar o ID
    userId: db.jobs[index].userId, // Não permite alterar o userId
    updatedAt: new Date().toISOString()
  }
  saveDb(db)
  return db.jobs[index]
}

export const deleteJob = (id: string, userId: string): boolean => {
  const db = loadDb()
  const initialLength = db.jobs.length
  db.jobs = db.jobs.filter(j => !(j.id === id && j.userId === userId))
  if (db.jobs.length < initialLength) {
    saveDb(db)
    return true
  }
  return false
}
