'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [pumpAssignments, setPumpAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrUser, setQrUser] = useState(null)

  const roles = ['admin', 'supervisor', 'user', 'employer'] // Admin can manage all roles

  useEffect(() => {
    fetchUsers()
    fetchPumpAssignments()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers()
      fetchPumpAssignments()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPumpAssignments = async () => {
    try {
      const response = await axios.get('/api/admin/pump-assignments')
      if (response.data.success) {
        setPumpAssignments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching pump assignments:', error)
    }
  }

  const getAssignedPumps = (userId) => {
    return pumpAssignments.filter(
      (assignment) => assignment.employerId?._id === userId && assignment.status === 'ACTIVE'
    )
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      if (response.data.success) {
        // Filter out admin users - only show employer, user, and supervisor
        const filteredUsers = (response.data.data || []).filter(
          (user) => user.role !== 'admin'
        )
        setUsers(filteredUsers)
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
          role: formData.role.toLowerCase(),
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await axios.put(`/api/users/${editingUser._id}`, updateData)
      } else {
        await axios.post('/api/auth/register', {
          email: formData.email,
          password: formData.password,
          role: formData.role.toLowerCase(),
        })
      }
      setShowModal(false)
      resetForm()
      fetchUsers()
      fetchPumpAssignments() // Refresh assignments after user create/update
    } catch (error) {
      console.error('Error saving user:', error)
      alert(error.response?.data?.message || 'Error saving user. Please try again.')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    const emailParts = user.email ? user.email.split('@')[0].split('.') : []
    setFormData({
      firstName: emailParts[0] || '',
      lastName: emailParts[1] || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this user?')) return
    
    try {
      await axios.delete(`/api/users/${id}`)
      fetchUsers()
      fetchPumpAssignments() // Refresh assignments after user delete
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
    })
    setEditingUser(null)
  }

  const getUserInitials = (email) => {
    if (!email) return 'U'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const getUserName = (email) => {
    if (!email) return 'User'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`
    }
    return email.split('@')[0]
  }

  const generateQRCode = (user) => {
    try {
      // Only generate QR for users (not admin, supervisor, employer)
      if (user.role !== 'user') {
        alert('QR code is only available for regular users')
        return
      }
      
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

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-display">User Management</h1>
          <p className="text-caption mt-0.5">Manage supervisors, employees, and user roles</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-1.5"
        >
          <span className="text-base">👤</span>
          Create User
        </button>
      </div>

      {/* User List */}
      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-heading">User List with Roles</h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-gray-600">Showing {startIndex + 1}-{Math.min(endIndex, users.length)} of {users.length}</span>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-caption">Loading...</div>
        ) : (
          <div className="overflow-x-auto table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Pumps</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs flex-shrink-0">
                          {getUserInitials(user.email)}
                        </div>
                        <span className="text-body font-medium truncate">{getUserName(user.email)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-body truncate block max-w-[120px] sm:max-w-[150px]">{user.email}</span>
                    </td>
                    <td>
                      <span className={`px-1.5 sm:px-2 py-0.5 text-caption font-semibold rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                        user.role === 'supervisor' ? 'bg-primary-100 text-primary-700' :
                        user.role === 'employer' ? 'bg-primary-100 text-primary-600' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={user.active !== false}
                          onChange={async (e) => {
                            try {
                              await axios.put(`/api/users/${user._id}`, { active: e.target.checked })
                              fetchUsers()
                            } catch (error) {
                              console.error('Error updating user status:', error)
                              alert('Error updating user status. Please try again.')
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 sm:w-9 sm:h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 sm:after:h-4 sm:after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                        <span className="ml-1 sm:ml-1.5 text-caption font-semibold text-gray-700">
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <span className="text-body">{user.rewardPoints || user.points || 0} pts</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-base sm:text-lg">⛽</span>
                        <span className="text-body">
                          {user.role === 'employer' ? getAssignedPumps(user._id).length : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {user.role === 'user' && (
                          <button
                            onClick={() => generateQRCode(user)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Generate QR Code"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setViewingUser(user)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm"
                        >
                          View
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-gray-50 px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, users.length)} of {users.length} results
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                &lt;
              </button>
              <span className="px-2.5 py-1 text-xs border border-primary-600 rounded bg-primary-600 text-white">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <h2 className="text-heading">User Details</h2>
              <button
                onClick={() => setViewingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {getUserInitials(viewingUser.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-subheading truncate">{getUserName(viewingUser.email)}</h3>
                  <p className="text-caption truncate">{viewingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption mb-1">Role</label>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                    viewingUser.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                    viewingUser.role === 'supervisor' ? 'bg-primary-100 text-primary-700' :
                    viewingUser.role === 'employer' ? 'bg-primary-100 text-primary-600' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingUser.role || 'user'}
                  </span>
                </div>
                <div>
                  <label className="block text-caption mb-1">Status</label>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingUser.active !== false ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingUser.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {viewingUser.role === 'employer' && (
                <div>
                  <label className="block text-caption mb-2">Assigned Pumps</label>
                  <div className="space-y-1.5">
                    {getAssignedPumps(viewingUser._id).length > 0 ? (
                      getAssignedPumps(viewingUser._id).map((assignment) => (
                        <div key={assignment._id} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-900">
                            {assignment.pumpId?.name || 'N/A'}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Status: {assignment.status}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No pumps assigned</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setViewingUser(null)
                    handleEdit(viewingUser)
                    setShowModal(true)
                  }}
                  className="w-full btn-primary"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <h2 className="text-heading">{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-label mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-label mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-label mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-label mb-1">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Enter password (minimum 6 characters)"}
                />
              </div>

              <div>
                <label className="block text-label mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrUser && qrCodeUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs m-2 sm:m-4">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-heading">QR Code</h2>
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
              <div className="text-center mb-3 sm:mb-4">
                <p className="text-body mb-2">{qrUser.email}</p>
                <p className="text-caption">Reward Points: {qrUser.rewardPoints || qrUser.points || 0} pts | Tier: {qrUser.tier || 'Bronze'}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <img 
                    src={qrCodeUrl} 
                    alt="User QR Code" 
                    className="w-40 h-40 sm:w-48 sm:h-48 border border-gray-200 rounded" 
                  />
                </div>
                <p className="text-caption text-gray-600 mb-3 sm:mb-4">Scan this QR code to access user invoice download</p>
                <button
                  onClick={() => {
                    setShowQRModal(false)
                    setQrUser(null)
                    setQrCodeUrl('')
                  }}
                  className="btn-secondary w-full"
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

export default UserManagement


