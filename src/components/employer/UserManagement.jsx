'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const UserManagement = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrUser, setQrUser] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/employer/users?employerId=${user.id}`)
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const updateData = {
          email: formData.email,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await axios.put(`/api/employer/users/${editingUser._id}`, updateData)
        alert('User updated successfully!')
      } else {
        await axios.post('/api/employer/users', {
          email: formData.email,
          password: formData.password,
          employerId: user.id,
        })
        alert('User created successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      alert(error.response?.data?.message || 'Error saving user. Please try again.')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      password: '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await axios.delete(`/api/employer/users/${id}`)
      alert('User deleted successfully!')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error.response?.data?.message || 'Error deleting user. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
    })
    setEditingUser(null)
  }

  const generateQRCode = (user) => {
    try {
      // Create URL to mobile invoice download page with user ID
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '')
      const invoiceDownloadUrl = `${baseUrl}/invoice/download?userId=${user._id || user.id}`

      // Generate QR code using API with URL data
      const encodedData = encodeURIComponent(invoiceDownloadUrl)
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`
      
      setQrUser(user)
      setQrCodeUrl(qrCodeApiUrl)
      setShowQRModal(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code')
    }
  }

  const totalPages = Math.ceil(users.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64">
        <div className="text-body text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
        <div>
          <h1 className="text-display">User Management</h1>
          <p className="text-caption mt-1">Manage user credentials and view user statistics</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary w-full sm:w-auto"
        >
          + Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <div className="p-6 sm:p-8 md:p-12 text-center text-body text-gray-500">
            No users found. Add your first user to get started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-modern w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Email</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Reward Points</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Tier</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Transactions</th>
                    <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body font-medium">{user.email}</span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body font-semibold">
                          {user.rewardPoints || 0} pts
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-caption font-semibold rounded-full ${
                          user.tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                          user.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          user.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {user.tier || 'Bronze'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span className="text-body">
                          {user.transactionCount || 0}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-body font-medium">
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => generateQRCode(user)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Generate QR Code"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 border-t border-gray-200">
                <div className="text-caption sm:text-body text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, users.length)} of {users.length} results
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-1.5 sm:px-2 py-1 text-caption sm:text-body border border-gray-300 rounded disabled:opacity-50"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-1.5 sm:px-2 py-1 text-caption sm:text-body border border-gray-300 rounded disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  <span className="px-2 sm:px-3 py-1 text-caption sm:text-body border border-gray-300 rounded bg-primary-600 text-white">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-1.5 sm:px-2 py-1 text-caption sm:text-body border border-gray-300 rounded disabled:opacity-50"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-1.5 sm:px-2 py-1 text-caption sm:text-body border border-gray-300 rounded disabled:opacity-50"
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-heading">
                {editingUser ? 'Edit User' : 'Add New User'}
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
                <label className="block text-label mb-1 sm:mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-label mb-1 sm:mb-2">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Enter password (minimum 6 characters)"}
                  minLength={editingUser ? 0 : 6}
                />
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
                  className="btn-primary flex-1"
                >
                  {editingUser ? 'Update' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrUser && qrCodeUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">QR Code</h2>
              <button
                onClick={() => {
                  setShowQRModal(false)
                  setQrUser(null)
                  setQrCodeUrl('')
                }}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl p-1"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">{qrUser.email}</p>
                <p className="text-xs text-gray-500">Reward Points: {qrUser.rewardPoints || 0} pts | Tier: {qrUser.tier || 'Bronze'}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <img 
                    src={qrCodeUrl} 
                    alt="User QR Code" 
                    className="w-40 h-40 sm:w-48 sm:h-48 border border-gray-200 rounded" 
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setShowQRModal(false)
                  setQrUser(null)
                  setQrCodeUrl('')
                }}
                className="w-full px-3 py-2.5 sm:py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

