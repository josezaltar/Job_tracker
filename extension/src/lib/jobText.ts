// Regras puras (sem APIs do navegador) para escolher o texto da vaga e identificar o link dela.
// Ficam separadas para poderem ser testadas com `npm test`.

export const MAX_CHARS = 15000

// Onde a descrição costuma ficar em cada site, do mais específico para o mais genérico.
// Se nenhum bater, a extensão usa o conteúdo principal da página.
export const JOB_SELECTORS = [
  '.jobs-search__job-details--container', // LinkedIn, painel da vaga na busca (inclui cargo e empresa)
  '.jobs-details', // LinkedIn, página da vaga
  '.jobs-description__content', // LinkedIn, só a descrição
  '#job-details', // LinkedIn
  '#jobDescriptionText', // Indeed
  '[class*="JobDetails_jobDescription"]', // Glassdoor
  '[data-testid="job-description"]',
  '[class*="job-description" i]',
  '[class*="jobDescription" i]',
  '[id*="job-description" i]',
]

export interface Candidate {
  selector: string
  text: string
}

export type TextSource = 'selecao' | 'descricao' | 'pagina'

export interface PickedText {
  text: string
  source: TextSource
}

const MIN_SELECTION = 80
const MIN_DESCRIPTION = 200

export function cleanText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_CHARS)
}

/**
 * Escolhe o melhor texto da vaga:
 * 1. o trecho selecionado pelo usuário, se for grande o bastante;
 * 2. o primeiro bloco de descrição encontrado (na ordem de JOB_SELECTORS);
 * 3. o texto principal da página.
 */
export function pickJobText(selection: string, candidates: Candidate[], pageText: string): PickedText {
  const selected = cleanText(selection)
  if (selected.length >= MIN_SELECTION) return { text: selected, source: 'selecao' }

  for (const selector of JOB_SELECTORS) {
    const found = candidates.find((c) => c.selector === selector)
    const text = found ? cleanText(found.text) : ''
    if (text.length >= MIN_DESCRIPTION) return { text, source: 'descricao' }
  }

  return { text: cleanText(pageText), source: 'pagina' }
}

const TRACKING_PARAMS = new Set([
  'trk',
  'trackingid',
  'refid',
  'ref',
  'ebp',
  'lipi',
  'fbclid',
  'gclid',
  'origin',
  'source',
  'src',
])

/**
 * Deixa o link da vaga sempre igual, para a mesma vaga não ser salva duas vezes.
 * Ex.: no LinkedIn, ".../jobs/search/?currentJobId=123&keywords=react" vira ".../jobs/view/123/".
 */
export function normalizeJobUrl(raw: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return raw.trim()
  }

  const host = url.hostname.replace(/^www\./, '')

  if (host.endsWith('linkedin.com')) {
    const id = url.pathname.match(/\/jobs\/view\/(?:[^/]*?-)?(\d+)/)?.[1] ?? url.searchParams.get('currentJobId')
    if (id && /^\d+$/.test(id)) return `https://www.linkedin.com/jobs/view/${id}/`
  }

  if (host.includes('indeed.')) {
    const jk = url.searchParams.get('jk') ?? url.searchParams.get('vjk')
    if (jk) return `https://${url.hostname}/viewjob?jk=${jk}`
  }

  if (host.includes('glassdoor.')) {
    const jl = url.searchParams.get('jl') ?? url.searchParams.get('jobListingId')
    if (jl) return `https://${url.hostname}${url.pathname}?jl=${jl}`
  }

  if (host.endsWith('gupy.io')) {
    return `https://${url.hostname}${url.pathname.replace(/\/+$/, '')}`
  }

  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    const k = key.toLowerCase()
    if (k.startsWith('utm_') || TRACKING_PARAMS.has(k)) url.searchParams.delete(key)
  }
  return url.toString()
}
