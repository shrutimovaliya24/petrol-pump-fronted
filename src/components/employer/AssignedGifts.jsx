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
      <div className="flex items-center justify-center h-48 sm:h-64">
        <div className="text-body text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-display">Assigned Gifts</h1>
        <p className="text-caption mt-1">View gifts assigned to you by supervisor</p>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by gift name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="sm:w-40 md:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="PENDING">Pending</option>
            <option value="REDEEMED">Redeemed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div className="sm:w-40 md:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <div className="card p-6 sm:p-8 md:p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl md:text-4xl">🎁</span>
            </div>
            <p className="text-body font-medium text-gray-500">No gifts found</p>
            <p className="text-caption mt-2 text-gray-400">
              {searchTerm || filterStatus !== 'ALL' || filterCategory !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No gifts have been assigned to you yet'}
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
                    Gift
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Category
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Points Required
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Available Points
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Assigned Date
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Assigned By
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Availability
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Approve Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGifts.map((item) => (
                  <tr key={item.assignmentId} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <div>
                        <p className="text-body font-medium">{item.gift?.name}</p>
                        <p className="text-caption mt-1">{item.gift?.description}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-caption font-semibold rounded-full bg-purple-100 text-purple-800">
                        {item.gift?.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body font-semibold">
                        {item.pointsRequired} pts
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">{item.pointsAvailable} pts</span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-caption font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">
                        {item.assignedAt
                          ? new Date(item.assignedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">
                        {item.assignedBy?.email || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-caption font-semibold rounded-full ${
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
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-body font-medium">
                      <select
                        value={item.availabilityStatus || ''}
                        onChange={(e) => handleUpdateAvailability(item.assignmentId, e.target.value)}
                        disabled={updatingStatus === item.assignmentId}
                        className="px-2 py-1 text-caption border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        <option value="available">Available</option>
                        <option value="low">Low</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </select>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-body font-medium">
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApproveStatus(item.assignmentId)}
                          disabled={updatingStatus === item.assignmentId}
                          className="btn-primary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatus === item.assignmentId ? 'Approving...' : 'Approve'}
                        </button>
                      ) : (
                        <span className="text-caption text-gray-500">-</span>
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

