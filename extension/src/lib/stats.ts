// Junta as lacunas de todas as vagas analisadas e monta o ranking do que estudar.
// Funções puras (sem APIs do navegador), testadas em tests/stats.test.ts.
import type { Analysis, Lacuna, TipoLacuna, Veredito } from './analyze.ts'
import type { JobState } from './jobState.ts'

export type StudyStatus = 'todo' | 'studying' | 'learned'
export interface StudyEntry {
  status: StudyStatus
  nome: string
}
export type StudyMap = Record<string, StudyEntry>

export interface GapJob {
  company: string
  position: string
  url: string
  nota: number
}

export interface GapStat {
  key: string
  nome: string
  tipo: TipoLacuna
  count: number // em quantas vagas apareceu
  required: number // em quantas era obrigatório
  pct: number // % das vagas analisadas
  jobs: GapJob[]
}

export interface Stats {
  total: number
  avgScore: number
  verdicts: Record<Veredito, number>
  gaps: GapStat[]
}

// Grafias diferentes da mesma coisa viram uma só
const ALIASES: Record<string, string> = {
  nextjs: 'Next.js',
  next: 'Next.js',
  nodejs: 'Node.js',
  node: 'Node.js',
  reactnative: 'React Native',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',
  vuejs: 'Vue.js',
  vue: 'Vue.js',
  angularjs: 'Angular',
  angular: 'Angular',
  aws: 'AWS',
  amazonwebservices: 'AWS',
  docker: 'Docker',
  jest: 'Jest',
  cicd: 'CI/CD',
  graphql: 'GraphQL',
  php: 'PHP',
  csharp: 'C#',
  dotnet: '.NET',
  net: '.NET',
  ingles: 'Inglês',
  inglesavancado: 'Inglês avançado',
  inglesfluente: 'Inglês fluente',
}

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function baseKey(nome: string): string {
  return stripAccents(nome.toLowerCase())
    .replace(/\(.*?\)/g, '') // "Next.js (diferencial)" → "next.js"
    .replace(/c#/g, 'csharp')
    .replace(/[^a-z0-9+]/g, '')
}

/** Chave para comparar: sem acento, sem maiúsculas, sem espaços e pontuação; apelidos unificados. */
export function skillKey(nome: string): string {
  const base = baseKey(nome)
  return ALIASES[base] ? baseKey(ALIASES[base]) : base
}

/** Nome bonito para exibir. */
export function canonicalName(nome: string): string {
  return ALIASES[baseKey(nome)] ?? nome.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
}

/** Análises antigas não têm "lacunas": monta a partir dos textos de "falta" e "eliminatórios". */
export function lacunasOf(a: Analysis): Lacuna[] {
  if (a.lacunas?.length) return a.lacunas
  const fromText = (items: string[], obrigatorio: boolean) =>
    items.map((t) => ({ nome: t.replace(/\(.*?\)/g, '').trim(), tipo: 'outro' as TipoLacuna, obrigatorio })).filter((l) => l.nome)
  return [...fromText(a.eliminatorios ?? [], true), ...fromText(a.falta ?? [], false)]
}

export function aggregate(entries: { jobUrl: string; state: JobState }[]): Stats {
  const analyzed = entries.filter((e) => e.state.analysis)
  const verdicts: Record<Veredito, number> = { ALTA: 0, MÉDIA: 0, BAIXA: 0 }
  const byKey = new Map<string, GapStat>()
  let scoreSum = 0

  for (const { jobUrl, state } of analyzed) {
    const a = state.analysis as Analysis
    verdicts[a.veredito] += 1
    scoreSum += a.nota
    const job: GapJob = {
      company: state.saved?.company ?? a.empresa,
      position: state.saved?.position ?? a.cargo,
      url: jobUrl,
      nota: a.nota,
    }

    const seenInThisJob = new Set<string>()
    for (const lacuna of lacunasOf(a)) {
      const key = skillKey(lacuna.nome)
      if (!key || seenInThisJob.has(key)) continue
      seenInThisJob.add(key)

      const stat = byKey.get(key) ?? {
        key,
        nome: canonicalName(lacuna.nome),
        tipo: lacuna.tipo,
        count: 0,
        required: 0,
        pct: 0,
        jobs: [],
      }
      stat.count += 1
      if (lacuna.obrigatorio) stat.required += 1
      if (stat.tipo === 'outro' && lacuna.tipo !== 'outro') stat.tipo = lacuna.tipo
      stat.jobs.push(job)
      byKey.set(key, stat)
    }
  }

  const total = analyzed.length
  const gaps = [...byKey.values()]
    .map((g) => ({ ...g, pct: total ? Math.round((g.count / total) * 100) : 0 }))
    // Mais vagas primeiro; no empate, quem é obrigatório mais vezes
    .sort((x, y) => y.count - x.count || y.required - x.required || x.nome.localeCompare(y.nome))

  return { total, avgScore: total ? Math.round(scoreSum / total) : 0, verdicts, gaps }
}

/** Linhas acrescentadas ao perfil, para a IA considerar o que você já estudou. */
export function studyProfileLines(study: StudyMap): string {
  const names = (status: StudyStatus) =>
    Object.values(study)
      .filter((e) => e.status === status)
      .map((e) => e.nome)
  const learned = names('learned')
  const studying = names('studying')
  const lines: string[] = []
  if (learned.length) lines.push(`Estudou recentemente (ainda sem projeto publicado): ${learned.join(', ')}.`)
  if (studying.length) lines.push(`Estudando agora: ${studying.join(', ')}.`)
  return lines.join('\n')
}

const TIPO_LABEL: Record<TipoLacuna, string> = {
  tecnologia: 'Tecnologia',
  idioma: 'Idioma',
  formacao: 'Formação',
  experiencia: 'Experiência',
  outro: 'Outro',
}

export const tipoLabel = (t: TipoLacuna) => TIPO_LABEL[t]

const STATUS_LABEL: Record<StudyStatus, string> = { todo: 'Não comecei', studying: 'Estudando', learned: 'Aprendi' }

/** CSV com ponto e vírgula (abre direto no Excel e no Google Planilhas em português). */
export function toCsv(stats: Stats, study: StudyMap): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const header = ['Requisito', 'Tipo', 'Vagas', '% das vagas', 'Obrigatório em', 'Status', 'Empresas']
  const rows = stats.gaps.map((g) => [
    g.nome,
    tipoLabel(g.tipo),
    g.count,
    `${g.pct}%`,
    g.required,
    STATUS_LABEL[study[g.key]?.status ?? 'todo'],
    g.jobs.map((j) => j.company).join(', '),
  ])
  return [header, ...rows].map((r) => r.map(esc).join(';')).join('\n')
}
