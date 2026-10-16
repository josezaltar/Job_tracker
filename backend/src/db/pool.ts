import { Pool } from 'pg'
import { env } from '../config/env'

const isLocal = /localhost|127\.0\.0\.1/.test(env.databaseUrl)

export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Bancos na nuvem (Neon, Render, Supabase) exigem SSL; o banco local não
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
})
