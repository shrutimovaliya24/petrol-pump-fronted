'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const RewardPoints = () => {
  const { user } = useAuth()
  const [rewardPoints, setRewardPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterInvoice, setFilterInvoice] = useState('')
  const [searchInvoice, setSearchInvoice] = useState('')
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (user?.id) {
      fetchRewardPoints()
      fetchUsers()
    }
  }, [user])

  const fetchRewardPoints = async () => {
    try {
      const response = await axios.get(`/api/employer/reward-points?employerId=${user.id}`)
      if (response.data.success) {
        setRewardPoints(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reward points:', error)
      setRewardPoints([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users?role=user')
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSearch = () => {
    setFilterInvoice(searchInvoice)
  }

  const handleClearSearch = () => {
    setSearchInvoice('')
    setFilterInvoice('')
  }

  const filteredPoints = rewardPoints.filter((point) => {
    const matchesUser = !filterUser || point.userId?._id === filterUser || point.userId?.email === filterUser
    const matchesDate = !filterDate || new Date(point.createdAt).toLocaleDateString() === new Date(filterDate).toLocaleDateString()
    
    // Fix invoice number search - check multiple possible paths
    const invoiceNumber = point.transactionId?.invoiceNumber || point.invoiceNumber || ''
    const matchesInvoice = !filterInvoice || 
      invoiceNumber.toString().toLowerCase().includes(filterInvoice.toLowerCase().trim())
    
    return matchesUser && matchesDate && matchesInvoice
  })

  const totalPointsIssued = filteredPoints.reduce((sum, point) => sum + (point.points || 0), 0)

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64">
        <div className="text-body text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-display">Reward Points</h1>
        <p className="text-caption mt-1">View and track reward points issued to users</p>
      </div>

      {/* Summary Card */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption mb-1">Total Points Issued</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{totalPointsIssued.toLocaleString()} pts</p>
          </div>
          <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
            <span className="text-lg sm:text-xl md:text-2xl">⭐</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
        <div className="flex-1">
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.email} {u.name ? `- ${u.name}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-40 md:w-48">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            className="flex-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSearch}
            className="btn-primary whitespace-nowrap text-xs sm:text-sm"
          >
            Search
          </button>
          {filterInvoice && (
            <button
              onClick={handleClearSearch}
              className="btn-secondary whitespace-nowrap text-xs sm:text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reward Points Table */}
      {filteredPoints.length === 0 ? (
        <div className="card p-6 sm:p-8 md:p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl md:text-4xl">⭐</span>
            </div>
            <p className="text-body font-medium text-gray-500">No reward points found</p>
            <p className="text-caption mt-2 text-gray-400">
              {filterUser || filterDate || filterInvoice ? 'Try adjusting your filters' : 'No points have been issued yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Invoice No.
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    User
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Transaction Amount
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Points Issued
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Date & Time
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPoints.map((point) => (
                  <tr key={point._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body font-medium">
                        {point.transactionId?.invoiceNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">
                        {point.userId?.email || point.userId?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body font-semibold">
                        ₹{point.transactionId?.amount?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body font-semibold text-green-600">{point.points || 0} pts</span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">{formatDate(point.createdAt)}</span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-caption font-semibold rounded-full bg-green-100 text-green-800">
                        Issued
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default RewardPoints

