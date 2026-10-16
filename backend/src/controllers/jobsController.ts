import { Response } from 'express'
import { 
  getJobsByUserId, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob 
} from '../data/database'
import type { AuthRequest, JobStatus } from '../types'

// IDs são UUIDs; qualquer outro formato é tratado como "não encontrado"
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const VALID_STATUSES: JobStatus[] = ['wishlist', 'applied', 'interview', 'offer', 'rejected', 'accepted']

// GET /api/jobs
export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const jobs = await getJobsByUserId(userId)
    res.json(jobs)
  } catch (error) {
    console.error('Erro ao buscar vagas:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// GET /api/jobs/:id
export const getJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const id = String(req.params.id)

    if (!UUID_REGEX.test(id)) {
      res.status(404).json({ message: 'Vaga não encontrada' })
      return
    }

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const job = await getJobById(id, userId)
    if (!job) {
      res.status(404).json({ message: 'Vaga não encontrada' })
      return
    }

    res.json(job)
  } catch (error) {
    console.error('Erro ao buscar vaga:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// POST /api/jobs
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const { company, position, location, salary, url, description, notes, status, appliedAt } = req.body

    // Validações
    if (!company || !position || !location) {
      res.status(400).json({ message: 'Empresa, cargo e localização são obrigatórios' })
      return
    }

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Status inválido' })
      return
    }

    const job = await createJob(userId, {
      company,
      position,
      location,
      salary,
      url,
      description,
      notes,
      status: status || 'wishlist',
      appliedAt
    })

    res.status(201).json(job)
  } catch (error) {
    console.error('Erro ao criar vaga:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// PATCH /api/jobs/:id
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const id = String(req.params.id)

    if (!UUID_REGEX.test(id)) {
      res.status(404).json({ message: 'Vaga não encontrada' })
      return
    }

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      res.status(400).json({ message: 'Status inválido' })
      return
    }

    const job = await updateJob(id, userId, req.body)
    if (!job) {
      res.status(404).json({ message: 'Vaga não encontrada' })
      return
    }

    res.json(job)
  } catch (error) {
    console.error('Erro ao atualizar vaga:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// DELETE /api/jobs/:id
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const id = String(req.params.id)

    if (!UUID_REGEX.test(id)) {
      res.status(404).json({ message: 'Vaga não encontrada' })
      return
    }

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const deleted = await deleteJob(id, userId)
    if (!deleted) {
      res.status(404).json({ message: 'Vaga não encontrada' })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error('Erro ao deletar vaga:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}
