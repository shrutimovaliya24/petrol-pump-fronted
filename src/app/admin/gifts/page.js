'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import GiftManagement from '../../../components/admin/GiftManagement'

export default function AdminGiftsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'admin') {
      const roleRoutes = {
        supervisor: '/supervisor/dashboard',
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

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <DashboardLayout role="admin">
      <GiftManagement />
    </DashboardLayout>
  )
}





