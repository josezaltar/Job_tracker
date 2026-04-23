import type { Job, JobStatus } from '../types'

interface JobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: JobStatus) => void
}

const statusConfig: Record<JobStatus, { label: string; color: string; bg: string }> = {
  wishlist: { label: 'Quero aplicar', color: 'text-slate-300', bg: 'bg-slate-600' },
  applied: { label: 'Aplicado', color: 'text-blue-300', bg: 'bg-blue-600' },
  interview: { label: 'Entrevista', color: 'text-yellow-300', bg: 'bg-yellow-600' },
  offer: { label: 'Proposta', color: 'text-green-300', bg: 'bg-green-600' },
  rejected: { label: 'Rejeitado', color: 'text-red-300', bg: 'bg-red-600' },
  accepted: { label: 'Aceito', color: 'text-emerald-300', bg: 'bg-emerald-600' },
}

const statusFlow: JobStatus[] = ['wishlist', 'applied', 'interview', 'offer', 'accepted']

export default function JobCard({ job, onEdit, onDelete, onStatusChange }: JobCardProps) {
  const status = statusConfig[job.status]
  
  const getNextStatus = (): JobStatus | null => {
    const currentIndex = statusFlow.indexOf(job.status)
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null
    return statusFlow[currentIndex + 1]
  }

  const nextStatus = getNextStatus()

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{job.position}</h3>
          <p className="text-slate-400">{job.company}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-sm text-slate-400 mb-4">
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-2">
            <span>💰</span>
            <span>{job.salary}</span>
          </div>
        )}
        {job.appliedAt && (
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>Aplicado em {new Date(job.appliedAt).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>

      {job.notes && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2 italic">
          "{job.notes}"
        </p>
      )}

      <div className="flex gap-2 pt-3 border-t border-slate-700">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            🔗 Link
          </a>
        )}
        
        {nextStatus && job.status !== 'rejected' && (
          <button
            onClick={() => onStatusChange(job.id, nextStatus)}
            className="px-3 py-1.5 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
          >
            → {statusConfig[nextStatus].label}
          </button>
        )}

        {job.status !== 'rejected' && job.status !== 'accepted' && (
          <button
            onClick={() => onStatusChange(job.id, 'rejected')}
            className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
          >
            ❌
          </button>
        )}
        
        <div className="flex-1" />
        
        <button
          onClick={() => onEdit(job)}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(job.id)}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-red-600/30 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
