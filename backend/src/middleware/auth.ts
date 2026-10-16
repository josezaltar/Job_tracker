import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthRequest } from '../types'

import { env } from '../config/env'

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ message: 'Token não fornecido' })
    return
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2) {
    res.status(401).json({ message: 'Token mal formatado' })
    return
  }

  const [scheme, token] = parts

  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ message: 'Token mal formatado' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; email: string }
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' })
  }
}
