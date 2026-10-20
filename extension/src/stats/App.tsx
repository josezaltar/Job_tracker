import { useEffect, useMemo, useState } from 'react'
import type { TipoLacuna } from '../lib/analyze.ts'
import { getAllJobStates } from '../lib/jobState.ts'
import { aggregate, tipoLabel, toCsv, type GapStat, type Stats, type StudyMap, type StudyStatus } from '../lib/stats.ts'
import { loadStudy, setStudy } from '../lib/study.ts'

const FILTERS: { value: TipoLacuna | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Tudo' },
  { value: 'tecnologia', label: 'Tecnologias' },
  { value: 'idioma', label: 'Idiomas' },
  { value: 'experiencia', label: 'Experiência' },
  { value: 'formacao', label: 'Formação' },
  { value: 'outro', label: 'Outros' },
]

const STATUS: { value: StudyStatus; label: string; active: string }[] = [
  { value: 'todo', label: 'Não comecei', active: 'bg-slate-600 text-white' },
  { value: 'studying', label: 'Estudando', active: 'bg-amber-500 text-slate-950' },
  { value: 'learned', label: 'Aprendi', active: 'bg-emerald-500 text-slate-950' },
]

const studyLink = (nome: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nome} curso completo em português`)}`

function Summary({ stats }: { stats: Stats }) {
  const { ALTA, MÉDIA, BAIXA } = stats.verdicts
  const pct = (n: number) => (stats.total ? (n / stats.total) * 100 : 0)
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-[12px] uppercase tracking-wide text-slate-400">Vagas analisadas</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{stats.total}</p>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-[12px] uppercase tracking-wide text-slate-400">Nota média</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {stats.avgScore}
          <span className="text-base font-normal text-slate-400">/100</span>
        </p>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-[12px] uppercase tracking-wide text-slate-400">Chance por vaga</p>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-700" aria-hidden>
          <div className="bg-emerald-500" style={{ width: `${pct(ALTA)}%` }} />
          <div className="bg-amber-500" style={{ width: `${pct(MÉDIA)}%` }} />
          <div className="bg-rose-500" style={{ width: `${pct(BAIXA)}%` }} />
        </div>
        <p className="mt-2 text-[12.5px] text-slate-300 tabular-nums">
          <span className="text-emerald-300">{ALTA} alta</span> · <span className="text-amber-300">{MÉDIA} média</span> ·{' '}
          <span className="text-rose-300">{BAIXA} baixa</span>
        </p>
      </div>
    </section>
  )
}

