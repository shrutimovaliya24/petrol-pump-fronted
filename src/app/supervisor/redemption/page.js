'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'

export default function RedemptionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Redirect to gift management page (which now includes redemption)
      router.push('/supervisor/gifts?tab=redemptions')
    }
  }, [loading, router])

  return (
    <div className="flex items-center justify-center h-screen text-white text-xl">
      Redirecting...
    </div>
  )
}

