'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const GiftManagement = () => {
  const [gifts, setGifts] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingGift, setViewingGift] = useState(null)
  const [editingGift, setEditingGift] = useState(null)
  const [activeTab, setActiveTab] = useState('gifts') // 'gifts' or 'redemptions'
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
    fetchGifts()
    fetchRedemptions()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchGifts()
      fetchRedemptions()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRedemptions = async () => {
    try {
      const response = await axios.get('/api/redemptions?populate=user,gift')
      if (response.data.success) {
        setRedemptions(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error)
      // Try without populate if it fails
      try {
        const fallbackResponse = await axios.get('/api/redemptions')
        if (fallbackResponse.data.success) {
          const redemptions = fallbackResponse.data.data || []
          // Manually populate user and gift data
          const populatedRedemptions = await Promise.all(
            redemptions.map(async (redemption) => {
              try {
                const [userRes, giftRes] = await Promise.all([
                  axios.get(`/api/users/${redemption.userId}`),
                  axios.get(`/api/gifts/${redemption.giftId}`),
                ])
                return {
                  ...redemption,
                  userId: userRes.data.data || { email: 'N/A' },
                  giftId: giftRes.data.data || { name: 'N/A' },
                }
              } catch (err) {
                return {
                  ...redemption,
                  userId: { email: redemption.userId?.email || 'N/A' },
                  giftId: { name: redemption.giftId?.name || 'N/A' },
                }
              }
            })
          )
          setRedemptions(populatedRedemptions)
        }
      } catch (fallbackError) {
        console.error('Error fetching redemptions (fallback):', fallbackError)
        setRedemptions([])
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

  const fetchGifts = async () => {
    try {
      const response = await axios.get('/api/gifts')
      if (response.data.success) {
        // Sort by createdAt descending (newest first) so new gifts appear at top
        // But user wants new gifts below, so we'll reverse it
        const sortedGifts = (response.data.data || []).sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt) // Oldest first, so new ones appear below
        })
        setGifts(sortedGifts)
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
      fetchGifts() // Refresh to show new gift at bottom
      fetchRedemptions() // Refresh redemptions if gift was updated
    } catch (error) {
      console.error('Error saving gift:', error)
      alert('Error saving gift. Please try again.')
    }
  }

  const handleView = (gift) => {
    setViewingGift(gift)
    setShowViewModal(true)
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
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-0">
        <div>
          <h1 className="text-display">Gift Management</h1>
          <p className="text-caption mt-0.5 sm:mt-1">Add and manage reward gifts, activate/deactivate availability, view redemption requests</p>
        </div>
        {activeTab === 'gifts' && (
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-1.5 w-full sm:w-auto"
          >
            <span className="text-lg sm:text-xl md:text-2xl">+</span>
            <span>Add Gift</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-caption sm:text-body font-medium border-b-2 transition-colors ${
                activeTab === 'gifts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gifts
            </button>
            <button
              onClick={() => setActiveTab('redemptions')}
              className={`px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-caption sm:text-body font-medium border-b-2 transition-colors ${
                activeTab === 'redemptions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Redemption Requests </span>
              <span className="sm:hidden">Redemptions </span>
              ({redemptions.filter(r => r.status === 'Pending').length})
            </button>
          </nav>
        </div>
      </div>

      {/* Gifts Tab */}
      {activeTab === 'gifts' && (
        <>
      {loading ? (
        <div className="text-center py-6 sm:py-8 md:py-12 text-caption">Loading...</div>
      ) : gifts.length === 0 ? (
        <div className="card p-6 sm:p-8 md:p-12 text-center">
          <p className="text-body font-medium">No gifts found. Add your first gift to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {gifts.map((gift) => (
            <div key={gift._id} className="card p-3 sm:p-4 md:p-5 lg:p-6 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-xl md:text-2xl">🎁</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{gift.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{gift.category}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                  gift.active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {gift.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3 md:mb-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-semibold">{gift.pointsRequired}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-semibold">₹{gift.value}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold">{gift.stock}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleView(gift)}
                  className="flex-1 bg-primary-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-primary-700 transition-all"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(gift)}
                  className="flex-1 bg-primary-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-primary-700 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(gift._id)}
                  className="flex-1 bg-red-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Gift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-heading">
                {editingGift ? 'Edit Gift' : 'Add Gift'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Gift Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter gift name"
                />
              </div>

              <div>
                <label className="block text-label mb-1 sm:mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter gift description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <div>
                  <label className="block text-label mb-1 sm:mb-2">
                    Points Required <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.pointsRequired}
                    onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-label mb-1 sm:mb-2">
                    Value (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label mb-1 sm:mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label mb-1 sm:mb-2">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="active" className="ml-2 text-label">
                  Active Status
                </label>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 bg-yellow-400 border border-yellow-600 text-gray-900 hover:bg-yellow-500"
                >
                  {editingGift ? 'Update Gift' : 'Add Gift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Gift Modal */}
      {showViewModal && viewingGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-heading">Gift Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingGift(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl md:text-3xl">🎁</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-heading truncate">{viewingGift.name}</h3>
                  <p className="text-caption mt-0.5 sm:mt-1">{viewingGift.category}</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-label mb-1">Description</label>
                  <p className="text-body">{viewingGift.description || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div>
                    <label className="block text-label mb-1">Points Required</label>
                    <p className="text-body font-semibold">{viewingGift.pointsRequired || 0} pts</p>
                  </div>
                  <div>
                    <label className="block text-label mb-1">Value</label>
                    <p className="text-body font-semibold">₹{viewingGift.value || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div>
                    <label className="block text-label mb-1">Stock Quantity</label>
                    <p className="text-body font-semibold">{viewingGift.stock || 0}</p>
                  </div>
                  <div>
                    <label className="block text-label mb-1">Status</label>
                    <span className={`px-2 py-1 sm:px-2.5 sm:py-1 text-caption font-semibold rounded-full ${
                      viewingGift.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingGift.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-label mb-1">Created At</label>
                  <p className="text-body">
                    {viewingGift.createdAt
                      ? new Date(viewingGift.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-gray-200 flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(viewingGift)
                    setShowModal(true)
                  }}
                  className="btn-primary flex-1"
                >
                  Edit Gift
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingGift(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Redemptions Tab */}
      {activeTab === 'redemptions' && (
        <div className="card overflow-hidden">
          <div className="p-3 sm:p-4 md:p-5 lg:p-6 border-b border-gray-200">
            <h2 className="text-heading">Redemption Requests & Approvals</h2>
            <p className="text-caption mt-1">View and manage user redemption requests</p>
          </div>
          {redemptions.length === 0 ? (
            <div className="p-6 sm:p-8 md:p-12 text-center text-body text-gray-500">No redemption requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-modern w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">User</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Gift</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Points Used</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Request Date</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Status</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redemptions.map((redemption) => (
                    <tr key={redemption._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body">
                          {redemption.userId?.email || redemption.userEmail || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body font-medium">
                          {redemption.giftId?.name || redemption.giftName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body font-semibold">
                          {redemption.pointsUsed || 0} pts
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body text-gray-600">
                          {redemption.createdAt
                            ? new Date(redemption.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-caption font-semibold rounded-full ${
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
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-body font-medium">
                        {redemption.status === 'Pending' && (
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              onClick={() => handleRedemptionAction(redemption._id, 'Approved')}
                              className="text-green-600 hover:text-green-900 text-xs sm:text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRedemptionAction(redemption._id, 'Rejected')}
                              className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
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
      )}
    </div>
  )
}

export default GiftManagement

