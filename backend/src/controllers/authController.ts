import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findUserByEmail, findUserById, createUser } from '../data/database'
import type { AuthRequest } from '../types'

import { env } from '../config/env'

// Gera o token JWT
const generateToken = (id: string, email: string): string => {
  return jwt.sign({ id, email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    // Validações
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Preencha todos os campos' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' })
      return
    }

    // Verifica se email já existe
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      res.status(400).json({ message: 'Email já cadastrado' })
      return
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Cria o usuário
    const user = await createUser({
      name,
      email,
      password: hashedPassword
    })

    // Gera o token
    const token = generateToken(user.id, user.email)

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    console.error('Erro no registro:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validações
    if (!email || !password) {
      res.status(400).json({ message: 'Preencha todos os campos' })
      return
    }

    // Busca o usuário
    const user = await findUserByEmail(email)
    if (!user) {
      res.status(401).json({ message: 'Credenciais inválidas' })
      return
    }

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      res.status(401).json({ message: 'Credenciais inválidas' })
      return
    }

    // Gera o token
    const token = generateToken(user.id, user.email)

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Não autenticado' })
      return
    }

    const user = await findUserById(userId)
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' })
      return
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}
