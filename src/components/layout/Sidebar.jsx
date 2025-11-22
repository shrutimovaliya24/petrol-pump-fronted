'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ role, onClose, isMobile }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const menuItems = {
    supervisor: [
      { name: 'Dashboard', path: '/supervisor/dashboard', icon: '📊' },
      { name: 'Gift Management', path: '/supervisor/gifts', icon: '🎁' },
      { name: 'User Management', path: '/supervisor/users', icon: '👥' },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
      { name: 'Pump Management', path: '/admin/pumps', icon: '⛽' },
      { name: 'Transaction Management', path: '/admin/transactions', icon: '💰' },
      { name: 'Gift Management', path: '/admin/gifts', icon: '🎁' },
      { name: 'User Management', path: '/admin/users', icon: '👥' },
      { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
    ],
    employer: [
      { name: 'Dashboard', path: '/employer/dashboard', icon: '📊' },
      { name: 'Assigned Pump', path: '/employer/pumps', icon: '⛽' },
      { name: 'Assigned Gift Details', path: '/employer/gifts', icon: '🎁' },
      { name: 'Transactions', path: '/employer/transactions', icon: '💰' },
      { name: 'Reward Points', path: '/employer/rewards', icon: '⭐' },
      { name: 'User Management', path: '/employer/users', icon: '👥' },
    ],
    user: [
      { name: 'Dashboard', path: '/user/dashboard', icon: '📊' },
      { name: 'Transactions', path: '/user/transactions', icon: '💰' },
      { name: 'Reward Points', path: '/user/rewards', icon: '⭐' },
    ],
  }

  const items = menuItems[role] || []

  const handleLogout = () => {
    logout()
  }

  const getUserInitials = () => {
    if (user?.email) {
      const parts = user.email.split('@')[0].split('.')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const handleNavigation = (path) => {
    router.push(path)
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <div className="h-full bg-primary-900 text-white flex flex-col">
      <div className="p-3 sm:p-4 border-b border-primary-800 flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold">
          {role === 'admin' ? 'Admin' : role === 'supervisor' ? 'Supervisor' : role === 'employer' ? 'Employer' : 'User'}
        </h1>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-primary-200 hover:text-white p-1 rounded-lg hover:bg-primary-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {items.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1 transition-all text-sm ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t border-primary-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-primary-200 hover:bg-primary-800 hover:text-white transition-all"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-medium lowercase truncate">{getUserName()}</p>
              <p className="text-[10px] text-primary-300 capitalize">{role}</p>
            </div>
          </div>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Sidebar

