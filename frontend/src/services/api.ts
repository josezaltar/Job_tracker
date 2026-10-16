import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'
import { logout } from '../store/slices/authSlice'

// Base URL da API: em produção vem da variável VITE_API_URL (configurada na Vercel)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    // Pega o token do estado do Redux
    const token = (getState() as RootState).auth.token

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return headers
  },
})

// Se a API responder 401 (token expirado ou inválido), faz logout automático
const baseQueryWithLogout: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  const isAuthRoute = typeof args !== 'string' && args.url.startsWith('/auth/')
  if (result.error?.status === 401 && !isAuthRoute) {
    api.dispatch(logout())
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogout,
  tagTypes: ['Job', 'Interaction', 'Reminder', 'User'],
  endpoints: () => ({}), // Endpoints serão injetados nos slices
})