function GapRow({ gap, total, status, onStatus }: { gap: GapStat; total: number; status: StudyStatus; onStatus: (s: StudyStatus) => void }) {
  const [open, setOpen] = useState(false)
  const studiable = gap.tipo === 'tecnologia' || gap.tipo === 'idioma' || gap.tipo === 'outro'
  return (
    <li className="space-y-2 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-[15px] font-semibold">{gap.nome}</h3>
          <span className="rounded border border-slate-600 px-1.5 py-0.5 text-[11px] text-slate-300">{tipoLabel(gap.tipo)}</span>
        </div>
        <div className="flex overflow-hidden rounded-md border border-slate-600" role="group" aria-label={`Status de ${gap.nome}`}>
          {STATUS.map((s) => (
            <button
              key={s.value}
              onClick={() => onStatus(s.value)}
              className={`px-2.5 py-1 text-[12px] font-semibold ${status === s.value ? s.active : 'text-slate-300 hover:bg-slate-700'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${gap.pct}%` }} />
        </div>
        <p className="shrink-0 whitespace-nowrap text-right text-[12.5px] text-slate-300 tabular-nums">
          {gap.count} de {total} vagas ({gap.pct}%)
          {gap.required > 0 && <span className="text-rose-300"> · obrigatório em {gap.required}</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
        <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-slate-200">
          {open ? '▾' : '▸'} Ver as vagas
        </button>
        {studiable && (
          <a className="text-sky-300 underline" href={studyLink(gap.nome)} target="_blank" rel="noreferrer">
            Procurar aulas
          </a>
        )}
        {gap.tipo === 'experiencia' && <span className="text-slate-400">Projetos publicados e freelas contam como experiência.</span>}
      </div>

      {open && (
        <ul className="space-y-1 border-t border-slate-700 pt-2">
          {gap.jobs.map((j) => (
            <li key={j.url} className="flex justify-between gap-3 text-[12.5px]">
              <a className="truncate text-slate-200 hover:underline" href={j.url} target="_blank" rel="noreferrer">
                {j.position} — {j.company}
              </a>
              <span className="shrink-0 text-slate-400 tabular-nums">{j.nota}/100</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [study, setStudyMap] = useState<StudyMap>({})
  const [filter, setFilter] = useState<TipoLacuna | 'todos'>('todos')
  const [hideLearned, setHideLearned] = useState(false)

  useEffect(() => {
    ;(async () => {
      setStats(aggregate(await getAllJobStates()))
      setStudyMap(await loadStudy())
    })()
  }, [])

  const visible = useMemo(
    () =>
      (stats?.gaps ?? []).filter(
        (g) => (filter === 'todos' || g.tipo === filter) && !(hideLearned && study[g.key]?.status === 'learned'),
      ),
    [stats, filter, hideLearned, study],
  )

  const startHere = useMemo(
    () => (stats?.gaps ?? []).filter((g) => g.tipo === 'tecnologia' && study[g.key]?.status !== 'learned').slice(0, 3),
    [stats, study],
  )

  async function changeStatus(gap: GapStat, status: StudyStatus) {
    setStudyMap(await setStudy(gap.key, gap.nome, status))
  }

  function downloadCsv() {
    if (!stats) return
    const blob = new Blob(['﻿' + toCsv(stats, study)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `o-que-estudar-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!stats) return null

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="icons/icon48.png" alt="" className="h-9 w-9" />
          <div>
            <h1 className="text-xl font-bold">O que estudar</h1>
            <p className="text-slate-400">O que mais falta nas vagas que você analisou com a extensão.</p>
          </div>
        </div>
        {stats.total > 0 && (
          <button onClick={downloadCsv} className="btn btn-ghost">
            Baixar planilha (CSV)
          </button>
        )}
      </header>

      {stats.total === 0 ? (
        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-300">
          <p className="text-base font-semibold">Nenhuma vaga analisada ainda.</p>
          <p className="mt-1 text-slate-400">
            Abra uma vaga no LinkedIn, Gupy ou Indeed e clique em <b>Analisar vaga</b> na extensão. A partir de 5 vagas, o ranking já mostra
            um padrão.
          </p>
        </section>
      ) : (
        <>
          <Summary stats={stats} />

          {startHere.length > 0 && (
            <section className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4">
              <h2 className="text-[15px] font-semibold text-sky-200">Comece por aqui</h2>
              <p className="mt-1 text-slate-300">
                As tecnologias que mais aparecem e você ainda não marcou como aprendidas:{' '}
                {startHere.map((g, i) => (
                  <span key={g.key}>
                    <b className="text-white">{g.nome}</b> ({g.pct}%){i < startHere.length - 1 ? ', ' : '.'}
                  </span>
                ))}{' '}
                Estudar e publicar um projeto pequeno com cada uma é o que mais sobe a sua nota.
              </p>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`rounded-full border px-3 py-1 text-[12.5px] ${
                      filter === f.value ? 'border-sky-500 bg-sky-500/20 text-sky-100' : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-slate-300">
                <input type="checkbox" checked={hideLearned} onChange={(e) => setHideLearned(e.target.checked)} />
                Esconder o que já aprendi
              </label>
            </div>

            {visible.length === 0 ? (
              <p className="text-slate-400">Nada nesta categoria.</p>
            ) : (
              <ol className="space-y-2">
                {visible.map((g) => (
                  <GapRow key={g.key} gap={g} total={stats.total} status={study[g.key]?.status ?? 'todo'} onStatus={(s) => changeStatus(g, s)} />
                ))}
              </ol>
            )}
          </section>

          <p className="text-[12.5px] text-slate-400">
            O que você marcar como <b>Estudando</b> ou <b>Aprendi</b> entra no seu perfil nas próximas análises. Depois de publicar um projeto
            com a tecnologia, acrescente ela na linha "Stack com projetos" do perfil, nas opções.
          </p>
        </>
      )}
    </main>
  )
}
