import { useState } from 'react'
import { JobModal, JobCard } from '../components'
import { 
  useGetJobsQuery, 
  useCreateJobMutation, 
  useUpdateJobMutation, 
  useDeleteJobMutation 
} from '../services'
import type { Job, JobStatus } from '../types'

const filterOptions: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'wishlist', label: '📋 Quero aplicar' },
  { value: 'applied', label: '📤 Aplicado' },
  { value: 'interview', label: '🎤 Entrevista' },
  { value: 'offer', label: '🎉 Proposta' },
  { value: 'rejected', label: '❌ Rejeitado' },
  { value: 'accepted', label: '✅ Aceito' },
]

export default function Jobs() {
  const { data: jobs = [], isLoading, isError } = useGetJobsQuery()
  const [createJob] = useCreateJobMutation()
  const [updateJob] = useUpdateJobMutation()
  const [deleteJob] = useDeleteJobMutation()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<JobStatus | 'all'>('all')

  // Filtrar vagas
  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === 'all' || job.status === filter
    const matchesSearch = 
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.position.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleSave = async (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingJob) {
        await updateJob({ id: editingJob.id, ...data }).unwrap()
      } else {
        await createJob(data).unwrap()
      }
      setEditingJob(null)
    } catch (error) {
      console.error('Erro ao salvar vaga:', error)
    }
  }

  const handleEdit = (job: Job) => {
    setEditingJob(job)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta vaga?')) {
      try {
        await deleteJob(id).unwrap()
      } catch (error) {
        console.error('Erro ao deletar vaga:', error)
      }
    }
  }

  const handleStatusChange = async (id: string, status: JobStatus) => {
    try {
      await updateJob({ id, status }).unwrap()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const openNewJobModal = () => {
    setEditingJob(null)
    setIsModalOpen(true)
  }

  // Contadores por status
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400">Carregando vagas...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          Erro ao carregar vagas. Verifique se o backend está rodando.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Vagas</h1>
          <p className="text-slate-400 text-sm">{jobs.length} vagas cadastradas</p>
        </div>
        <button 
          onClick={openNewJobModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          + Nova Vaga
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por empresa ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label}
              {option.value !== 'all' && statusCounts[option.value] && (
                <span className="ml-1 text-xs opacity-75">
                  ({statusCounts[option.value]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Vagas */}
      {filteredJobs.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">
            {jobs.length === 0 
              ? 'Nenhuma vaga cadastrada ainda.' 
              : 'Nenhuma vaga encontrada com os filtros atuais.'}
          </p>
          {jobs.length === 0 && (
            <p className="text-slate-500 text-sm mt-2">
              Clique em "Nova Vaga" para começar!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <JobModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingJob(null)
        }}
        onSave={handleSave}
        job={editingJob}
      />
    </div>
  )
}
