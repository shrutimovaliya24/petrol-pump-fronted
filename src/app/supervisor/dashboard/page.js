'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import SupervisorDashboard from '../../../components/dashboards/SupervisorDashboard'

export default function SupervisorDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'supervisor') {
      const roleRoutes = {
        admin: '/admin/dashboard',
        employer: '/employer/dashboard',
      }
      router.push(roleRoutes[user.role] || '/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Loading...
      </div>
    )
  }

  if (!user || user.role !== 'supervisor') {
    return null
  }

  return (
    <DashboardLayout role="supervisor">
      <SupervisorDashboard />
    </DashboardLayout>
  )
}

