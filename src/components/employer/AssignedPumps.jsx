'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const AssignedPumps = () => {
  const { user } = useAuth()
  const [pumps, setPumps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchPumps()
    }
  }, [user])

  const fetchPumps = async () => {
    try {
      const response = await axios.get(`/api/employer/pumps?employerId=${user.id}`)
      if (response.data.success) {
        setPumps(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching pumps:', error)
      setPumps([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPumps = pumps.filter((pump) => {
    const matchesStatus = filterStatus === 'ALL' || pump.status === filterStatus
    const matchesSearch = pump.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

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
        <h1 className="text-display">Assigned Pumps</h1>
        <p className="text-caption mt-1">View details of pumps assigned to you</p>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by pump name..."
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Pumps List */}
      {filteredPumps.length === 0 ? (
        <div className="card p-6 sm:p-8 md:p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl md:text-4xl">⛽</span>
            </div>
            <p className="text-body font-medium text-gray-500">No pumps found</p>
            <p className="text-caption mt-2 text-gray-400">
              {searchTerm || filterStatus !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No pumps have been assigned to you yet'}
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
                    Pump Name
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Fuel Types
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPumps.map((pump) => (
                  <tr key={pump._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body font-medium">{pump.name}</span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <div className="flex gap-1 sm:gap-2 flex-wrap">
                        {pump.fuelTypes?.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-caption font-semibold rounded-full bg-blue-100 text-blue-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-caption font-semibold rounded-full ${
                          pump.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : pump.status === 'MAINTENANCE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pump.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">
                        {pump.assignedAt
                          ? new Date(pump.assignedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">
                        {pump.assignedBy?.email || 'N/A'}
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

export default AssignedPumps

