'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import UserRewardPoints from '../../../components/user/RewardPoints'

export default function UserRewardsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'user') {
      const roleRoutes = {
        admin: '/admin/dashboard',
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

  if (!user || user.role !== 'user') {
    return null
  }

  return (
    <DashboardLayout role="user">
      <UserRewardPoints />
    </DashboardLayout>
  )
}

