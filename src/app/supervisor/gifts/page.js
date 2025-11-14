'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import GiftManagement from '../../../components/supervisor/GiftManagement'

export default function GiftsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'supervisor') {
      const roleRoutes = {
        admin: '/admin/dashboard',
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
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-white text-xl">Loading...</div>}>
        <GiftManagement />
      </Suspense>
    </DashboardLayout>
  )
}

