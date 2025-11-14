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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reward Points</h1>
        <p className="text-gray-600 mt-1">View and track reward points issued to users</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Points Issued</p>
            <p className="text-3xl font-bold text-gray-900">{totalPointsIssued.toLocaleString()} pts</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <span className="text-2xl">⭐</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.email} {u.name ? `- ${u.name}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium whitespace-nowrap"
          >
            Search
          </button>
          {filterInvoice && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reward Points Table */}
      {filteredPoints.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-4xl">⭐</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">No reward points found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filterUser || filterDate || filterInvoice ? 'Try adjusting your filters' : 'No points have been issued yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPoints.map((point) => (
                  <tr key={point._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {point.transactionId?.invoiceNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {point.userId?.email || point.userId?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{point.transactionId?.amount?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">{point.points || 0} pts</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{formatDate(point.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
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

