// Carrega as variáveis de ambiente antes de qualquer outro módulo
import { env } from './config/env'
import express from 'express'
import cors from 'cors'
import routes from './routes'
import { migrate } from './db/migrate'
import { seedDemo } from './db/seedDemo'
import { pool } from './db/pool'

const app = express()

// CORS: em produção libera apenas as origens configuradas em CORS_ORIGIN
app.use(
  cors({
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
  })
)
app.use(express.json())

// Rotas
app.use('/api', routes)

// Health check (também confere a conexão com o banco)
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

// Informações públicas da conta demo (usadas pelo botão "Entrar com conta demo")
app.get('/api/demo', (_req, res) => {
  if (!env.demo.enabled) {
    res.status(404).json({ message: 'Conta demo desativada' })
    return
  }
  res.json({ email: env.demo.email, password: env.demo.password })
})

// Rota 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' })
})

const start = async () => {
  await migrate()
  await seedDemo()

  app.listen(env.port, () => {
    console.log(`🚀 Servidor rodando na porta ${env.port}`)
    console.log(`📋 API disponível em /api`)
  })
}

start().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error)
  process.exit(1)
})
