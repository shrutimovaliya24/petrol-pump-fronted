'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const AssignedGifts = () => {
  const { user } = useAuth()
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchGifts()
    }
  }, [user])

  const fetchGifts = async () => {
    try {
      const response = await axios.get(`/api/employer/gifts?employerId=${user.id}`)
      if (response.data.success) {
        setGifts(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching gifts:', error)
      setGifts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredGifts = gifts.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus
    const matchesCategory = filterCategory === 'ALL' || item.gift?.category === filterCategory
    const matchesSearch = item.gift?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REDEEMED':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = ['ALL', ...new Set(gifts.map((item) => item.gift?.category).filter(Boolean))]

  const handleUpdateAvailability = async (giftAssignmentId, newStatus) => {
    try {
      setUpdatingStatus(giftAssignmentId)
      await axios.put(`/api/employer/gifts/${giftAssignmentId}/availability?employerId=${user.id}`, {
        availabilityStatus: newStatus,
      })
      alert('Gift availability updated successfully!')
      fetchGifts()
    } catch (error) {
      console.error('Error updating gift availability:', error)
      alert('Error updating gift availability. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleApproveStatus = async (giftAssignmentId) => {
    try {
      setUpdatingStatus(giftAssignmentId)
      await axios.put(`/api/employer/gifts/${giftAssignmentId}/status?employerId=${user.id}`, {
        status: 'AVAILABLE',
      })
      alert('Gift status approved successfully!')
      fetchGifts()
    } catch (error) {
      console.error('Error approving gift status:', error)
      alert(error.response?.data?.message || 'Error approving gift status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Assigned Gifts</h1>
        <p className="text-gray-600 mt-1">View gifts assigned to you by supervisor</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by gift name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="PENDING">Pending</option>
            <option value="REDEEMED">Redeemed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div className="sm:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gifts List */}
      {filteredGifts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-4xl">🎁</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">No gifts found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterStatus !== 'ALL' || filterCategory !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No gifts have been assigned to you yet'}
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
                    Gift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approve Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGifts.map((item) => (
                  <tr key={item.assignmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.gift?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.gift?.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {item.gift?.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.pointsRequired} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.pointsAvailable} pts</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {item.assignedAt
                          ? new Date(item.assignedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {item.assignedBy?.email || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.availabilityStatus === 'available'
                            ? 'bg-green-100 text-green-800'
                            : item.availabilityStatus === 'low'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.availabilityStatus?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={item.availabilityStatus || ''}
                        onChange={(e) => handleUpdateAvailability(item.assignmentId, e.target.value)}
                        disabled={updatingStatus === item.assignmentId}
                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="available">Available</option>
                        <option value="low">Low</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApproveStatus(item.assignmentId)}
                          disabled={updatingStatus === item.assignmentId}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          {updatingStatus === item.assignmentId ? 'Approving...' : 'Approve'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
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

export default AssignedGifts

