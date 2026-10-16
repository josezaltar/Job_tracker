import { pool } from './pool'

// Cria as tabelas caso ainda não existam. Roda toda vez que o servidor sobe.
const schema = `
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  position     TEXT NOT NULL,
  location     TEXT NOT NULL,
  salary       TEXT,
  url          TEXT,
  description  TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'wishlist'
               CHECK (status IN ('wishlist', 'applied', 'interview', 'offer', 'rejected', 'accepted')),
  applied_at   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
`

export const migrate = async (): Promise<void> => {
  await pool.query(schema)
}
