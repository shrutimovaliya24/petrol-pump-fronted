'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const Header = ({ onMenuClick, showMenuButton = true }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setNotifications([])
        setUnreadCount(0)
        return
      }
      
      try {
        const response = await axios.get(`/api/notifications?userId=${user.id}&limit=20`, {
          timeout: 5000, // 5 second timeout
        })
        if (response.data && response.data.success) {
          const notificationsData = response.data.data || []
          const formattedNotifications = notificationsData.map((notif) => ({
            id: notif._id || notif.id,
            message: notif.message || '',
            title: notif.title || '',
            time: notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) : '',
            type: notif.type || 'info',
            read: notif.read || false,
            link: notif.link || null,
          }))
          setNotifications(formattedNotifications)
          setUnreadCount(response.data.unreadCount || 0)
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        // Log more details in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Notification API Error Details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: `/api/notifications?userId=${user.id}&limit=20`
          })
        }
        // Don't set empty on network errors - keep previous state
        if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
          console.warn('Notification API timeout or network error - will retry')
          return
        }
        // Only set empty for auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          setNotifications([])
          setUnreadCount(0)
        }
      }
    }
    
    // Initial fetch
    fetchNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?.id]) // Only depend on user.id, not entire user object

  const handleNotificationClick = async (notification) => {
    if (!notification.read && notification.id) {
      try {
        await axios.put(`/api/notifications/${notification.id}/read?userId=${user.id}`)
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
    
    if (notification.link) {
      router.push(notification.link)
    }
    setShowNotifications(false)
  }

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    try {
      await axios.put(`/api/notifications/read-all?userId=${user.id}`)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3 relative">
          {/* Mobile/Tablet Menu Button - Only show on screens < 1440px */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Notifications */}
          <div className="relative ml-auto" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-primary-600 rounded-full ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-xs">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-primary-50' : ''
                        }`}
                      >
                        {notification.title && (
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">{notification.title}</p>
                        )}
                        <p className="text-xs text-gray-700">{notification.message}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
