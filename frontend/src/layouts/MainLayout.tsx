import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks'
import { logout } from '../store/slices/authSlice'

export default function MainLayout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/jobs', label: 'Vagas', icon: '💼' },
  ]

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Pega a inicial do nome do usuário
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">🎯 Job Tracker</h1>
        </div>

        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {user?.email || 'user@email.com'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors" 
              title="Sair"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
