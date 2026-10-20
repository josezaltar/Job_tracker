// Status de estudo de cada requisito ("Não comecei", "Estudando", "Aprendi"), salvo no navegador.
import type { StudyMap, StudyStatus } from './stats.ts'

export async function loadStudy(): Promise<StudyMap> {
  const stored = (await chrome.storage.local.get('study')) as { study?: StudyMap }
  return stored.study ?? {}
}

export async function setStudy(key: string, nome: string, status: StudyStatus): Promise<StudyMap> {
  const study = await loadStudy()
  if (status === 'todo') delete study[key]
  else study[key] = { status, nome }
  await chrome.storage.local.set({ study })
  return study
}
