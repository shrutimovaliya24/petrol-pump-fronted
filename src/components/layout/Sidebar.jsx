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
    <div className="h-full bg-gray-800 text-white flex flex-col">
      <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
          {role === 'admin' ? 'Admin Panel' : role === 'supervisor' ? 'Supervisor Panel' : role === 'employer' ? 'Employer Panel' : 'User Panel'}
        </h1>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 sm:p-4">
        {items.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-1 sm:mb-2 transition-all text-sm sm:text-base ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg sm:text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-2 sm:p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
              {getUserInitials()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs sm:text-sm font-medium lowercase truncate">{getUserName()}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Sidebar

