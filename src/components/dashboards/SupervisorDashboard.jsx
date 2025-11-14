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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Overview of pump status, assigned employers, and daily sales</p>
        </div>
        <button
          onClick={handleRefresh}
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

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-8 sm:py-12 text-sm sm:text-base">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Pump Status</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.pumpStatus?.active || 0}/{stats.pumpStatus?.total || 0}
                </p>
                <p className="text-green-600 text-sm mt-1">Active Pumps</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl">⛽</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Assigned Employers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.assignedEmployers || 0}</p>
                <p className="text-blue-600 text-sm mt-1">Total Employers</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">👨‍🏭</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Daily Sales Summary</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats.dailySales?.toLocaleString() || 0}</p>
                <p className="text-green-600 text-sm mt-1">Today's Sales</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pump Status List */}
      {pumps.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pump Status</h2>
            <span className="text-xs sm:text-sm text-gray-600">
              {stats.pumpStatus?.active || 0} Active / {stats.pumpStatus?.total || 0} Total
            </span>
          </div>
          <div className="space-y-3">
            {pumps.map((pump) => (
              <div key={pump._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⛽</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pump.name}</p>
                    <p className="text-sm text-gray-600">{pump.fuelTypes?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
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
            ))}
          </div>
        </div>
      )}
      {pumps.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No pumps assigned to you yet</p>
            <p className="text-gray-400 text-sm mt-2">Contact admin to assign pumps</p>
          </div>
        </div>
      )}

      {/* Assigned Employers List */}
      {employers.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Assigned Employers</h2>
            <button
              onClick={() => router.push('/supervisor/users')}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {employers.slice(0, 5).map((employer) => (
              <div key={employer._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👨‍🏭</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{employer.email}</p>
                      <p className="text-sm text-gray-600">
                        {employer.assignedPumpsCount || employer.assignedPumps?.length || 0} pump(s) assigned
                      </p>
                      {employer.assignedPumps && employer.assignedPumps.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {employer.assignedPumps.map((pump) => (
                            <span
                              key={pump._id}
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                pump.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : pump.status === 'MAINTENANCE'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
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
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/supervisor/users')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all {employers.length} employers →
              </button>
            </div>
          )}
        </div>
      )}
      {employers.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No employers assigned to your pumps yet</p>
            <button
              onClick={() => router.push('/supervisor/users')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
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

