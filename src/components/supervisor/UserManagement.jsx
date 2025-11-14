'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const UserManagement = () => {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('employers') // 'employers' or 'users'
  const [employers, setEmployers] = useState([])
  const [users, setUsers] = useState([])
  const [pumps, setPumps] = useState([])
  const [pumpAssignments, setPumpAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedEmployer, setSelectedEmployer] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employer',
  })
  const [assignmentData, setAssignmentData] = useState({
    pumpId: '',
  })
  const [viewingUser, setViewingUser] = useState(null)
  const [userTransactions, setUserTransactions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showAssignUserModal, setShowAssignUserModal] = useState(false)
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState(null)
  const [userAssignments, setUserAssignments] = useState({}) // Map of userId to employer assignments

  useEffect(() => {
    if (currentUser?.id) {
      fetchEmployers()
      fetchUsers()
      fetchPumps()
      fetchPumpAssignments()
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchEmployers()
        fetchUsers()
        fetchPumpAssignments()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser?.id])

  // Fetch user assignments when users change
  useEffect(() => {
    if (users.length > 0) {
      fetchUserAssignments()
    }
  }, [users])

  const fetchEmployers = async () => {
    if (!currentUser?.id) {
      console.log('No current user ID, skipping fetchEmployers')
      return
    }
    
    try {
      console.log('Fetching employers for supervisor:', currentUser.id)
      // Get employers assigned to pumps under this supervisor
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${currentUser.id}`)
      if (dashboardResponse.data.success) {
        // Only get employers that are assigned to supervisor's pumps
        const assignedEmployers = dashboardResponse.data.data.employers || []
        console.log(`Found ${assignedEmployers.length} employers for supervisor`)
        setEmployers(assignedEmployers)
      } else {
        // Fallback: fetch all employers if dashboard API fails
        const response = await axios.get('/api/users?role=employer')
        if (response.data.success) {
          setEmployers(response.data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching employers:', error)
      // Fallback: fetch all employers
      try {
        const response = await axios.get('/api/users?role=employer')
        if (response.data.success) {
          setEmployers(response.data.data || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching employers (fallback):', fallbackError)
        setEmployers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (!currentUser?.id) {
      console.log('No current user ID, skipping fetchUsers')
      return
    }
    
    try {
      console.log('Fetching users for supervisor:', currentUser.id)
      // Get all users (backend now returns all users with transaction counts)
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${currentUser.id}`)
      if (dashboardResponse.data.success) {
        // Backend now returns all users with transactionCount field
        const allUsers = dashboardResponse.data.data.users || []
        console.log(`Found ${allUsers.length} users for supervisor`)
        setUsers(allUsers)
      } else {
        // Fallback: fetch all users if dashboard API fails
        const response = await axios.get('/api/users?role=user')
        if (response.data.success) {
          const usersWithCounts = (response.data.data || []).map(user => ({
            ...user,
            transactionCount: 0
          }))
          setUsers(usersWithCounts)
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      // Fallback: fetch all users
      try {
        const response = await axios.get('/api/users?role=user')
        if (response.data.success) {
          const usersWithCounts = (response.data.data || []).map(user => ({
            ...user,
            transactionCount: 0
          }))
          setUsers(usersWithCounts)
        }
      } catch (fallbackError) {
        console.error('Error fetching users (fallback):', fallbackError)
        setUsers([])
      }
    }
  }

  const fetchPumps = async () => {
    try {
      // Get pumps assigned to this supervisor
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${currentUser?.id}`)
      if (dashboardResponse.data.success) {
        setPumps(dashboardResponse.data.data.pumps || [])
      } else {
        // Fallback: fetch all pumps if dashboard API fails
        const response = await axios.get('/api/admin/pumps')
        if (response.data.success) {
          setPumps(response.data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching pumps:', error)
      // Fallback: fetch all pumps
      try {
        const response = await axios.get('/api/admin/pumps')
        if (response.data.success) {
          setPumps(response.data.data || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching pumps (fallback):', fallbackError)
      }
    }
  }

  const fetchPumpAssignments = async () => {
    try {
      // First get supervisor's pumps
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${currentUser?.id}`)
      if (dashboardResponse.data.success) {
        const supervisorPumps = dashboardResponse.data.data.pumps || []
        const pumpIds = supervisorPumps.map(p => p._id)
        
        // Get assignments only for supervisor's pumps
        const response = await axios.get('/api/admin/pump-assignments')
        if (response.data.success) {
          const allAssignments = response.data.data || []
          // Filter assignments to only include supervisor's pumps
          const filteredAssignments = allAssignments.filter(assignment => {
            const assignmentPumpId = assignment.pumpId?._id || assignment.pumpId
            return pumpIds.some(id => id?.toString() === assignmentPumpId?.toString())
          })
          setPumpAssignments(filteredAssignments)
        }
      } else {
        // Fallback: get all assignments
        const response = await axios.get('/api/admin/pump-assignments')
        if (response.data.success) {
          setPumpAssignments(response.data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching pump assignments:', error)
      // Fallback: get all assignments
      try {
        const response = await axios.get('/api/admin/pump-assignments')
        if (response.data.success) {
          setPumpAssignments(response.data.data || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching pump assignments (fallback):', fallbackError)
      }
    }
  }

  const fetchUserAssignments = async () => {
    try {
      const assignmentsMap = {}
      for (const user of users) {
        try {
          const response = await axios.get(`/api/supervisor/user-assignments?userId=${user._id}`)
          if (response.data.success) {
            assignmentsMap[user._id] = response.data.data || []
          }
        } catch (error) {
          console.error(`Error fetching assignments for user ${user._id}:`, error)
          assignmentsMap[user._id] = []
        }
      }
      setUserAssignments(assignmentsMap)
    } catch (error) {
      console.error('Error fetching user assignments:', error)
    }
  }

  const fetchUserTransactions = async (userId) => {
    try {
      // Get supervisor's pumps first
      const dashboardResponse = await axios.get(`/api/supervisor/dashboard/stats?supervisorId=${currentUser?.id}`)
      const supervisorPumpIds = dashboardResponse.data.success 
        ? (dashboardResponse.data.data.pumps || []).map(p => p._id)
        : []
      
      // Get all transactions for this user
      const response = await axios.get(`/api/admin/transactions?userId=${userId}`)
      if (response.data.success) {
        // Filter transactions to only show those from supervisor's pumps
        const filteredTransactions = (response.data.data || []).filter(trans => {
          const transPumpId = trans.pumpId?._id || trans.pumpId
          return supervisorPumpIds.some(pumpId => 
            transPumpId?.toString() === pumpId?.toString()
          )
        })
        setUserTransactions(filteredTransactions)
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      setUserTransactions([])
    }
  }

  const getAssignedPumps = (employerId) => {
    return pumpAssignments.filter(
      (assignment) => assignment.employerId?._id === employerId && assignment.status === 'ACTIVE'
    )
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
        alert('User updated successfully!')
      } else {
        // Check if user already exists before registering
        try {
          const checkResponse = await axios.get(`/api/users?email=${formData.email}&role=${formData.role.toLowerCase()}`)
          if (checkResponse.data.success && checkResponse.data.data && checkResponse.data.data.length > 0) {
            const existingUser = checkResponse.data.data[0]
            const shouldAssign = confirm(
              `User with email "${formData.email}" and role "${formData.role}" already exists.\n\n` +
              `Would you like to assign this existing user to a pump instead?`
            )
            if (shouldAssign) {
              setShowModal(false)
              setSelectedEmployer(existingUser)
              setAssignmentData({ pumpId: '' })
              setShowAssignModal(true)
              resetForm()
              return
            } else {
              alert('Registration cancelled. User already exists.')
              return
            }
          }
        } catch (checkError) {
          // If check fails, proceed with registration
          console.log('Could not check existing user, proceeding with registration')
        }

        // Register new user
        await axios.post('/api/auth/register', {
          email: formData.email,
          password: formData.password,
          role: formData.role.toLowerCase(),
        })
        alert('User registered successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchEmployers()
      fetchUsers()
      fetchPumpAssignments() // Refresh assignments after user create/update
      fetchUserAssignments() // Refresh user assignments
    } catch (error) {
      console.error('Error saving user:', error)
      const errorMessage = error.response?.data?.message || 'Error saving user. Please try again.'
      
      // Provide more helpful error messages
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        const shouldAssign = confirm(
          `${errorMessage}\n\n` +
          `Would you like to assign this existing user to a pump instead?`
        )
        if (shouldAssign && !editingUser) {
          // Try to find the existing user
          try {
            const findResponse = await axios.get(`/api/users?email=${formData.email}&role=${formData.role.toLowerCase()}`)
            if (findResponse.data.success && findResponse.data.data && findResponse.data.data.length > 0) {
              const existingUser = findResponse.data.data[0]
              setShowModal(false)
              setSelectedEmployer(existingUser)
              setAssignmentData({ pumpId: '' })
              setShowAssignModal(true)
              resetForm()
            }
          } catch (findError) {
            alert(errorMessage)
          }
        } else {
          alert(errorMessage)
        }
      } else {
        alert(errorMessage)
      }
    }
  }

  const handleAssignPump = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/assign-pump', {
        pumpId: assignmentData.pumpId,
        employerId: selectedEmployer._id,
        assignedBy: currentUser?.id,
      })
      setShowAssignModal(false)
      setSelectedEmployer(null)
      setAssignmentData({ pumpId: '' })
      fetchPumpAssignments()
      alert('Pump assigned successfully!')
    } catch (error) {
      console.error('Error assigning pump:', error)
      alert(error.response?.data?.message || 'Error assigning pump. Please try again.')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      password: '',
      role: user.role || 'employer',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await axios.delete(`/api/users/${id}`)
      fetchEmployers()
      fetchUsers()
      fetchPumpAssignments() // Refresh assignments after user delete
      fetchUserAssignments() // Refresh user assignments
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. Please try again.')
    }
  }

  const handleViewUser = async (user) => {
    setViewingUser(user)
    if (user.role === 'user') {
      await fetchUserTransactions(user._id)
    }
  }

  const handleAssignUserToEmployer = (user) => {
    setSelectedUserForAssignment(user)
    setShowAssignUserModal(true)
  }

  const handleSubmitUserAssignment = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/supervisor/assign-user', {
        userId: selectedUserForAssignment._id,
        employerId: assignmentData.pumpId, // Reusing pumpId field for employerId
        supervisorId: currentUser?.id,
      })
      alert('User assigned to employer successfully!')
      setShowAssignUserModal(false)
      setSelectedUserForAssignment(null)
      setAssignmentData({ pumpId: '' })
      fetchUserAssignments()
      fetchUsers()
    } catch (error) {
      console.error('Error assigning user to employer:', error)
      alert(error.response?.data?.message || 'Error assigning user to employer. Please try again.')
    }
  }

  const getAssignedEmployer = (userId) => {
    const assignments = userAssignments[userId] || []
    if (assignments.length > 0) {
      return assignments[0].employerId?.email || 'N/A'
    }
    return 'Not Assigned'
  }


  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: 'employer',
    })
    setEditingUser(null)
  }

  const totalPages = Math.ceil((activeTab === 'employers' ? employers.length : users.length) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployers = employers.slice(startIndex, endIndex)
  const currentUsers = users.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
             </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          + Register {activeTab === 'employers' ? 'Employer' : 'User'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab('employers')
                setCurrentPage(1)
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'employers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Registered Employers ({employers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('users')
                setCurrentPage(1)
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Registered Users ({users.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Employers Tab */}
      {activeTab === 'employers' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Registered Employers</h2>
            <p className="text-gray-600 text-sm mt-1">View employers and assign them to pumps</p>
          </div>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : employers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No employers found. Register your first employer.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Pumps</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentEmployers.map((employer) => (
                      <tr key={employer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{employer.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⛽</span>
                            <span className="text-sm text-gray-900">
                              {getAssignedPumps(employer._id).length} pump(s)
                            </span>
                            {getAssignedPumps(employer._id).length > 0 && (
                              <div className="text-xs text-gray-500">
                                ({getAssignedPumps(employer._id).map(a => a.pumpId?.name).join(', ')})
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            employer.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {employer.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedEmployer(employer)
                                setAssignmentData({ pumpId: '' })
                                setShowAssignModal(true)
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Assign Pump
                            </button>
                            <button
                              onClick={() => handleEdit(employer)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(employer._id)}
                              className="text-red-600 hover:text-red-900"
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
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, employers.length)} of {employers.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  <span className="px-3 py-1 text-sm border border-gray-300 rounded bg-blue-600 text-white">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Registered Users</h2>
            <p className="text-gray-600 text-sm mt-1">View all registered users under supervised pumps, check reward points and transactions</p>
          </div>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No users found. Register your first user.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Employer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {user.rewardPoints || user.points || 0} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {user.transactionCount || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {getAssignedEmployer(user._id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAssignUserToEmployer(user)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Assign Employer"
                            >
                              Assign Employer
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-red-600 hover:text-red-900"
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
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, users.length)} of {users.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  <span className="px-3 py-1 text-sm border border-gray-300 rounded bg-blue-600 text-white">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Register/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : `Register ${formData.role === 'employer' ? 'Employer' : 'User'}`}
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="employer">Employer</option>
                  <option value="user">User</option>
                </select>
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
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  {editingUser ? 'Update' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Pump Modal */}
      {showAssignModal && selectedEmployer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Pump to Employer</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedEmployer(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignPump} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employer
                </label>
                <p className="text-gray-900 font-medium">{selectedEmployer.email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Pump <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignmentData.pumpId}
                  onChange={(e) => setAssignmentData({ pumpId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a pump</option>
                  {pumps.map((pump) => (
                    <option key={pump._id} value={pump._id}>
                      {pump.name} - {pump.fuelTypes?.join(', ') || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              {getAssignedPumps(selectedEmployer._id).length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Currently assigned to: {getAssignedPumps(selectedEmployer._id).map(a => a.pumpId?.name).join(', ')}
                    <br />
                    Selecting a new pump will add to existing assignments.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedEmployer(null)
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                >
                  Assign Pump
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => {
                  setViewingUser(null)
                  setUserTransactions([])
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Reward Points</label>
                  <p className="text-sm font-semibold text-gray-900">{viewingUser.rewardPoints || viewingUser.points || 0} pts</p>
                </div>
              </div>

              {userTransactions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Recent Transactions</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userTransactions.slice(0, 10).map((transaction) => (
                      <div key={transaction._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Invoice: {transaction.invoiceNumber || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {transaction.createdAt
                                ? new Date(transaction.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">₹{transaction.amount || 0}</p>
                            <p className="text-xs text-gray-600">{transaction.rewardPoints || 0} pts</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign User to Employer Modal */}
      {showAssignUserModal && selectedUserForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign User to Employer</h2>
              <button
                onClick={() => {
                  setShowAssignUserModal(false)
                  setSelectedUserForAssignment(null)
                  setAssignmentData({ pumpId: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitUserAssignment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User
                </label>
                <p className="text-gray-900 font-medium">{selectedUserForAssignment.email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Employer <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignmentData.pumpId}
                  onChange={(e) => setAssignmentData({ pumpId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an employer</option>
                  {employers.map((employer) => (
                    <option key={employer._id} value={employer._id}>
                      {employer.email}
                    </option>
                  ))}
                </select>
              </div>

              {getAssignedEmployer(selectedUserForAssignment._id) !== 'Not Assigned' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Currently assigned to: {getAssignedEmployer(selectedUserForAssignment._id)}
                    <br />
                    Selecting a new employer will add to existing assignments.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignUserModal(false)
                    setSelectedUserForAssignment(null)
                    setAssignmentData({ pumpId: '' })
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                >
                  Assign Employer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

