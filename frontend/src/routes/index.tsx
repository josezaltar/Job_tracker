import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Login, Register, Dashboard, Jobs } from '../pages'
import { MainLayout } from '../layouts'
import { ProtectedRoute } from '../components'

export const router = createBrowserRouter([
  // Rotas públicas (sem autenticação)
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },

  // Rotas privadas (protegidas)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'jobs',
            element: <Jobs />,
          },
        ],
      },
    ],
  },
])
