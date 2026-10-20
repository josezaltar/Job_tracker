// Integração com a API do Job Tracker Pro.
import type { Analysis } from './analyze.ts'

export type JobStatus = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'accepted'

export interface JobPayload {
  company: string
  position: string
  location: string
  salary?: string
  url?: string
  description?: string
  notes?: string
  status: JobStatus
  appliedAt?: string
}

export interface JobFields {
  empresa: string
  cargo: string
  local: string
  salario: string
  status: JobStatus
}

export interface SavedJob {
  id: string
  company: string
  position: string
  url?: string | null
}

const DESCRIPTION_LIMIT = 12000

export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const trimApi = (apiUrl: string) => apiUrl.trim().replace(/\/+$/, '')
const informado = (v: string) => (v && v !== 'Não informado' ? v : '')

export function formatNotes(a: Analysis): string {
  const lines = [
    `Análise da extensão: ${a.nota}/100 — chance ${a.veredito}`,
    `Currículo indicado: ${a.curriculo}`,
    `Vaga: ${[a.nivel_vaga, a.modalidade, a.contrato].filter(informado).join(' · ') || 'Não informado'}`,
  ]
  if (a.resumo) lines.push('', a.resumo)
  if (a.bate.length) lines.push('', 'O que bate:', ...a.bate.map((x) => `+ ${x}`))
  if (a.falta.length) lines.push('', 'O que falta:', ...a.falta.map((x) => `- ${x}`))
  if (a.eliminatorios.length) lines.push('', 'Eliminatórios:', ...a.eliminatorios.map((x) => `! ${x}`))
  if (a.dica) lines.push('', `Dica: ${a.dica}`)
  return lines.join('\n')
}

export function buildPayload(fields: JobFields, analysis: Analysis, url: string, description: string): JobPayload {
  const location = informado(fields.local.trim()) || informado(analysis.modalidade) || 'Não informado'
  const payload: JobPayload = {
    company: fields.empresa.trim() || 'Não informado',
    position: fields.cargo.trim() || 'Não informado',
    location,
    url,
    description: description.slice(0, DESCRIPTION_LIMIT),
    notes: formatNotes(analysis),
    status: fields.status,
  }
  const salary = informado(fields.salario.trim())
  if (salary) payload.salary = salary
  if (fields.status === 'applied') payload.appliedAt = localDate()
  return payload
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string }
    return body.error || body.message || fallback
  } catch {
    return fallback
  }
}

export class SessionExpiredError extends Error {}

const SESSION_EXPIRED = 'Sua sessão no Job Tracker expirou. Conecte de novo nas opções.'

/**
 * Entra no Job Tracker e troca o login por um token de 90 dias para a extensão.
 * Se a API ainda não tiver essa rota (versão antiga), usa o token normal do login.
 */
export async function login(apiUrl: string, email: string, password: string) {
  const res = await fetch(`${trimApi(apiUrl)}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await readError(res, 'E-mail ou senha incorretos.'))
  const body = (await res.json()) as { token: string; user: { name?: string; email: string } }

  let token = body.token
  let longLived = false
  try {
    const ext = await fetch(`${trimApi(apiUrl)}/auth/extension-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${body.token}` },
    })
    if (ext.ok) {
      token = ((await ext.json()) as { token: string }).token
      longLived = true
    }
  } catch {
    // mantém o token do login
  }

  return { token, longLived, name: body.user?.name ?? '', email: body.user?.email ?? email }
}

/** Procura vagas já salvas com este link. Filtra aqui também, caso a API ignore o parâmetro. */
export async function findJobsByUrl(apiUrl: string, token: string, url: string): Promise<SavedJob[]> {
  const res = await fetch(`${trimApi(apiUrl)}/jobs?url=${encodeURIComponent(url)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) throw new SessionExpiredError(SESSION_EXPIRED)
  if (!res.ok) throw new Error(await readError(res, `Não foi possível consultar o Job Tracker (erro ${res.status}).`))
  const jobs = (await res.json()) as SavedJob[]
  return jobs.filter((job) => job.url === url)
}

export async function createJob(apiUrl: string, token: string, payload: JobPayload): Promise<SavedJob> {
  const res = await fetch(`${trimApi(apiUrl)}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (res.status === 401) throw new SessionExpiredError(SESSION_EXPIRED)
  if (!res.ok) throw new Error(await readError(res, `Não foi possível salvar (erro ${res.status}).`))
  return (await res.json()) as SavedJob
}

/** Mensagem amigável para falha de rede (servidor dormindo, sem internet). */
export function friendlyNetworkError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'Não consegui falar com o Job Tracker. O servidor pode estar acordando: tente de novo em 1 minuto.'
  }
  return msg
}
