// Service worker da extensão: faz as chamadas demoradas (IA e Job Tracker) fora do popup.
// O popup pode fechar a qualquer momento; o trabalho continua aqui e o resultado fica salvo.
import { analyzeJob } from './lib/analyze.ts'
import { patchJobState, getJobState, type Message } from './lib/jobState.ts'
import {
  buildPayload,
  createJob,
  findJobsByUrl,
  friendlyNetworkError,
  SessionExpiredError,
} from './lib/jobTracker.ts'
import { effectiveGroqKey, loadSettings, saveSettings } from './lib/settings.ts'
import { studyProfileLines } from './lib/stats.ts'
import { loadStudy } from './lib/study.ts'
import type { PageContent } from './lib/page.ts'
import type { JobFields } from './lib/jobTracker.ts'

async function analyze(page: PageContent) {
  const settings = await loadSettings()
  await patchJobState(page.jobUrl, { task: 'analyzing', taskStartedAt: Date.now(), error: undefined })
  try {
    const analysis = await analyzeJob({
      key: effectiveGroqKey(settings),
      model: settings.model,
      // O que você marcou como "Estudando" ou "Aprendi" entra no perfil enviado para a IA
      profile: [settings.profile, studyProfileLines(await loadStudy())].filter(Boolean).join('\n'),
      text: page.text,
      url: page.jobUrl,
      title: page.title,
    })
    await patchJobState(page.jobUrl, { analysis, analyzedAt: new Date().toISOString(), task: undefined })
  } catch (error) {
    await patchJobState(page.jobUrl, { task: undefined, error: friendlyNetworkError(error) })
  }
}

async function save(page: PageContent, fields: JobFields) {
  const settings = await loadSettings()
  const { analysis } = await getJobState(page.jobUrl)
  if (!analysis) {
    await patchJobState(page.jobUrl, { error: 'Analise a vaga antes de salvar.' })
    return
  }
  if (!settings.token) {
    await patchJobState(page.jobUrl, { error: 'Conecte sua conta do Job Tracker nas opções.' })
    return
  }

  await patchJobState(page.jobUrl, { task: 'saving', taskStartedAt: Date.now(), error: undefined })
  try {
    // Se a vaga já estiver no Job Tracker, não cria outra
    const [existing] = await findJobsByUrl(settings.apiUrl, settings.token, page.jobUrl)
    const job =
      existing ??
      (await createJob(settings.apiUrl, settings.token, buildPayload(fields, analysis, page.jobUrl, page.text)))

    await patchJobState(page.jobUrl, {
      task: undefined,
      saved: {
        id: job.id,
        company: job.company,
        position: job.position,
        duplicate: Boolean(existing),
        at: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof SessionExpiredError) await saveSettings({ token: '' })
    await patchJobState(page.jobUrl, { task: undefined, error: friendlyNetworkError(error) })
  }
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  const work = message.type === 'analyze' ? analyze(message.page) : message.type === 'save' ? save(message.page, message.fields) : null
  if (!work) return false
  work.finally(() => sendResponse({ ok: true }))
  return true // mantém o canal aberto até o trabalho terminar
})
