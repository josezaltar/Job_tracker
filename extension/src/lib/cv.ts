// Gera o perfil a partir de um ou mais currículos: lê o texto dos PDFs e pede para a IA juntar tudo no formato do perfil.
import { callGroq, type ChatMessage } from './analyze.ts'

export const CV_MAX_CHARS = 12000 // por currículo
export const MAX_CVS = 5

/** Um currículo enviado: nome do arquivo e o texto lido do PDF. */
export interface CvFile {
  name: string
  text: string
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const PROFILE_SYSTEM = `Você transforma um ou mais currículos da MESMA pessoa em um único perfil objetivo, usado para comparar a pessoa com vagas de tecnologia.
Regras:
- Use SOMENTE o que está nos currículos. Não invente tecnologias, níveis, datas nem experiências.
- Com vários currículos, junte tudo sem repetir: some as tecnologias, projetos e experiências de todos. Se houver conflito de datas, use a informação mais detalhada.
- "Currículos disponíveis": dê a cada currículo enviado um nome curto pelo foco dele (ex.: Geral, Front-end, Back-end, Dados), na ordem em que foram enviados. Com um só currículo, escreva "Geral".
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
Diferenciais: ...
Currículos disponíveis: ...`

export function buildProfileMessages(cvs: CvFile[], today = new Date()): ChatMessage[] {
  const hoje = `${MESES[today.getMonth()]}/${today.getFullYear()}`
  const blocks = cvs
    .slice(0, MAX_CVS)
    .map((cv, i) => `CURRÍCULO ${i + 1} (arquivo: ${cv.name}):\n${cv.text.slice(0, CV_MAX_CHARS)}`)
    .join('\n\n----------\n\n')
  return [
    { role: 'system', content: PROFILE_SYSTEM },
    { role: 'user', content: `Data de hoje: ${hoje}. Total de currículos: ${Math.min(cvs.length, MAX_CVS)}.\n\n${blocks}` },
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
  // A linha das versões fica sempre por último, uma vez só
  const versions = text.match(/^currículos disponíveis\s*:\s*(.+)$/im)?.[1]?.trim() || 'Geral'
  const body = text.replace(/^currículos disponíveis\s*:.*$/gim, '').replace(/\n{3,}/g, '\n\n').trim()
  return `${body}\nCurrículos disponíveis: ${versions}`
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

export async function generateProfile(opts: { key: string; model: string; cvs: CvFile[] }): Promise<string> {
  if (!opts.key) throw new Error('Salve sua chave da Groq (passo 1) antes de enviar o currículo.')
  const unreadable = opts.cvs.filter((cv) => cv.text.trim().length < 200).map((cv) => cv.name)
  if (!opts.cvs.length || unreadable.length) {
    throw new Error(
      `Não consegui ler o texto de: ${unreadable.join(', ') || 'nenhum arquivo'}. Se for uma imagem escaneada, exporte de novo como PDF de texto (ex.: "Salvar como PDF" no Word ou Google Docs).`,
    )
  }
  const res = await callGroq(opts.key, opts.model, buildProfileMessages(opts.cvs), false)
  if (res.status === 401) throw new Error('Chave da Groq inválida. Gere uma nova em console.groq.com e salve no passo 1.')
  if (res.status === 429) throw new Error('Limite da Groq atingido. Espere um minuto e tente de novo.')
  if (!res.ok) throw new Error(`Erro da Groq (${res.status}). Tente de novo.`)
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return parseProfile(body.choices?.[0]?.message?.content ?? '')
}
