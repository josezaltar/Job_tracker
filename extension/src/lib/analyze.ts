// Análise da vaga com a Groq (API compatível com OpenAI).

export type Veredito = 'ALTA' | 'MÉDIA' | 'BAIXA'
export type Curriculo = 'Geral' | 'Front-end' | 'Back-end'

export type TipoLacuna = 'tecnologia' | 'idioma' | 'formacao' | 'experiencia' | 'outro'

/** Um requisito que falta no perfil, com nome curto e padronizado (para virar estatística). */
export interface Lacuna {
  nome: string
  tipo: TipoLacuna
  obrigatorio: boolean
}

export interface Analysis {
  empresa: string
  cargo: string
  local: string
  modalidade: string
  contrato: string
  salario: string
  nivel_vaga: string
  nota: number
  veredito: Veredito
  bate: string[]
  falta: string[]
  eliminatorios: string[]
  lacunas: Lacuna[]
  curriculo: Curriculo
  resumo: string
  dica: string
}

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM = `Você é um recrutador técnico brasileiro, honesto e direto. Avalie se o candidato tem chance REAL de ser chamado para entrevista na vaga.
Regras:
- Compare os requisitos OBRIGATÓRIOS da vaga com o perfil. Diferenciais pesam pouco.
- Experiência em gestão NÃO conta como experiência em desenvolvimento.
- Projetos pessoais publicados contam como experiência prática quando a vaga é júnior ou aceita projetos.
- Diferenciais que faltam tiram no máximo 10 pontos no total.
- São eliminatórios: exigir pleno/sênior ou 3+ anos de dev; inglês fluente/avançado; tecnologia principal que o candidato não conhece; presencial em cidade distante sem ajuda de mudança.
- Formação: QUALQUER graduação (concluída ou em andamento) que o candidato tiver atende requisitos de "ensino superior", "graduação em TI, Computação ou áreas afins/correlatas" e semelhantes. Nunca trate a área da graduação como eliminatório nem como lacuna.
- Nota de 0 a 100. ALTA >= 65, MÉDIA 40-64, BAIXA < 40. Qualquer eliminatório forte limita a nota a 39.
- "curriculo": qual versão enviar (Geral, Front-end ou Back-end) conforme o foco da vaga.
- Se um campo não aparecer no texto, use "Não informado".
- "lacunas": um item para cada coisa de "falta" e "eliminatorios", com o nome curto e padronizado do requisito (ex.: "Next.js", "Jest", "Inglês avançado", "Graduação em TI", "2+ anos de experiência"), o tipo (tecnologia, idioma, formacao, experiencia ou outro) e se é obrigatório na vaga (true) ou diferencial (false).
Responda APENAS com um JSON neste formato:
{"empresa":"","cargo":"","local":"","modalidade":"Remoto|Híbrido|Presencial|Não informado","contrato":"CLT|PJ|Estágio|Não informado","salario":"","nivel_vaga":"Estágio|Júnior|Pleno|Sênior|Não informado","nota":0,"veredito":"ALTA|MÉDIA|BAIXA","bate":["..."],"falta":["..."],"eliminatorios":["..."],"lacunas":[{"nome":"Next.js","tipo":"tecnologia","obrigatorio":false}],"curriculo":"Geral|Front-end|Back-end","resumo":"1-2 frases","dica":"1 frase prática para a candidatura"}`

export function buildMessages(profile: string, text: string, url: string, title: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `PERFIL DO CANDIDATO:\n${profile}\n\nVAGA (título da página: ${title || '—'} | link: ${url || '—'}):\n${text}`,
    },
  ]
}

const str = (v: unknown, fallback = 'Não informado'): string =>
  typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : fallback

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 8) : typeof v === 'string' && v.trim() ? [v.trim()] : []

function vereditoFromNota(nota: number): Veredito {
  return nota >= 65 ? 'ALTA' : nota >= 40 ? 'MÉDIA' : 'BAIXA'
}

const TIPOS: TipoLacuna[] = ['tecnologia', 'idioma', 'formacao', 'experiencia', 'outro']

function parseLacunas(v: unknown): Lacuna[] {
  if (!Array.isArray(v)) return []
  const out: Lacuna[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') continue
    const it = item as Record<string, unknown>
    const nome = typeof it.nome === 'string' ? it.nome.trim() : ''
    if (!nome) continue
    const t = String(it.tipo ?? '').toLowerCase().replace('formação', 'formacao').replace('experiência', 'experiencia')
    out.push({
      nome: nome.slice(0, 60),
      tipo: (TIPOS as string[]).includes(t) ? (t as TipoLacuna) : 'outro',
      obrigatorio: it.obrigatorio === true || it.obrigatorio === 'true',
    })
  }
  return out.slice(0, 12)
}

export function parseAnalysis(raw: string): Analysis {
  const cleaned = raw.replace(/```(?:json)?/gi, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('A IA não devolveu uma análise válida. Tente de novo.')

  let data: Record<string, unknown>
  try {
    data = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    throw new Error('A IA não devolveu uma análise válida. Tente de novo.')
  }

  const notaNum = Math.round(Number(data.nota))
  const nota = Number.isFinite(notaNum) ? Math.min(100, Math.max(0, notaNum)) : 0
  const v = String(data.veredito ?? '').toUpperCase().replace('MEDIA', 'MÉDIA')
  const veredito: Veredito = v === 'ALTA' || v === 'MÉDIA' || v === 'BAIXA' ? v : vereditoFromNota(nota)
  const c = String(data.curriculo ?? '').toLowerCase()
  const curriculo: Curriculo = c.startsWith('front') ? 'Front-end' : c.startsWith('back') ? 'Back-end' : 'Geral'

  return {
    empresa: str(data.empresa),
    cargo: str(data.cargo),
    local: str(data.local),
    modalidade: str(data.modalidade),
    contrato: str(data.contrato),
    salario: str(data.salario),
    nivel_vaga: str(data.nivel_vaga),
    nota,
    veredito,
    bate: list(data.bate),
    falta: list(data.falta),
    eliminatorios: list(data.eliminatorios),
    lacunas: parseLacunas(data.lacunas),
    curriculo,
    resumo: str(data.resumo, ''),
    dica: str(data.dica, ''),
  }
}

export async function callGroq(key: string, model: string, messages: ChatMessage[], jsonMode: boolean) {
  return fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
}

export async function analyzeJob(opts: {
  key: string
  model: string
  profile: string
  text: string
  url: string
  title: string
}): Promise<Analysis> {
  if (!opts.key) throw new Error('Configure sua chave da Groq nas opções da extensão.')
  if (opts.text.trim().length < 80) {
    throw new Error('Não encontrei o texto da vaga. Selecione a descrição com o mouse e tente de novo.')
  }

  const messages = buildMessages(opts.profile, opts.text, opts.url, opts.title)
  let res = await callGroq(opts.key, opts.model, messages, true)
  if (res.status === 400) res = await callGroq(opts.key, opts.model, messages, false)

  if (res.status === 401) throw new Error('Chave da Groq inválida. Gere uma nova em console.groq.com e salve nas opções.')
  if (res.status === 404) throw new Error(`O modelo "${opts.model}" não está disponível na sua conta Groq. Troque nas opções.`)
  if (res.status === 429) throw new Error('Limite da Groq atingido. Espere um minuto e tente de novo.')
  if (!res.ok) throw new Error(`Erro da Groq (${res.status}). Tente de novo.`)

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return parseAnalysis(body.choices?.[0]?.message?.content ?? '')
}
