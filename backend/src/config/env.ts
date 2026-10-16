import 'dotenv/config'

const isProduction = process.env.NODE_ENV === 'production'

const required = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`)
  }
  return value
}

// Em produção o JWT_SECRET é obrigatório; em desenvolvimento usa um valor local
const jwtSecret = isProduction
  ? required('JWT_SECRET')
  : process.env.JWT_SECRET || 'dev-secret-somente-local'

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 3001,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Lista de origens permitidas separadas por vírgula. Vazio = libera todas (útil no dev)
  corsOrigins: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  demo: {
    enabled: process.env.DEMO_ENABLED !== 'false',
    email: process.env.DEMO_EMAIL || 'demo@jobtracker.dev',
    password: process.env.DEMO_PASSWORD || 'demo1234',
  },
}
