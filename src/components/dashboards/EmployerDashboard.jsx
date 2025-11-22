'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const EmployerDashboard = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    assignedPumpsCount: 0,
    assignedGiftsCount: 0,
    availableGiftsCount: 0,
    pendingGiftsCount: 0,
    dailyFuelSales: 0,
    totalLiters: 0,
    totalInvoices: 0,
  })
  const [recentPumps, setRecentPumps] = useState([])
  const [recentGifts, setRecentGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData(false)
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData(true)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      }
      const [statsRes, pumpsRes, giftsRes] = await Promise.all([
        axios.get(`/api/employer/dashboard/stats?employerId=${user.id}`),
        axios.get(`/api/employer/pumps?employerId=${user.id}`),
        axios.get(`/api/employer/gifts?employerId=${user.id}`),
      ])

      if (statsRes.data.success) {
        setStats({
          assignedPumpsCount: statsRes.data.data.assignedPumpsCount || 0,
          assignedGiftsCount: statsRes.data.data.assignedGiftsCount || 0,
          availableGiftsCount: statsRes.data.data.availableGiftsCount || 0,
          pendingGiftsCount: statsRes.data.data.pendingGiftsCount || 0,
          dailyFuelSales: statsRes.data.data.dailyFuelSales || 0,
          totalLiters: statsRes.data.data.totalLiters || 0,
          totalInvoices: statsRes.data.data.totalInvoices || 0,
        })
      }

      if (pumpsRes.data.success) {
        const pumps = pumpsRes.data.data || []
        // Sort by most recent assignment date
        const sortedPumps = [...pumps].sort((a, b) => {
          const dateA = new Date(a.assignedAt || a.createdAt || 0)
          const dateB = new Date(b.assignedAt || b.createdAt || 0)
          return dateB - dateA
        })
        setRecentPumps(sortedPumps.slice(0, 5))
      }

      if (giftsRes.data.success) {
        const gifts = giftsRes.data.data || []
        // Sort by most recent assignment date
        const sortedGifts = [...gifts].sort((a, b) => {
          const dateA = new Date(a.assignedAt || 0)
          const dateB = new Date(b.assignedAt || 0)
          return dateB - dateA
        })
        setRecentGifts(sortedGifts.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  if (loading && initialLoad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-display">Employer Dashboard</h1>
          <p className="text-caption mt-0.5 sm:mt-1">Overview of your assigned pumps and gifts</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={loading}
          className="btn-primary flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
          <span className="sm:hidden">{loading ? '...' : '↻'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Daily Sales</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{stats.dailyFuelSales?.toLocaleString() || 0}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Today</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Total Liters</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalLiters?.toFixed(2) || 0}L</p>
              <p className="text-[10px] text-gray-500 mt-0.5">All time</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">⛽</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Invoices</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalInvoices || 0}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">All time</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">📄</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Assigned Pumps</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.assignedPumpsCount}</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">⛽</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {/* Recent Pumps */}
        <div className="card overflow-hidden">
          <div className="p-2 sm:p-3 md:p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-heading">Recent Pumps</h2>
            <button
              onClick={() => router.push('/employer/pumps')}
              className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium"
            >
              View All →
            </button>
          </div>
          {recentPumps.length === 0 ? (
            <div className="p-3 sm:p-4 md:p-6 text-center text-caption">
              No pumps assigned yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPumps.map((pump) => (
                <div key={pump._id} className="p-2 sm:p-3 md:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">{pump.name}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {pump.fuelTypes?.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-primary-100 text-primary-700"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0 ${
                        pump.status === 'ACTIVE'
                          ? 'bg-primary-100 text-primary-700'
                          : pump.status === 'MAINTENANCE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pump.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Gifts */}
        <div className="card overflow-hidden">
          <div className="p-2 sm:p-3 md:p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-heading">Recent Gifts</h2>
            <button
              onClick={() => router.push('/employer/gifts')}
              className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium"
            >
              View All →
            </button>
          </div>
          {recentGifts.length === 0 ? (
            <div className="p-3 sm:p-4 md:p-6 text-center text-caption">
              No gifts assigned yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentGifts.map((item) => (
                <div key={item.assignmentId} className="p-2 sm:p-3 md:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">{item.gift?.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                        {item.pointsRequired} pts required
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0 ${
                        item.status === 'AVAILABLE'
                          ? 'bg-primary-100 text-primary-700'
                          : item.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : item.status === 'REDEEMED'
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployerDashboard

