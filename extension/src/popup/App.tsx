import { useEffect, useState } from 'react'
import { analyzeJob, type Analysis } from '../lib/analyze.ts'
import { buildPayload, createJob, SessionExpiredError, type JobFields, type JobStatus } from '../lib/jobTracker.ts'
import { getPageContent, type PageContent } from '../lib/page.ts'
import { loadSettings, saveSettings, type Settings } from '../lib/settings.ts'

type Phase = 'idle' | 'reading' | 'analyzing' | 'done' | 'saving' | 'saved'

const COLORS: Record<Analysis['veredito'], string> = {
  ALTA: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  MÉDIA: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  BAIXA: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
}

const STATUS: { value: JobStatus; label: string }[] = [
  { value: 'wishlist', label: 'Quero aplicar' },
  { value: 'applied', label: 'Já apliquei' },
]

const CACHE_KEY = (url: string) => `analysis:${url}`

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

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [page, setPage] = useState<PageContent | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [fields, setFields] = useState<JobFields>({ empresa: '', cargo: '', local: '', salario: '', status: 'wishlist' })
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      const s = await loadSettings()
      setSettings(s)
      try {
        const p = await getPageContent()
        setPage(p)
        const cached = (await chrome.storage.local.get(CACHE_KEY(p.url)))[CACHE_KEY(p.url)] as Analysis | undefined
        if (cached) showAnalysis(cached)
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [])

  function showAnalysis(a: Analysis) {
    setAnalysis(a)
    setFields((f) => ({
      ...f,
      empresa: a.empresa === 'Não informado' ? '' : a.empresa,
      cargo: a.cargo === 'Não informado' ? '' : a.cargo,
      local: a.local === 'Não informado' ? '' : a.local,
      salario: a.salario === 'Não informado' ? '' : a.salario,
    }))
    setPhase('done')
  }

  async function analyze() {
    if (!settings) return
    setError('')
    try {
      setPhase('reading')
      const p = await getPageContent() // relê: o usuário pode ter selecionado o texto
      setPage(p)
      setPhase('analyzing')
      const a = await analyzeJob({ key: settings.groqKey, model: settings.model, profile: settings.profile, ...p })
      await chrome.storage.local.set({ [CACHE_KEY(p.url)]: a })
      showAnalysis(a)
    } catch (e) {
      setError((e as Error).message)
      setPhase(analysis ? 'done' : 'idle')
    }
  }

  async function save() {
    if (!settings || !analysis || !page) return
    setError('')
    setPhase('saving')
    try {
      await createJob(settings.apiUrl, settings.token, buildPayload(fields, analysis, page.url, page.text))
      setPhase('saved')
    } catch (e) {
      if (e instanceof SessionExpiredError) setSettings(await saveSettings({ token: '' }))
      const msg = (e as Error).message
      setError(msg === 'Failed to fetch' ? 'Servidor do Job Tracker fora do ar. Tente de novo em 1 minuto.' : msg)
      setPhase('done')
    }
  }

  const openOptions = () => chrome.runtime.openOptionsPage()
  const busy = phase === 'reading' || phase === 'analyzing' || phase === 'saving'

  if (!settings) return <div className="w-[380px] p-4 text-sm">Carregando…</div>

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

      {!settings.groqKey && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-[12.5px] text-amber-200">
          Falta a chave da Groq.{' '}
          <button onClick={openOptions} className="font-semibold underline">
            Configurar agora
          </button>
        </div>
      )}

      {page && phase !== 'saved' && (
        <p className="text-[11.5px] text-slate-400">
          {page.source === 'selecao'
            ? `Usando o texto selecionado (${page.text.length} caracteres).`
            : 'Usando o texto da página. Para mais precisão, selecione a descrição da vaga antes.'}
        </p>
      )}

      {phase !== 'saved' && (
        <button onClick={analyze} disabled={busy || !settings.groqKey || !page} className="btn btn-primary w-full">
          {phase === 'reading' ? 'Lendo a página…' : phase === 'analyzing' ? 'Analisando com IA…' : analysis ? 'Analisar de novo' : 'Analisar vaga'}
        </button>
      )}

      {error && <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2.5 text-[12.5px] text-rose-200">{error}</div>}

      {analysis && phase !== 'saved' && (
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

      {analysis && phase !== 'saved' && (
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
              <button onClick={save} disabled={busy} className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700">
                {phase === 'saving' ? 'Salvando… (o servidor pode levar até 1 min para acordar)' : 'Salvar no Job Tracker'}
              </button>
            </>
          )}
        </section>
      )}

      {phase === 'saved' && (
        <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <p className="text-[15px] font-semibold text-emerald-300">✓ Vaga salva!</p>
          <p className="text-[12.5px] text-slate-300">
            {fields.cargo || 'Vaga'} — {fields.empresa || 'empresa'}, com a análise nas observações.
          </p>
          <div className="flex gap-2">
            <button onClick={() => chrome.tabs.create({ url: `${settings.appUrl}/jobs` })} className="btn btn-primary flex-1">
              Abrir Job Tracker
            </button>
            <button onClick={() => window.close()} className="btn btn-ghost flex-1">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
