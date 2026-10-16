import bcrypt from 'bcryptjs'
import { pool } from './pool'
import { env } from '../config/env'

// Vagas de exemplo (empresas fictícias) para quem entrar com a conta demo
const demoJobs = [
  { company: 'TechNova', position: 'Desenvolvedor Front-end Júnior', location: 'Remoto', salary: 'R$ 5.000', status: 'interview', appliedAt: '2026-10-01', notes: 'Entrevista técnica marcada. Revisar React Query e testes.' },
  { company: 'Pixel Labs', position: 'Desenvolvedor Full Stack Júnior', location: 'Híbrido - Campinas', salary: 'R$ 6.000', status: 'applied', appliedAt: '2026-10-05' },
  { company: 'Bytewise', position: 'Desenvolvedor Back-end Júnior (Python)', location: 'Remoto', status: 'applied', appliedAt: '2026-10-08' },
  { company: 'Atlas Digital', position: 'Desenvolvedor React Júnior', location: 'Belo Horizonte - MG', salary: 'R$ 4.800', status: 'offer', appliedAt: '2026-09-20', notes: 'Proposta recebida, responder até sexta.' },
  { company: 'Nuvem Sistemas', position: 'Desenvolvedor Front-end', location: 'Belo Horizonte - MG', status: 'wishlist' },
  { company: 'Órbita Pay', position: 'Desenvolvedor Node.js Júnior', location: 'Remoto', status: 'rejected', appliedAt: '2026-09-10' },
]

/**
 * Garante que a conta demo exista e recria as vagas de exemplo.
 * Roda a cada inicialização do servidor, então qualquer alteração feita
 * por visitantes na conta demo é desfeita no próximo restart.
 */
export const seedDemo = async (): Promise<void> => {
  if (!env.demo.enabled) return

  const hashedPassword = await bcrypt.hash(env.demo.password, 10)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, password)
       VALUES ('Visitante Demo', $1, $2)
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
       RETURNING id`,
      [env.demo.email, hashedPassword]
    )
    const demoUserId = rows[0].id

    await client.query('DELETE FROM jobs WHERE user_id = $1', [demoUserId])

    for (const job of demoJobs) {
      await client.query(
        `INSERT INTO jobs (user_id, company, position, location, salary, status, applied_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [demoUserId, job.company, job.position, job.location, job.salary ?? null, job.status, job.appliedAt ?? null, job.notes ?? null]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
