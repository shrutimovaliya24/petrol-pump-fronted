'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import UserManagement from '../../../components/employer/UserManagement'

export default function EmployerUsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'employer') {
      const roleRoutes = {
        admin: '/admin/dashboard',
        supervisor: '/supervisor/dashboard',
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

  if (!user || user.role !== 'employer') {
    return null
  }

  return (
    <DashboardLayout role="employer">
      <UserManagement />
    </DashboardLayout>
  )
}

