// Gera o perfil a partir do currículo: lê o texto do PDF e pede para a IA resumir no formato do perfil.
import { callGroq, type ChatMessage } from './analyze.ts'

export const CV_MAX_CHARS = 20000
export const RESUME_VERSIONS_LINE = 'Currículos disponíveis: Geral, Front-end, Back-end'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const PROFILE_SYSTEM = `Você transforma um currículo em um perfil objetivo, usado para comparar a pessoa com vagas de tecnologia.
Regras:
- Use SOMENTE o que está no currículo. Não invente tecnologias, níveis, datas nem experiências.
- Separe a experiência em desenvolvimento/tecnologia da experiência em outras áreas. Calcule o tempo de cada uma com base na data de hoje.
- "Stack com projetos ou trabalho": só tecnologias usadas em projetos ou empregos descritos no currículo.
- "Noções": tecnologias citadas apenas em cursos ou listas de competências, sem projeto ou emprego.
- Idioma sem nível informado: escreva "nível não informado".
- Se uma informação não existir no currículo, escreva "não informado".
Responda APENAS com o texto do perfil, sem comentários, exatamente nestas linhas:
Nome e localização: ...
Nível: ...
Experiência profissional: ...
Formação: ...
Idiomas: ...
Stack com projetos ou trabalho: ...
Noções: ...
Projetos: ...
Localização e modelo: ...
Diferenciais: ...`

export function buildProfileMessages(cvText: string, today = new Date()): ChatMessage[] {
  const hoje = `${MESES[today.getMonth()]}/${today.getFullYear()}`
  return [
    { role: 'system', content: PROFILE_SYSTEM },
    { role: 'user', content: `Data de hoje: ${hoje}.\n\nCURRÍCULO:\n${cvText.slice(0, CV_MAX_CHARS)}` },
  ]
}

/** Limpa a resposta da IA e garante a linha das versões de currículo usada na análise das vagas. */
export function parseProfile(raw: string): string {
  const text = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```[a-z]*\n?/gi, '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s+/, '').replace(/\*\*/g, '').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!/^nível\s*:/im.test(text)) throw new Error('A IA não conseguiu montar o perfil. Tente de novo.')
  const withoutVersions = text.replace(/^currículos disponíveis\s*:.*$/gim, '').trim()
  return `${withoutVersions}\n${RESUME_VERSIONS_LINE}`
}

/** Lê o texto de um PDF no navegador. O pdf.js só é carregado quando a pessoa envia o arquivo. */
export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data }).promise
  const pages: string[] = []
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const content = await (await pdf.getPage(i)).getTextContent()
    let line = ''
    const lines: string[] = []
    for (const item of content.items) {
      if (!('str' in item)) continue
      line += item.str
      if (item.hasEOL) {
        lines.push(line)
        line = ''
      }
    }
    if (line) lines.push(line)
    pages.push(lines.join('\n'))
  }
  return pages.join('\n\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export async function generateProfile(opts: { key: string; model: string; cvText: string }): Promise<string> {
  if (!opts.key) throw new Error('Salve sua chave da Groq (passo 1) antes de enviar o currículo.')
  if (opts.cvText.trim().length < 200) {
    throw new Error('Não consegui ler o texto desse PDF. Se ele for uma imagem escaneada, exporte de novo como PDF de texto (ex.: "Salvar como PDF" no Word ou Google Docs).')
  }
  const res = await callGroq(opts.key, opts.model, buildProfileMessages(opts.cvText), false)
  if (res.status === 401) throw new Error('Chave da Groq inválida. Gere uma nova em console.groq.com e salve no passo 1.')
  if (res.status === 429) throw new Error('Limite da Groq atingido. Espere um minuto e tente de novo.')
  if (!res.ok) throw new Error(`Erro da Groq (${res.status}). Tente de novo.`)
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return parseProfile(body.choices?.[0]?.message?.content ?? '')
}
