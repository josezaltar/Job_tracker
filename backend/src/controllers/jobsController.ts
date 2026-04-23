import { Response } from 'express'
import { 
  getJobsByUserId, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob 
} from '../data/database'
import type { AuthRequest } from '../types'

// GET /api/jobs
export const getJobs = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const jobs = getJobsByUserId(userId)
    res.json(jobs)
  } catch (error) {
    console.error('Erro ao buscar vagas:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// GET /api/jobs/:id
export const getJob = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const job = getJobById(id, userId)
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
export const create = (req: AuthRequest, res: Response): void => {
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

    const job = createJob({
      userId,
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
export const update = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const job = updateJob(id, userId, req.body)
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
export const remove = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const deleted = deleteJob(id, userId)
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
