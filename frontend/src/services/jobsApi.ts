import { api } from './api'
import type { Job } from '../types'

interface CreateJobRequest {
  company: string
  position: string
  location: string
  salary?: string
  url?: string
  description?: string
  notes?: string
  status?: Job['status']
}

interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string
}

export const jobsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Lista todas as vagas
    getJobs: builder.query<Job[], void>({
      query: () => '/jobs',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Job' as const, id })),
              { type: 'Job', id: 'LIST' },
            ]
          : [{ type: 'Job', id: 'LIST' }],
    }),
    
    // Busca uma vaga pelo ID
    getJob: builder.query<Job, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Job', id }],
    }),
    
    // Cria uma nova vaga
    createJob: builder.mutation<Job, CreateJobRequest>({
      query: (data) => ({
        url: '/jobs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),
    
    // Atualiza uma vaga
    updateJob: builder.mutation<Job, UpdateJobRequest>({
      query: ({ id, ...data }) => ({
        url: `/jobs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
      ],
    }),
    
    // Deleta uma vaga
    deleteJob: builder.mutation<void, string>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} = jobsApi
