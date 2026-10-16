import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { setCredentials } from '../store/slices/authSlice'
import { useLoginMutation } from '../services'
import { API_URL } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [isSlow, setIsSlow] = useState(false)

  const isBusy = isLoading || isDemoLoading

  // A API gratuita "dorme" quando fica parada; o primeiro acesso pode demorar
  useEffect(() => {
    if (!isBusy) {
      setIsSlow(false)
      return
    }
    const timer = setTimeout(() => setIsSlow(true), 4000)
    return () => clearTimeout(timer)
  }, [isBusy])

  const signIn = async (credentials: { email: string; password: string }) => {
    const result = await login(credentials).unwrap()

    // Salva no Redux (e localStorage via slice)
    dispatch(setCredentials({ user: result.user, token: result.token }))

    // Redireciona pro dashboard
    navigate('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validação básica
    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }

    try {
      await signIn({ email, password })
    } catch (err: any) {
      setError(err?.data?.message || 'Erro ao fazer login')
    }
  }

  // Entra com a conta de demonstração (dados de exemplo, recriados a cada reinício do servidor)
  const handleDemoLogin = async () => {
    setError('')
    setIsDemoLoading(true)
    try {
      const response = await fetch(`${API_URL}/demo`)
      if (!response.ok) throw new Error('Conta demo indisponível')
      const demo: { email: string; password: string } = await response.json()
      await signIn(demo)
    } catch {
      setError('Não foi possível entrar com a conta demo. Tente novamente em instantes.')
    } finally {
      setIsDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎯 Job Tracker Pro</h1>
          <p className="text-slate-400">Faça login para continuar</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">ou</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isBusy}
            className="w-full border border-slate-600 hover:border-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isDemoLoading ? 'Entrando na demo...' : '👀 Entrar com conta demo'}
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            Explore o app com dados de exemplo, sem precisar se cadastrar.
          </p>

          {isSlow && (
            <p className="text-center text-xs text-amber-400 mt-3">
              ⏳ O servidor gratuito está acordando. O primeiro acesso pode levar até 1 minuto.
            </p>
          )}

          <p className="text-center text-slate-400 mt-4 text-sm">
            Não tem conta?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
