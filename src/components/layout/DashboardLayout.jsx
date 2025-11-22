'use client'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

const DashboardLayout = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      // Desktop breakpoint is 1440px, so desktop is >= 1440px
      const isDesktopView = window.innerWidth >= 1440
      setIsDesktop(isDesktopView)
      // Auto-open sidebar on desktop (always visible)
      // On mobile/tablet, sidebar starts closed and opens via menu click
      if (isDesktopView) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    // Only allow toggling on mobile/tablet, not desktop
    if (!isDesktop) {
      setSidebarOpen(!sidebarOpen)
    }
  }

  const closeSidebar = () => {
    // Only allow closing on mobile/tablet, not desktop
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile/Tablet Overlay - Only show on screens < 1440px */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isDesktop
            ? 'w-56 sm:w-64' // Desktop: Always visible, fixed width
            : sidebarOpen
            ? 'fixed inset-y-0 left-0 z-50 w-56 sm:w-64' // Mobile/Tablet: Open state
            : '-translate-x-full fixed' // Mobile/Tablet: Closed state (hidden)
        } transition-all duration-300 overflow-hidden`}
      >
        <Sidebar role={role} onClose={closeSidebar} isMobile={!isDesktop} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header onMenuClick={toggleSidebar} showMenuButton={!isDesktop} />
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

