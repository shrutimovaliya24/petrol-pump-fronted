'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const UserDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    availableBalance: 0,
    totalSpent: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState([])
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
      
      const [transactionsRes, pointsRes] = await Promise.all([
        axios.get(`/api/user/transactions?userId=${user.id}`),
        axios.get(`/api/user/reward-points?userId=${user.id}`),
      ])

      if (transactionsRes.data.success) {
        const transactions = transactionsRes.data.data || []
        setStats(prev => ({
          ...prev,
          totalTransactions: transactions.length,
          totalSpent: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        }))
        
        // Get recent transactions (last 5)
        const sorted = [...transactions].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0)
          const dateB = new Date(b.createdAt || 0)
          return dateB - dateA
        })
        setRecentTransactions(sorted.slice(0, 5))
      }

      if (pointsRes.data.success) {
        const pointsData = pointsRes.data.data || {}
        setStats(prev => ({
          ...prev,
          totalPointsEarned: pointsData.totalEarned || 0,
          totalPointsRedeemed: pointsData.totalRedeemed || 0,
          availableBalance: pointsData.availableBalance || 0,
        }))
      }
    } catch (error) {
      // Error fetching dashboard data
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Overview of your transactions and reward points</p>
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
              <p className="text-gray-600 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalSpent?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Points Earned</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPointsEarned || 0} pts</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">{stats.availableBalance || 0} pts</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">🎁</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Transactions</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Your latest fuel purchase transactions</p>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl sm:text-4xl">💰</span>
              </div>
              <p className="text-gray-500 text-base sm:text-lg font-medium">No transactions found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">You haven't made any transactions yet</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No.
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pump / Employer
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liters
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.invoiceNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {transaction.pumpId?.name || transaction.employerId?.email || transaction.employerId?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{transaction.amount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.liters || 0}L</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {transaction.rewardPoints || 0} pts
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {transaction.invoiceNumber || 'N/A'}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{transaction.amount?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Pump/Employer</p>
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {transaction.pumpId?.name || transaction.employerId?.email || transaction.employerId?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Liters</p>
                        <p className="text-xs font-medium text-gray-900">{transaction.liters || 0}L</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Reward Points</p>
                        <p className="text-xs font-semibold text-green-600">{transaction.rewardPoints || 0} pts</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UserDashboard


