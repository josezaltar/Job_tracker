import { useAppSelector } from '../hooks'
import { useGetJobsQuery } from '../services'
import { Link } from 'react-router-dom'
import type { JobStatus } from '../types'

const statusConfig: Record<JobStatus, { label: string; color: string; bg: string }> = {
  wishlist: { label: 'Quero aplicar', color: 'text-slate-300', bg: 'bg-slate-600' },
  applied: { label: 'Aplicado', color: 'text-blue-300', bg: 'bg-blue-500' },
  interview: { label: 'Entrevista', color: 'text-yellow-300', bg: 'bg-yellow-500' },
  offer: { label: 'Proposta', color: 'text-green-300', bg: 'bg-green-500' },
  rejected: { label: 'Rejeitado', color: 'text-red-300', bg: 'bg-red-500' },
  accepted: { label: 'Aceito', color: 'text-emerald-300', bg: 'bg-emerald-500' },
}

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth)
  const { data: jobs = [], isLoading } = useGetJobsQuery()

  // Calcular métricas
  const totalJobs = jobs.length
  const appliedJobs = jobs.filter(j => j.status !== 'wishlist').length
  const interviewJobs = jobs.filter(j => j.status === 'interview').length
  const offerJobs = jobs.filter(j => j.status === 'offer').length
  const acceptedJobs = jobs.filter(j => j.status === 'accepted').length
  const rejectedJobs = jobs.filter(j => j.status === 'rejected').length
  
  // Taxa de retorno = (entrevistas + propostas + aceitos) / aplicados
  const responseRate = appliedJobs > 0 
    ? Math.round(((interviewJobs + offerJobs + acceptedJobs) / appliedJobs) * 100)
    : 0

  // Contagem por status
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {} as Record<JobStatus, number>)

  // Vagas recentes (últimas 5)
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">
          Bem-vindo de volta, {user?.name}! 🎯
        </p>
      </div>
      
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Total de Vagas</p>
          <p className="text-3xl font-bold text-white">{totalJobs}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Aplicadas</p>
          <p className="text-3xl font-bold text-blue-400">{appliedJobs}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Entrevistas</p>
          <p className="text-3xl font-bold text-yellow-400">{interviewJobs}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Taxa de Retorno</p>
          <p className="text-3xl font-bold text-green-400">{responseRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline visual */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline de Vagas</h2>
          <div className="space-y-3">
            {(Object.keys(statusConfig) as JobStatus[]).map((status) => {
              const count = statusCounts[status] || 0
              const percentage = totalJobs > 0 ? (count / totalJobs) * 100 : 0
              const config = statusConfig[status]
              
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{config.label}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${config.bg} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Atividade Recente</h2>
            <Link to="/jobs" className="text-blue-400 text-sm hover:text-blue-300">
              Ver todas →
            </Link>
          </div>
          
          {recentJobs.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Nenhuma vaga cadastrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{job.position}</p>
                    <p className="text-slate-400 text-sm">{job.company}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${statusConfig[job.status].bg} ${statusConfig[job.status].color}`}>
                    {statusConfig[job.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumo rápido */}
      {totalJobs > 0 && (
        <div className="mt-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">📊 Resumo</h2>
          <p className="text-slate-300">
            Você tem <strong className="text-white">{totalJobs} vagas</strong> no seu pipeline.
            {interviewJobs > 0 && (
              <> Parabéns! Você tem <strong className="text-yellow-400">{interviewJobs} entrevista{interviewJobs > 1 ? 's' : ''}</strong> agendada{interviewJobs > 1 ? 's' : ''}.</>
            )}
            {offerJobs > 0 && (
              <> Incrível! <strong className="text-green-400">{offerJobs} proposta{offerJobs > 1 ? 's' : ''}</strong> na mesa!</>
            )}
            {rejectedJobs > 0 && appliedJobs > 0 && (
              <> Sua taxa de rejeição é de {Math.round((rejectedJobs / appliedJobs) * 100)}% — continue firme!</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
