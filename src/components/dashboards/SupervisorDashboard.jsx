'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const SupervisorDashboard = () => {
  const [stats, setStats] = useState({
    pumpStatus: { active: 0, total: 0 },
    assignedEmployers: 0,
    dailySales: 0,
  })
  const [pumps, setPumps] = useState([])
  const [employers, setEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats()
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardStats()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const fetchDashboardStats = async () => {
    if (!user?.id) {
      console.log('No user ID available')
      return
    }
    
    try {
      console.log('Fetching supervisor dashboard stats for supervisorId:', user.id)
      const response = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${user.id}`)
      if (response.data.success) {
        console.log('Supervisor dashboard stats received:', response.data.data)
        setStats(response.data.data)
        setPumps(response.data.data.pumps || [])
        setEmployers(response.data.data.employers || [])
      } else {
        console.error('Supervisor dashboard API returned unsuccessful:', response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      console.error('Error details:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchDashboardStats()
  }


  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-display">Supervisor Dashboard</h1>
          <p className="text-caption mt-0.5 sm:mt-1">Overview of pump status, assigned employers, and daily sales</p>
        </div>
        <button
          onClick={handleRefresh}
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

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-6 sm:py-8 md:py-12 text-caption">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-caption mb-0.5">Pump Status</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {stats.pumpStatus?.active || 0}/{stats.pumpStatus?.total || 0}
                </p>
                <p className="text-primary-600 text-xs mt-0.5">Active</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                <span className="text-lg sm:text-xl">⛽</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-caption mb-0.5">Employers</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.assignedEmployers || 0}</p>
                <p className="text-primary-600 text-xs mt-0.5">Total</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                <span className="text-lg sm:text-xl">👨‍🏭</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-caption mb-0.5">Daily Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{stats.dailySales?.toLocaleString() || 0}</p>
                <p className="text-primary-600 text-xs mt-0.5">Today</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                <span className="text-lg sm:text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pump Status List */}
      {pumps.length > 0 && (
        <div className="card p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3 md:mb-4">
            <h2 className="text-heading">Pump Status</h2>
            <span className="text-caption">
              {stats.pumpStatus?.active || 0} Active / {stats.pumpStatus?.total || 0} Total
            </span>
          </div>
          <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
            {pumps.map((pump) => (
              <div key={pump._id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-base">⛽</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{pump.name}</p>
                    <p className="text-xs text-gray-600 truncate">{pump.fuelTypes?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${
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
            ))}
          </div>
        </div>
      )}
      {pumps.length === 0 && !loading && (
        <div className="card p-4">
          <div className="text-center py-6">
            <p className="text-body font-medium">No pumps assigned to you yet</p>
            <p className="text-caption mt-1">Contact admin to assign pumps</p>
          </div>
        </div>
      )}

      {/* Assigned Employers List */}
      {employers.length > 0 && (
        <div className="card p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3 md:mb-4">
            <h2 className="text-heading">Assigned Employers</h2>
            <button
              onClick={() => router.push('/supervisor/users')}
              className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
            {employers.slice(0, 5).map((employer) => (
              <div key={employer._id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-base">👨‍🏭</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{employer.email}</p>
                      <p className="text-xs text-gray-600">
                        {employer.assignedPumpsCount || employer.assignedPumps?.length || 0} pump(s) assigned
                      </p>
                      {employer.assignedPumps && employer.assignedPumps.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {employer.assignedPumps.map((pump) => (
                            <span
                              key={pump._id}
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                pump.status === 'ACTIVE'
                                  ? 'bg-primary-100 text-primary-700'
                                  : pump.status === 'MAINTENANCE'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {pump.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {employers.length > 5 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => router.push('/supervisor/users')}
                className="text-primary-600 hover:text-primary-700 text-xs font-medium"
              >
                View all {employers.length} employers →
              </button>
            </div>
          )}
        </div>
      )}
      {employers.length === 0 && !loading && (
        <div className="card p-4">
          <div className="text-center py-6">
            <p className="text-body font-medium">No employers assigned to your pumps yet</p>
            <button
              onClick={() => router.push('/supervisor/users')}
              className="mt-3 text-primary-600 hover:text-primary-700 text-xs font-medium"
            >
              Register and assign employers →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupervisorDashboard

