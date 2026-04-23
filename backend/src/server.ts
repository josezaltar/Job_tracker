import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes'

// Carrega variáveis de ambiente
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Rotas
app.use('/api', routes)

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rota 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' })
})

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
  console.log(`📋 API disponível em http://localhost:${PORT}/api`)
})
