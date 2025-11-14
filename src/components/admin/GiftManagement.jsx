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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gift Management</h1>
          <p className="text-gray-600 mt-1">Add and manage reward gifts, activate/deactivate availability, view redemption requests</p>
        </div>
        {activeTab === 'gifts' && (
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
          >
            + Add Gift
          </button>
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  View
                </button>
                <button
                  onClick={() => handleEdit(gift)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(gift._id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-400 border border-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all"
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
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Created At</label>
                  <p className="text-sm text-gray-900">
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

              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(viewingGift)
                    setShowModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Edit Gift
                </button>
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
        </>
      )}

      {/* Redemptions Tab */}
      {activeTab === 'redemptions' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Redemption Requests & Approvals</h2>
            <p className="text-gray-600 text-sm mt-1">View and manage user redemption requests</p>
          </div>
          {redemptions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No redemption requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redemptions.map((redemption) => (
                    <tr key={redemption._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
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
                        <span className="text-sm text-gray-600">
                          {redemption.createdAt
                            ? new Date(redemption.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
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
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRedemptionAction(redemption._id, 'Rejected')}
                              className="text-red-600 hover:text-red-900"
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

