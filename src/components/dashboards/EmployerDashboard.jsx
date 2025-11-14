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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employer Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Overview of your assigned pumps and gifts</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`}
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
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Daily Fuel Sales</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.dailyFuelSales?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Today only</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Liters</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLiters?.toFixed(2) || 0}L</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">⛽</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalInvoices || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Assigned Pumps</p>
              <p className="text-3xl font-bold text-gray-900">{stats.assignedPumpsCount}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">⛽</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Pumps */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Assigned Pumps</h2>
            <button
              onClick={() => router.push('/employer/pumps')}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
            >
              View All →
            </button>
          </div>
          {recentPumps.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No pumps assigned yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentPumps.map((pump) => (
                <div key={pump._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{pump.name}</p>
                      <div className="flex gap-2 mt-1">
                        {pump.fuelTypes?.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pump.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : pump.status === 'MAINTENANCE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Assigned Gifts</h2>
            <button
              onClick={() => router.push('/employer/gifts')}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
            >
              View All →
            </button>
          </div>
          {recentGifts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No gifts assigned yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentGifts.map((item) => (
                <div key={item.assignmentId} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.gift?.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.pointsRequired} pts required
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.status === 'REDEEMED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
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

