import { useEffect, useRef, useState } from 'react'
import type { Analysis } from '../lib/analyze.ts'
import { getJobState, runningTask, stateKey, type JobState, type Message } from '../lib/jobState.ts'
import type { JobFields, JobStatus } from '../lib/jobTracker.ts'
import { getPageContent, type PageContent } from '../lib/page.ts'
import { isProfileTemplate, loadSettings, type Settings } from '../lib/settings.ts'

const COLORS: Record<Analysis['veredito'], string> = {
  ALTA: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  MÉDIA: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  BAIXA: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
}

const STATUS: { value: JobStatus; label: string }[] = [
  { value: 'wishlist', label: 'Quero aplicar' },
  { value: 'applied', label: 'Já apliquei' },
]

const SOURCE_LABEL: Record<PageContent['source'], string> = {
  selecao: 'Usando o texto que você selecionou',
  descricao: 'Usando a descrição da vaga encontrada na página',
  pagina: 'Usando o texto da página. Para mais precisão, selecione a descrição da vaga antes',
}

const informado = (v: string) => (v === 'Não informado' ? '' : v)

// "popup.html?tab=123" analisa uma aba específica em vez da aba ativa
const TARGET_TAB = Number(new URLSearchParams(location.search).get('tab')) || undefined

function List({ title, items, sign, color }: { title: string; items: string[]; sign: string; color: string }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5 text-[12.5px] leading-snug">
            <span className={`${color} font-bold`}>{sign}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function send(message: Message) {
  // O resultado chega pelo chrome.storage; aqui só disparamos o trabalho no service worker.
  chrome.runtime.sendMessage(message).catch(() => {})
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [page, setPage] = useState<PageContent | null>(null)
  const [state, setState] = useState<JobState>({})
  const [fields, setFields] = useState<JobFields>({ empresa: '', cargo: '', local: '', salario: '', status: 'wishlist' })
  const [pageError, setPageError] = useState('')
  const [reading, setReading] = useState(false)
  const filledFor = useRef<string>('') // evita sobrescrever o que o usuário editou

  useEffect(() => {
    let key = ''
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && key && changes[key]) setState((changes[key].newValue as JobState) ?? {})
      if (area === 'local' && changes.settings) loadSettings().then(setSettings)
    }
    chrome.storage.onChanged.addListener(onChange)
    ;(async () => {
      setSettings(await loadSettings())
      try {
        const p = await getPageContent(TARGET_TAB)
        setPage(p)
        key = stateKey(p.jobUrl)
        setState(await getJobState(p.jobUrl))
      } catch (e) {
        setPageError((e as Error).message)
      }
    })()
    return () => chrome.storage.onChanged.removeListener(onChange)
  }, [])

  // Preenche os campos de salvar com o que a IA encontrou (uma vez por análise)
  useEffect(() => {
    const a = state.analysis
    if (!a || filledFor.current === state.analyzedAt) return
    filledFor.current = state.analyzedAt ?? 'cache'
    setFields((f) => ({ ...f, empresa: informado(a.empresa), cargo: informado(a.cargo), local: informado(a.local), salario: informado(a.salario) }))
  }, [state.analysis, state.analyzedAt])

  async function analyze() {
    setPageError('')
    setReading(true)
    try {
      const p = await getPageContent(TARGET_TAB) // relê: o usuário pode ter selecionado o texto agora
      setPage(p)
      send({ type: 'analyze', page: p })
    } catch (e) {
      setPageError((e as Error).message)
    } finally {
      setReading(false)
    }
  }

  function save() {
    if (page) send({ type: 'save', page, fields })
  }

  const openOptions = () => chrome.runtime.openOptionsPage()

  if (!settings) return <div className="w-[380px] p-4 text-sm">Carregando…</div>

  const task = runningTask(state)
  const analysis = state.analysis
  const profileMissing = isProfileTemplate(settings.profile)
  const setupMissing = !settings.groqKey || profileMissing
  const error = pageError || state.error

  return (
    <div className="w-[380px] space-y-3 p-4 text-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="icons/icon48.png" alt="" className="h-6 w-6" />
          <h1 className="text-[15px] font-bold">Analisador de Vagas</h1>
        </div>
        <button onClick={openOptions} className="text-xs text-slate-400 hover:text-slate-200" title="Configurações">
          ⚙ Opções
        </button>
      </header>

      {setupMissing && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-[12.5px] text-amber-200">
          {!settings.groqKey ? 'Falta a chave da Groq' : 'Falta preencher o seu perfil'}.{' '}
          <button onClick={openOptions} className="font-semibold underline">
            Configurar agora
          </button>
        </div>
      )}

      {page && !analysis && <p className="text-[11.5px] text-slate-400">{SOURCE_LABEL[page.source]} ({page.text.length} caracteres).</p>}

      <button onClick={analyze} disabled={Boolean(task) || reading || setupMissing || !page} className="btn btn-primary w-full">
        {reading ? 'Lendo a página…' : task === 'analyzing' ? 'Analisando com IA…' : analysis ? 'Analisar de novo' : 'Analisar vaga'}
      </button>

      {error && <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2.5 text-[12.5px] text-rose-200">{error}</div>}

      {analysis && (
        <section className="space-y-2.5 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 ${COLORS[analysis.veredito]}`}>
              <span className="text-lg font-bold leading-none">{analysis.nota}</span>
              <span className="text-[9px]">/100</span>
            </div>
            <div className="min-w-0">
              <p className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-bold ${COLORS[analysis.veredito]}`}>
                Chance {analysis.veredito}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-slate-300">{analysis.resumo}</p>
            </div>
          </div>

          <p className="text-[12px] text-slate-300">
            📄 Envie o currículo <b className="text-white">{analysis.curriculo}</b>
            {analysis.nivel_vaga !== 'Não informado' && <> · Nível: {analysis.nivel_vaga}</>}
          </p>

          <List title="O que bate" items={analysis.bate} sign="+" color="text-emerald-400" />
          <List title="O que falta" items={analysis.falta} sign="−" color="text-amber-400" />
          <List title="Eliminatórios" items={analysis.eliminatorios} sign="!" color="text-rose-400" />

          {analysis.dica && <p className="rounded bg-slate-900/60 p-2 text-[12px] text-sky-200">💡 {analysis.dica}</p>}
        </section>
      )}

      {analysis && state.saved && (
        <div className="space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
          <p className="text-[13px] font-semibold text-emerald-300">
            {state.saved.duplicate ? '✓ Essa vaga já estava no seu Job Tracker' : '✓ Vaga salva no Job Tracker'}
          </p>
          <p className="text-[12px] text-slate-300">
            {state.saved.position} — {state.saved.company}
          </p>
          <button onClick={() => chrome.tabs.create({ url: `${settings.appUrl.replace(/\/+$/, '')}/jobs` })} className="btn btn-primary w-full">
            Abrir Job Tracker
          </button>
        </div>
      )}

      {analysis && !state.saved && (
        <section className="space-y-2 rounded-lg border border-slate-700 p-3">
          <p className="text-[12px] font-semibold text-slate-300">Salvar no Job Tracker</p>
          {!settings.token ? (
            <p className="text-[12.5px] text-slate-400">
              Conecte sua conta do Job Tracker nas{' '}
              <button onClick={openOptions} className="font-semibold text-sky-300 underline">
                opções
              </button>{' '}
              para salvar vagas com um clique.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['empresa', 'Empresa'],
                    ['cargo', 'Cargo'],
                    ['local', 'Local'],
                    ['salario', 'Salário'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-[11px] text-slate-400">
                    {label}
                    <input
                      className="field mt-0.5"
                      value={fields[key]}
                      placeholder="Não informado"
                      onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                {STATUS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFields({ ...fields, status: s.value })}
                    className={`btn flex-1 ${fields.status === s.value ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button onClick={save} disabled={Boolean(task)} className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700">
                {task === 'saving' ? 'Salvando… pode fechar, eu termino sozinho' : 'Salvar no Job Tracker'}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  )
}
