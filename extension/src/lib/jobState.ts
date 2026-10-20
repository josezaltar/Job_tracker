// Estado de cada vaga (análise, tarefa em andamento, vaga salva), guardado no chrome.storage.local.
// O service worker escreve; o popup lê e acompanha as mudanças. Assim, fechar o popup no meio
// da análise ou do salvamento não perde nada: ao abrir de novo, o resultado está lá.
import type { Analysis } from './analyze.ts'
import type { JobFields } from './jobTracker.ts'
import type { PageContent } from './page.ts'

export type Task = 'analyzing' | 'saving'

export interface JobState {
  analysis?: Analysis
  analyzedAt?: string
  task?: Task
  taskStartedAt?: number
  error?: string
  saved?: { id: string; company: string; position: string; duplicate: boolean; at: string }
}

// Mensagens que o popup manda para o service worker
export type Message =
  | { type: 'analyze'; page: PageContent }
  | { type: 'save'; page: PageContent; fields: JobFields }

// Uma tarefa "presa" (o navegador fechou no meio) deixa de contar depois de 3 minutos.
const STALE_MS = 3 * 60 * 1000

export const stateKey = (jobUrl: string) => `job:${jobUrl}`

export function runningTask(state: JobState | undefined, now = Date.now()): Task | undefined {
  if (!state?.task || !state.taskStartedAt) return undefined
  return now - state.taskStartedAt < STALE_MS ? state.task : undefined
}

export async function getJobState(jobUrl: string): Promise<JobState> {
  const key = stateKey(jobUrl)
  const stored = (await chrome.storage.local.get(key)) as Record<string, JobState | undefined>
  return stored[key] ?? {}
}

export async function patchJobState(jobUrl: string, patch: Partial<JobState>): Promise<JobState> {
  const next = { ...(await getJobState(jobUrl)), ...patch }
  for (const k of Object.keys(next) as (keyof JobState)[]) {
    if (next[k] === undefined) delete next[k]
  }
  await chrome.storage.local.set({ [stateKey(jobUrl)]: next })
  return next
}
