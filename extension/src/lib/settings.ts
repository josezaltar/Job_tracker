// Configurações da extensão, salvas no chrome.storage.local (ficam só neste navegador).
// O perfil vem como um modelo para preencher: cada pessoa cola o seu nas opções.

export const DEFAULT_PROFILE = `Nível: (ex.: Desenvolvedor Full Stack Júnior, experiência em desenvolvimento desde 2025 com projetos próprios)
Formação: (ex.: Bacharelado em ..., curso de ...)
Idiomas: (ex.: Inglês intermediário — lê documentação, não é fluente)
Stack com projetos: (ex.: React, TypeScript, Node.js, PostgreSQL)
Noções (só em curso): (ex.: Docker, testes)
Não conhece: (ex.: PHP, Java, Angular)
Projetos: (ex.: Nome do projeto — tecnologias — link)
Localização e modelo: (ex.: Belo Horizonte, MG — aceita remoto ou híbrido)
Currículos disponíveis: Geral, Front-end, Back-end`

/** true enquanto o perfil ainda for o modelo de exemplo (o usuário não preencheu). */
export const isProfileTemplate = (profile: string) => profile.trim() === DEFAULT_PROFILE.trim() || profile.includes('(ex.:')

export const DEFAULT_MODEL = 'openai/gpt-oss-120b'
export const DEFAULT_API_URL = 'https://job-tracker-api-q7tc.onrender.com/api'
export const DEFAULT_APP_URL = 'https://job-tracker-seven-ecru-36.vercel.app'

export interface Settings {
  groqKey: string
  model: string
  profile: string
  apiUrl: string
  appUrl: string
  token: string
  userName: string
  userEmail: string
}

const DEFAULTS: Settings = {
  groqKey: '',
  model: DEFAULT_MODEL,
  profile: DEFAULT_PROFILE,
  apiUrl: DEFAULT_API_URL,
  appUrl: DEFAULT_APP_URL,
  token: '',
  userName: '',
  userEmail: '',
}

export async function loadSettings(): Promise<Settings> {
  const stored = (await chrome.storage.local.get('settings')) as { settings?: Partial<Settings> }
  return { ...DEFAULTS, ...(stored.settings ?? {}) }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch }
  await chrome.storage.local.set({ settings: next })
  return next
}
