'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const GiftManagement = () => {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [gifts, setGifts] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [users, setUsers] = useState([])
  const [employers, setEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [viewingGift, setViewingGift] = useState(null)
  const [editingGift, setEditingGift] = useState(null)
  const [assigningGift, setAssigningGift] = useState(null)
  const [assignTab, setAssignTab] = useState('employer') // 'employer' or 'user'
  const [activeTab, setActiveTab] = useState('gifts') // 'gifts' or 'redemptions'
  const [assignmentData, setAssignmentData] = useState({
    assignedToId: '',
    pointsRequired: '',
  })
  const [redemptionFilters, setRedemptionFilters] = useState({
    userId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: 0,
    value: 0,
    category: 'Beverage',
    stock: 0,
    active: true,
  })

  const categories = ['Beverage', 'Food', 'Electronics', 'Vouchers', 'Other']

  useEffect(() => {
    // Check for tab query parameter
    const tabParam = searchParams.get('tab')
    if (tabParam === 'redemptions') {
      setActiveTab('redemptions')
    }
  }, [searchParams])

  useEffect(() => {
    fetchGifts()
    fetchRedemptions()
    fetchUsers()
    fetchEmployers()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchGifts()
      fetchRedemptions()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTab === 'redemptions') {
      fetchRedemptions()
    }
  }, [redemptionFilters, activeTab])

  const fetchRedemptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      // Add supervisorId to filter redemptions to only supervised users
      if (user?.id) {
        params.append('supervisorId', user.id)
      }
      if (redemptionFilters.userId) params.append('userId', redemptionFilters.userId)
      if (redemptionFilters.status) params.append('status', redemptionFilters.status)
      if (redemptionFilters.dateFrom) params.append('dateFrom', redemptionFilters.dateFrom)
      if (redemptionFilters.dateTo) params.append('dateTo', redemptionFilters.dateTo)

      const response = await axios.get(`/api/redemptions?${params.toString()}`)
      
      if (response.data.success) {
        let redemptionsData = response.data.data || []
        
        // If message indicates no redemptions, show it
        if (redemptionsData.length === 0 && response.data.message) {
          // Message will be shown in empty state
        }
        
        // Fetch user reward points for each redemption
        redemptionsData = await Promise.all(
          redemptionsData.map(async (redemption) => {
            try {
              if (redemption.userId?._id || redemption.userId) {
                const userId = redemption.userId?._id || redemption.userId
                const pointsRes = await axios.get(`/api/user/reward-points?userId=${userId}`).catch(() => ({ data: { data: null } }))
                return {
                  ...redemption,
                  userRewardPoints: pointsRes.data?.data?.availableBalance || 0,
                }
              }
              return redemption
            } catch (err) {
              return redemption
            }
          })
        )
        
        setRedemptions(redemptionsData)
      } else {
        setRedemptions([])
      }
    } catch (error) {
      setRedemptions([])
      // Silently handle errors - will show empty state
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Get users from supervisor's supervised employers
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${user?.id}`)
      if (dashboardResponse.data.success) {
        // API returns 'users' not 'usersList'
        const usersList = dashboardResponse.data.data?.users || []
        setUsers(usersList)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      // Fallback: try to fetch all users
      try {
        const response = await axios.get('/api/users?role=user')
        if (response.data.success) {
          setUsers(response.data.data || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching users (fallback):', fallbackError)
        setUsers([])
      }
    }
  }

  const fetchEmployers = async () => {
    try {
      // Get employers assigned to supervisor's pumps
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${user?.id}`)
      if (dashboardResponse.data.success) {
        // API returns 'employers' not 'employersList'
        const employersList = dashboardResponse.data.data?.employers || []
        setEmployers(employersList)
      }
    } catch (error) {
      console.error('Error fetching employers:', error)
      // Fallback: try to fetch all employers
      try {
        const response = await axios.get('/api/users?role=employer')
        if (response.data.success) {
          setEmployers(response.data.data || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching employers (fallback):', fallbackError)
        setEmployers([])
      }
    }
  }

  const handleRedemptionAction = async (redemptionId, action) => {
    try {
      // Map action to proper status
      const statusMap = {
        'Approve': 'Approved',
        'Reject': 'Rejected',
        'Approved': 'Approved',
        'Rejected': 'Rejected'
      }
      const status = statusMap[action] || action
      
      await axios.put(`/api/redemptions/${redemptionId}`, { status })
      alert(`Redemption ${status} successfully!`)
      fetchRedemptions()
    } catch (error) {
      console.error('Error updating redemption:', error)
      alert(error.response?.data?.message || 'Error updating redemption. Please try again.')
    }
  }

  const handleView = (gift) => {
    setViewingGift(gift)
    setShowViewModal(true)
  }

  const handleAssignClick = (gift) => {
    setAssigningGift(gift)
    setAssignmentData({
      assignedToId: '',
      pointsRequired: gift.pointsRequired || '',
    })
    setShowAssignModal(true)
    setAssignTab('employer')
    // Refresh employers and users when opening modal
    fetchEmployers()
    fetchUsers()
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assigningGift || !assignmentData.assignedToId) {
      alert('Please select an employer or user')
      return
    }

    try {
      const assignedToRole = assignTab === 'employer' ? 'employer' : 'user'
      
      const response = await axios.post('/api/supervisor/assign-gift', {
        giftId: assigningGift._id,
        assignedToId: assignmentData.assignedToId,
        assignedToRole,
        assignedBy: user?.id,
        pointsAvailable: 0, // Will be calculated on backend for users
      })

      if (response.data.success) {
        alert(response.data.message || 'Gift assigned successfully!')
        setShowAssignModal(false)
        setAssigningGift(null)
        setAssignmentData({ assignedToId: '', pointsRequired: '' })
        
        // If assigned to a user, refresh redemptions list
        if (assignedToRole === 'user') {
          fetchRedemptions()
        }
      }
    } catch (error) {
      console.error('Error assigning gift:', error)
      alert(error.response?.data?.message || 'Error assigning gift. Please try again.')
    }
  }

  const fetchGifts = async () => {
    try {
      const response = await axios.get('/api/gifts')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingGift) {
        await axios.put(`/api/gifts/${editingGift._id}`, formData)
      } else {
        await axios.post('/api/gifts', formData)
      }
      setShowModal(false)
      resetForm()
      fetchGifts()
      fetchRedemptions() // Refresh redemptions after gift create/update
    } catch (error) {
      console.error('Error saving gift:', error)
      alert('Error saving gift. Please try again.')
    }
  }

  const handleEdit = (gift) => {
    setEditingGift(gift)
    setFormData({
      name: gift.name || '',
      description: gift.description || '',
      pointsRequired: gift.pointsRequired || 0,
      value: gift.value || 0,
      category: gift.category || 'Beverage',
      stock: gift.stock || 0,
      active: gift.active !== undefined ? gift.active : true,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gift?')) return
    
    try {
      await axios.delete(`/api/gifts/${id}`)
      fetchGifts()
      fetchRedemptions() // Refresh redemptions after gift delete
    } catch (error) {
      console.error('Error deleting gift:', error)
      alert('Error deleting gift. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pointsRequired: 0,
      value: 0,
      category: 'Beverage',
      stock: 0,
      active: true,
    })
    setEditingGift(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gift Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View available gifts and assign them to employers or users. Approve/reject redemption requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'gifts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gifts
            </button>
            <button
              onClick={() => setActiveTab('redemptions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'redemptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Redemption Requests ({redemptions.filter(r => r.status === 'Pending').length})
            </button>
          </nav>
        </div>
      </div>

      {/* Gifts Tab */}
      {activeTab === 'gifts' && (
        <>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : gifts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No gifts found. Add your first gift to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {gifts.map((gift) => (
            <div key={gift._id} className="bg-white rounded-xl shadow-md p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{gift.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{gift.category}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  gift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {gift.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-semibold">{gift.pointsRequired}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-semibold">₹{gift.value}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold">{gift.stock}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(gift)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleAssignClick(gift)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gift Assignment functionality would go here - for now, supervisors can only view gifts */}
      {/* Add/Edit Gift Modal - REMOVED: Supervisors cannot create/edit/delete gifts */}
      {false && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {editingGift ? 'Edit Gift' : 'Add Gift'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gift Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter gift name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter gift description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Points Required <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.pointsRequired}
                    onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Value (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm font-semibold text-gray-700">
                  Active Status
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-400 border border-yellow-600 text-gray-900 px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all text-sm sm:text-base"
                >
                  {editingGift ? 'Update Gift' : 'Add Gift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* Redemptions Tab */}
      {activeTab === 'redemptions' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setRedemptionFilters({ userId: '', status: '', dateFrom: '', dateTo: '' })}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">User</label>
                <select
                  value={redemptionFilters.userId}
                  onChange={(e) => setRedemptionFilters({ ...redemptionFilters, userId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Users</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={redemptionFilters.status}
                  onChange={(e) => setRedemptionFilters({ ...redemptionFilters, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={redemptionFilters.dateFrom}
                  onChange={(e) => setRedemptionFilters({ ...redemptionFilters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={redemptionFilters.dateTo}
                  onChange={(e) => setRedemptionFilters({ ...redemptionFilters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Redemptions</p>
                  <p className="text-3xl font-bold text-blue-600">{redemptions.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {redemptions.filter(r => r.status === 'Approved').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {redemptions.filter(r => r.status === 'Pending').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
          </div>

          {/* Redemption Requests Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Redemption Requests</h2>
                <p className="text-gray-600 text-sm mt-1">Manage and approve user redemption requests</p>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading redemptions...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg font-medium mb-2">No redemption requests found</p>
                <p className="text-gray-400 text-sm mb-4">
                  Redemptions are created automatically when you assign gifts to users, or when users request redemptions.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">To create redemptions:</p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside mb-3">
                    <li><strong>Assign a gift to a user:</strong> Go to "Gifts" tab → Click "Assign" → Select "Assign to User" → Choose user → This automatically creates a redemption</li>
                    <li><strong>Or have users request:</strong> Users login → Reward Points page → Request redemption</li>
                  </ol>
                  {users.length > 0 && gifts.length > 0 && (
                    <p className="text-xs text-blue-700 font-medium">💡 Tip: You have {users.length} user(s) and {gifts.length} gift(s) available. Try assigning a gift to see redemptions appear!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gift</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Used</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Reward Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {redemptions.map((redemption) => (
                      <tr key={redemption._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {redemption.userId?.email || redemption.userEmail || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {redemption.giftId?.name || redemption.giftName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {redemption.pointsUsed || 0} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {redemption.userRewardPoints || redemption.userId?.rewardPoints || redemption.userId?.points || 0} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {redemption.createdAt
                              ? new Date(redemption.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              redemption.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : redemption.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {redemption.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {redemption.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRedemptionAction(redemption._id, 'Approved')}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRedemptionAction(redemption._id, 'Rejected')}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Assign Gift Modal */}
      {showAssignModal && assigningGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Gift</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setAssigningGift(null)
                  setAssignmentData({ assignedToId: '', pointsRequired: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Gift: <span className="font-semibold text-gray-900">{assigningGift.name}</span></p>
                <p className="text-sm text-gray-600">Points Required: <span className="font-semibold text-gray-900">{assigningGift.pointsRequired}</span></p>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setAssignTab('employer')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      assignTab === 'employer'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Assign to Employer
                  </button>
                  <button
                    onClick={() => setAssignTab('user')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      assignTab === 'user'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Assign to User
                  </button>
                </nav>
              </div>

              <form onSubmit={handleAssign} className="space-y-4">
                {assignTab === 'employer' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Employer <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={assignmentData.assignedToId}
                      onChange={(e) => setAssignmentData({ ...assignmentData, assignedToId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an employer</option>
                      {employers.map((employer) => (
                        <option key={employer._id} value={employer._id}>
                          {employer.email} {employer.name ? `(${employer.name})` : ''}
                        </option>
                      ))}
                    </select>
                    {employers.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No employers available. Make sure employers are assigned to your pumps.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select User <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={assignmentData.assignedToId}
                      onChange={(e) => setAssignmentData({ ...assignmentData, assignedToId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a user</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.email} {u.name ? `(${u.name})` : ''}
                        </option>
                      ))}
                    </select>
                    {users.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No users available. Make sure users have transactions with your supervised employers.</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false)
                      setAssigningGift(null)
                      setAssignmentData({ assignedToId: '', pointsRequired: '' })
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Assign Gift
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Gift Modal */}
      {showViewModal && viewingGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Gift Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingGift(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-pink-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">🎁</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewingGift.name}</h3>
                  <p className="text-sm text-gray-600">{viewingGift.category}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{viewingGift.description || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Points Required</label>
                    <p className="text-sm font-semibold text-gray-900">{viewingGift.pointsRequired || 0} pts</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Value</label>
                    <p className="text-sm font-semibold text-gray-900">₹{viewingGift.value || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Stock Quantity</label>
                    <p className="text-sm font-semibold text-gray-900">{viewingGift.stock || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      viewingGift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingGift.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Availability</label>
                  <p className="text-sm text-gray-900">
                    {viewingGift.stock > 0 ? 'Available' : 'Out of Stock'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingGift(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GiftManagement

