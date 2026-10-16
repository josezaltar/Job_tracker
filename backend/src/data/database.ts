import { pool } from '../db/pool'
import type { User, Job, JobStatus } from '../types'

// Colunas em snake_case no banco, convertidas para camelCase na resposta da API
const USER_COLUMNS = `id, name, email, password, created_at AS "createdAt"`

const JOB_COLUMNS = `
  id,
  user_id AS "userId",
  company,
  position,
  location,
  salary,
  url,
  description,
  notes,
  status,
  to_char(applied_at, 'YYYY-MM-DD') AS "appliedAt",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

// Campos que o cliente pode enviar ao criar/editar uma vaga
export type JobInput = {
  company?: string
  position?: string
  location?: string
  salary?: string | null
  url?: string | null
  description?: string | null
  notes?: string | null
  status?: JobStatus
  appliedAt?: string | null
}

const EDITABLE_FIELDS: Record<keyof JobInput, string> = {
  company: 'company',
  position: 'position',
  location: 'location',
  salary: 'salary',
  url: 'url',
  description: 'description',
  notes: 'notes',
  status: 'status',
  appliedAt: 'applied_at',
}

// Strings vazias viram NULL (ex.: data de candidatura não preenchida no formulário)
const normalize = (value: unknown) => (value === '' || value === undefined ? null : value)

// ========== USUÁRIOS ==========

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const { rows } = await pool.query<User>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email.toLowerCase()]
  )
  return rows[0]
}

export const findUserById = async (id: string): Promise<User | undefined> => {
  const { rows } = await pool.query<User>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id])
  return rows[0]
}

export const createUser = async (user: Pick<User, 'name' | 'email' | 'password'>): Promise<User> => {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING ${USER_COLUMNS}`,
    [user.name, user.email.toLowerCase(), user.password]
  )
  return rows[0]
}

// ========== VAGAS ==========

export const getJobsByUserId = async (userId: string): Promise<Job[]> => {
  const { rows } = await pool.query<Job>(
    `SELECT ${JOB_COLUMNS} FROM jobs WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  )
  return rows
}

export const getJobById = async (id: string, userId: string): Promise<Job | undefined> => {
  const { rows } = await pool.query<Job>(
    `SELECT ${JOB_COLUMNS} FROM jobs WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
  return rows[0]
}

export const createJob = async (
  userId: string,
  job: Required<Pick<JobInput, 'company' | 'position' | 'location'>> & JobInput
): Promise<Job> => {
  const { rows } = await pool.query<Job>(
    `INSERT INTO jobs (user_id, company, position, location, salary, url, description, notes, status, applied_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${JOB_COLUMNS}`,
    [
      userId,
      job.company,
      job.position,
      job.location,
      normalize(job.salary),
      normalize(job.url),
      normalize(job.description),
      normalize(job.notes),
      job.status || 'wishlist',
      normalize(job.appliedAt),
    ]
  )
  return rows[0]
}

export const updateJob = async (id: string, userId: string, data: JobInput): Promise<Job | null> => {
  // Só atualiza campos permitidos: id, userId e datas de controle nunca vêm do cliente
  const sets: string[] = []
  const values: unknown[] = []

  for (const [field, column] of Object.entries(EDITABLE_FIELDS)) {
    if (field in data) {
      values.push(normalize(data[field as keyof JobInput]))
      sets.push(`${column} = $${values.length}`)
    }
  }

  // Ao marcar como "aplicado" sem informar a data, registra o dia de hoje
  if (data.status === 'applied' && !('appliedAt' in data)) {
    sets.push('applied_at = COALESCE(applied_at, CURRENT_DATE)')
  }

  if (sets.length === 0) {
    return (await getJobById(id, userId)) ?? null
  }

  values.push(id, userId)
  const { rows } = await pool.query<Job>(
    `UPDATE jobs SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING ${JOB_COLUMNS}`,
    values
  )
  return rows[0] ?? null
}

export const deleteJob = async (id: string, userId: string): Promise<boolean> => {
  const { rowCount } = await pool.query(`DELETE FROM jobs WHERE id = $1 AND user_id = $2`, [id, userId])
  return (rowCount ?? 0) > 0
}
