import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

// Base URL da API (vai apontar pro backend depois)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      // Pega o token do estado do Redux
      const token = (getState() as RootState).auth.token
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      
      return headers
    },
  }),
  tagTypes: ['Job', 'Interaction', 'Reminder', 'User'],
  endpoints: () => ({}), // Endpoints serão injetados nos slices
})
