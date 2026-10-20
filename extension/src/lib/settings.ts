// Configurações da extensão, salvas no chrome.storage.local (ficam só neste navegador).

export const DEFAULT_PROFILE = `Nome: José Maria Zaltar — Divinópolis, MG. Aceita remoto, híbrido ou mudança.
Nível: Desenvolvedor Full Stack JÚNIOR em transição de carreira. Experiência em desenvolvimento desde out/2025 (projetos próprios e desafios técnicos). Os 10+ anos anteriores são em gestão administrativa, não em desenvolvimento.
Formação: Bacharelado em Engenharia de Produção (UEMG, 2021) — NÃO é graduação em Computação. Curso Desenvolvedor Full Stack Python (EBAC, 2023–2025). Pós-graduações em Logística e em Manutenção (FAVENI, 2024).
Idiomas: Inglês intermediário (lê documentação, conversa básica; não é fluente). Espanhol intermediário.
Stack com projetos: React, TypeScript, JavaScript, HTML, CSS, Redux Toolkit, RTK Query, React Router, Tailwind CSS, Node.js, Express, Python, Django, Django REST Framework, APIs REST, JWT, PostgreSQL, SQLite, SQL, Git, GitHub.
Noções (só em curso): Docker, CI/CD, Linux, testes (React Testing Library, Cypress, Pytest), Vue.js.
Não conhece: PHP, Java, C#/.NET, Angular, React Native, Next.js, Oracle, AWS.
Projetos: Job Tracker Pro (React + Node/Express + PostgreSQL, em produção na Vercel/Render/Neon), Twiclone (React + Django REST Framework), API de Pedidos (desafio técnico Jitterbit: Node, Express, PostgreSQL, JWT, Swagger).
Diferencial: gestão de processos, equipe e finanças por 10+ anos (Engenharia de Produção).
Currículos disponíveis: Geral (full stack), Front-end, Back-end.`

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
