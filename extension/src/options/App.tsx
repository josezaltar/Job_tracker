import { useEffect, useState } from 'react'
import { friendlyNetworkError, login } from '../lib/jobTracker.ts'
import { extractPdfText, generateProfile, MAX_CVS, type CvFile } from '../lib/cv.ts'
import { DEFAULT_API_URL, DEFAULT_MODEL, DEFAULT_PROFILE, isProfileTemplate, loadSettings, saveSettings, type Settings } from '../lib/settings.ts'

type Msg = { kind: 'ok' | 'err'; text: string } | null

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null
  return <p className={`text-[13px] ${msg.kind === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</p>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function App() {
  const [s, setS] = useState<Settings | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState('')
  const [groqMsg, setGroqMsg] = useState<Msg>(null)
  const [profileMsg, setProfileMsg] = useState<Msg>(null)
  const [cvStep, setCvStep] = useState('')
  const [jtMsg, setJtMsg] = useState<Msg>(null)

  useEffect(() => {
    loadSettings().then((loaded) => {
      setS(loaded)
      setEmail(loaded.userEmail)
    })
  }, [])

  if (!s) return null
  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch })

  async function saveGroq() {
    if (!s) return
    setBusy('groq')
    setGroqMsg(null)
    const key = s.groqKey.trim()
    const model = s.model.trim() || DEFAULT_MODEL
    await saveSettings({ groqKey: key, model })
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` } })
      if (res.status === 401) throw new Error('Chave inválida.')
      if (!res.ok) throw new Error(`Erro ${res.status} ao testar.`)
      const { data } = (await res.json()) as { data: { id: string }[] }
      const ok = data.some((m) => m.id === model)
      setGroqMsg(
        ok
          ? { kind: 'ok', text: '✓ Chave salva e funcionando.' }
          : { kind: 'err', text: `Chave ok, mas o modelo "${model}" não existe na sua conta. Disponíveis: ${data.map((m) => m.id).join(', ')}` },
      )
    } catch (e) {
      setGroqMsg({ kind: 'err', text: `Salvo, mas o teste falhou: ${(e as Error).message}` })
    } finally {
      setBusy('')
    }
  }

  async function importCvs(files: File[]) {
    if (!s) return
    if (files.length > MAX_CVS) {
      setProfileMsg({ kind: 'err', text: `Envie no máximo ${MAX_CVS} currículos de uma vez.` })
      return
    }
    setBusy('cv')
    setProfileMsg(null)
    try {
      const saved = await loadSettings() // usa a chave já salva no passo 1
      const cvs: CvFile[] = []
      for (const [i, file] of files.entries()) {
        setCvStep(files.length > 1 ? `Lendo currículo ${i + 1} de ${files.length}…` : 'Lendo o currículo…')
        cvs.push({ name: file.name, text: await extractPdfText(await file.arrayBuffer()) })
      }
      setCvStep(files.length > 1 ? `Juntando os ${files.length} currículos com IA…` : 'Montando o perfil com IA…')
      const profile = await generateProfile({ key: saved.groqKey, model: saved.model, cvs })
      setS(await saveSettings({ profile }))
      const names = files.map((f) => `"${f.name}"`).join(', ')
      setProfileMsg({
        kind: 'ok',
        text: files.length > 1 ? `✓ Perfil montado juntando ${files.length} currículos (${names}) e salvo. Confira abaixo.` : `✓ Perfil montado a partir de ${names} e salvo. Confira abaixo.`,
      })
    } catch (e) {
      const msg = (e as Error).message
      setProfileMsg({ kind: 'err', text: /invalid pdf|password/i.test(msg) ? 'Não consegui abrir esse PDF. Confira se o arquivo não está protegido por senha.' : friendlyNetworkError(e) })
    } finally {
      setBusy('')
      setCvStep('')
    }
  }

  async function saveProfile(profile: string) {
    if (!s) return
    setS(await saveSettings({ profile }))
    setProfileMsg({ kind: 'ok', text: isProfileTemplate(profile) ? 'Perfil apagado. Envie um currículo para montar outro.' : '✓ Perfil salvo.' })
  }

  async function connect() {
    if (!s) return
    setBusy('jt')
    setJtMsg(null)
    const apiUrl = s.apiUrl.trim() || DEFAULT_API_URL
    try {
      const user = await login(apiUrl, email.trim(), password)
      setS(await saveSettings({ apiUrl, appUrl: s.appUrl.trim(), token: user.token, userName: user.name, userEmail: user.email }))
      setPassword('')
      setJtMsg({
        kind: 'ok',
        text: user.longLived
          ? '✓ Conectado por 90 dias. A senha não fica salva, só o token de acesso.'
          : '✓ Conectado. A senha não fica salva, só o token de acesso (vale 7 dias).',
      })
    } catch (e) {
      setJtMsg({ kind: 'err', text: friendlyNetworkError(e) })
    } finally {
      setBusy('')
    }
  }

  async function disconnect() {
    setS(await saveSettings({ token: '', userName: '' }))
    setJtMsg({ kind: 'ok', text: 'Desconectado.' })
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-sm">
      <header className="flex items-center gap-3">
        <img src="icons/icon48.png" alt="" className="h-9 w-9" />
        <div>
          <h1 className="text-xl font-bold">Analisador de Vagas — Opções</h1>
          <p className="text-slate-400">As configurações ficam salvas só neste navegador.</p>
        </div>
      </header>

      <Card title="1. Inteligência artificial (Groq)">
        <label className="block text-slate-300">
          Chave da API
          <input type="password" className="field mt-1" value={s.groqKey} placeholder="gsk_..." onChange={(e) => set({ groqKey: e.target.value })} />
        </label>
        <p className="text-[12.5px] text-slate-400">
          Crie grátis em{' '}
          <a className="text-sky-300 underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          . Use uma chave só para a extensão.
        </p>
        <label className="block text-slate-300">
          Modelo
          <input className="field mt-1" value={s.model} onChange={(e) => set({ model: e.target.value })} />
        </label>
        <div className="flex items-center gap-3">
          <button onClick={saveGroq} disabled={busy === 'groq'} className="btn btn-primary">
            {busy === 'groq' ? 'Testando…' : 'Salvar e testar'}
          </button>
          <Note msg={groqMsg} />
        </div>
      </Card>

      <Card title="2. Seu perfil">
        <p className="text-[12.5px] text-slate-400">
          Envie seus currículos em PDF. A IA lê e monta o perfil que será comparado com cada vaga, e indica qual versão enviar em cada uma.
        </p>
        <label
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-5 text-center ${
            busy === 'cv' ? 'cursor-wait border-sky-500/60 bg-sky-500/5' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-800'
          }`}
        >
          <span className="text-[14px] font-semibold text-slate-100">
            {busy === 'cv' ? cvStep : isProfileTemplate(s.profile) ? '📄 Enviar currículos (PDF)' : '📄 Enviar currículos de novo (PDF)'}
          </span>
          <span className="text-[12px] text-slate-400">
            Pode escolher mais de um (ex.: Geral, Front-end e Back-end): a IA junta tudo num perfil só. Os PDFs não ficam salvos.
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            disabled={busy === 'cv'}
            onChange={(e) => {
              const files = [...(e.target.files ?? [])]
              e.target.value = ''
              if (files.length) importCvs(files)
            }}
          />
        </label>
        <Note msg={profileMsg} />
        {!isProfileTemplate(s.profile) && (
          <>
            <p className="text-[12.5px] text-slate-400">Perfil usado nas análises. Ajuste se a IA errou algo e clique em Salvar.</p>
            <textarea className="field h-64 font-mono text-[12px] leading-relaxed" value={s.profile} onChange={(e) => set({ profile: e.target.value })} />
            <div className="flex items-center gap-3">
              <button onClick={() => saveProfile(s.profile)} className="btn btn-primary">
                Salvar perfil
              </button>
              <button onClick={() => saveProfile(DEFAULT_PROFILE)} className="btn btn-ghost">
                Apagar perfil
              </button>
            </div>
          </>
        )}
      </Card>

      <Card title="3. Conta do Job Tracker">
        {s.token ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-300">
              Conectado como <b className="text-white">{s.userName || s.userEmail}</b>
            </p>
            <button onClick={disconnect} className="btn btn-ghost">
              Desconectar
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-slate-300">
                E-mail
                <input className="field mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block text-slate-300">
                Senha
                <input
                  type="password"
                  className="field mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && connect()}
                />
              </label>
            </div>
            <button onClick={connect} disabled={busy === 'jt' || !email || !password} className="btn btn-primary">
              {busy === 'jt' ? 'Conectando… (até 1 min se o servidor estiver dormindo)' : 'Conectar'}
            </button>
          </>
        )}
        <Note msg={jtMsg} />
        <details className="text-[12.5px] text-slate-400">
          <summary className="cursor-pointer">Endereços (avançado)</summary>
          <div className="mt-2 space-y-2">
            <label className="block">
              URL da API
              <input className="field mt-1" value={s.apiUrl} onChange={(e) => set({ apiUrl: e.target.value })} />
            </label>
            <label className="block">
              URL do site
              <input className="field mt-1" value={s.appUrl} onChange={(e) => set({ appUrl: e.target.value })} />
            </label>
          </div>
        </details>
      </Card>
    </main>
  )
}
