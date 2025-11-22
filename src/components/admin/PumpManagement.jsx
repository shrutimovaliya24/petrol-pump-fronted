'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const PumpManagement = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [pumps, setPumps] = useState([])
  const [pumpAssignments, setPumpAssignments] = useState([])
  const [employers, setEmployers] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [stats, setStats] = useState({
    totalPumps: 0,
    activePumps: 0,
    totalGifts: 0,
    totalCustomers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedPumpForAssignment, setSelectedPumpForAssignment] = useState(null)
  const [assignmentFormData, setAssignmentFormData] = useState({
    employerId: '',
  })
  const [editingPump, setEditingPump] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    fuelTypes: [],
    supervisor: '',
  })

  const fuelTypesOptions = ['PETROL', 'DIESEL', 'LPG', 'CNG']

  useEffect(() => {
    fetchPumps()
    fetchStats()
    fetchAssignments()
    fetchEmployers()
    fetchSupervisors()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPumps()
      fetchStats()
      fetchAssignments()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSupervisors = async () => {
    try {
      const response = await axios.get('/api/users?role=supervisor')
      if (response.data.success) {
        setSupervisors(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error)
    }
  }

  const fetchPumps = async () => {
    try {
      const response = await axios.get('/api/admin/pumps')
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

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/pumps/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching pump stats:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/admin/pump-assignments')
      if (response.data.success) {
        setPumpAssignments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setPumpAssignments([])
    }
  }

  const fetchEmployers = async () => {
    try {
      const response = await axios.get('/api/users?role=employer')
      if (response.data.success) {
        setEmployers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employers:', error)
    }
  }

  const getAssignedEmployer = (pumpId) => {
    const assignment = pumpAssignments.find(
      (a) => a.pumpId?._id === pumpId && a.status === 'ACTIVE'
    )
    return assignment?.employerId
  }

  const handleAssignPump = (pump) => {
    setSelectedPumpForAssignment(pump)
    const currentAssignment = getAssignedEmployer(pump._id)
    setAssignmentFormData({
      employerId: currentAssignment?._id || '',
    })
    setShowAssignmentModal(true)
  }

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!assignmentFormData.employerId) {
        alert('Please select an employer')
        return
      }

      await axios.post('/api/admin/assign-pump', {
        pumpId: selectedPumpForAssignment._id,
        employerId: assignmentFormData.employerId,
        assignedBy: user?.id,
      })

      setShowAssignmentModal(false)
      setSelectedPumpForAssignment(null)
      setAssignmentFormData({ employerId: '' })
      fetchAssignments()
      fetchPumps()
      alert('Pump assigned successfully!')
    } catch (error) {
      console.error('Error assigning pump:', error)
      alert(error.response?.data?.message || 'Error assigning pump. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Ensure supervisor is properly formatted
      const submitData = {
        ...formData,
        supervisor: formData.supervisor || null, // Convert empty string to null
      }
      
      if (editingPump) {
        await axios.put(`/api/admin/pumps/${editingPump._id}`, submitData)
      } else {
        await axios.post('/api/admin/pumps', submitData)
      }
      setShowModal(false)
      resetForm()
      fetchPumps()
      fetchStats()
      fetchAssignments() // Refresh assignments after pump create/update
      alert('Pump saved successfully!')
    } catch (error) {
      console.error('Error saving pump:', error)
      alert(error.response?.data?.message || 'Error saving pump. Please try again.')
    }
  }

  const handleEdit = (pump) => {
    setEditingPump(pump)
    // Handle supervisor - could be ObjectId, string, or populated object
    let supervisorId = '';
    if (pump.supervisor) {
      if (typeof pump.supervisor === 'object' && pump.supervisor._id) {
        supervisorId = pump.supervisor._id.toString()
      } else {
        supervisorId = pump.supervisor.toString()
      }
    }
    
    setFormData({
      name: pump.name || '',
      fuelTypes: pump.fuelTypes || [],
      supervisor: supervisorId,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this pump?')) return
    
    try {
      await axios.delete(`/api/admin/pumps/${id}`)
      fetchPumps()
      fetchStats()
      fetchAssignments() // Refresh assignments after pump delete
    } catch (error) {
      console.error('Error deleting pump:', error)
      alert('Error deleting pump. Please try again.')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`/api/admin/pumps/${id}`, { status })
      fetchPumps()
      fetchStats()
      fetchAssignments() // Refresh assignments after status change
    } catch (error) {
      console.error('Error updating pump status:', error)
      alert('Error updating pump status. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      fuelTypes: [],
      supervisor: '',
    })
    setEditingPump(null)
  }

  const toggleFuelType = (type) => {
    setFormData(prev => ({
      ...prev,
      fuelTypes: prev.fuelTypes.includes(type)
        ? prev.fuelTypes.filter(t => t !== type)
        : [...prev.fuelTypes, type]
    }))
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-0">
        <div>
          <h1 className="text-display">Pump Management</h1>
          <p className="text-caption mt-0.5 sm:mt-1">Monitor and manage fuel pumps</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-1.5 w-full sm:w-auto"
        >
          <span className="text-base sm:text-lg">+</span>
          <span className="hidden sm:inline">Add New Pump</span>
          <span className="sm:hidden">Add Pump</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Total Pumps</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalPumps}</p>
              <p className="text-primary-600 text-[10px] sm:text-xs mt-0.5">Active pumps</p>
            </div>
            <div className="bg-primary-100 p-1.5 sm:p-2 md:p-3 rounded-lg flex-shrink-0">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl">⛽</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Active Pumps</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.activePumps}</p>
              <p className="text-primary-600 text-[10px] sm:text-xs mt-0.5">Running now</p>
            </div>
            <div className="bg-primary-100 p-1.5 sm:p-2 md:p-3 rounded-lg flex-shrink-0">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Gift Items</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalGifts}</p>
              <p className="text-primary-600 text-[10px] sm:text-xs mt-0.5">Gifts available</p>
            </div>
            <div className="bg-primary-100 p-1.5 sm:p-2 md:p-3 rounded-lg flex-shrink-0">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl">🎁</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Customers</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-primary-600 text-[10px] sm:text-xs mt-0.5">Active customers</p>
            </div>
            <div className="bg-primary-100 p-1.5 sm:p-2 md:p-3 rounded-lg flex-shrink-0">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Pumps */}
      <div className="card p-3 sm:p-4 md:p-5 lg:p-6">
        <h2 className="text-heading mb-2 sm:mb-3 md:mb-4">All Pumps</h2>
        {loading ? (
          <div className="text-center py-6 sm:py-8 md:py-12 text-caption">Loading...</div>
        ) : pumps.length === 0 ? (
          <p className="text-body text-center py-4 sm:py-6 md:py-8">No pumps found. Add your first pump to get started.</p>
        ) : (
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {pumps.map((pump) => (
              <div key={pump._id} className="border border-gray-100 rounded-lg p-2 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">{pump.name.split('_')[1] || '1'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{pump.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{pump.fuelTypes?.join(', ') || 'N/A'}</p>
                      {pump.supervisor && (
                        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 truncate">
                          <span>Supervisor: {
                            typeof pump.supervisor === 'object' 
                              ? pump.supervisor.email || pump.supervisor.name || 'N/A'
                              : supervisors.find(s => s._id === pump.supervisor)?.email || pump.supervisor
                          }</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                    pump.status === 'ACTIVE' ? 'bg-primary-100 text-primary-700' : 
                    pump.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {pump.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {getAssignedEmployer(pump._id) && (
                    <div className="px-2 py-1 sm:px-3 sm:py-1 bg-primary-100 text-primary-700 rounded-lg text-[10px] sm:text-xs font-semibold">
                      Assigned to: <span className="truncate max-w-[120px] sm:max-w-none inline-block">{getAssignedEmployer(pump._id)?.email || 'N/A'}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleAssignPump(pump)}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-primary-600 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-primary-700 transition-all"
                  >
                    <span className="hidden sm:inline">{getAssignedEmployer(pump._id) ? 'Reassign' : 'Assign to Employer'}</span>
                    <span className="sm:hidden">{getAssignedEmployer(pump._id) ? 'Reassign' : 'Assign'}</span>
                  </button>
                  <button
                    onClick={() => handleEdit(pump)}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-primary-600 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-primary-700 transition-all"
                  >
                    <span className="hidden md:inline">Edit Supervisor</span>
                    <span className="md:hidden">Edit</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(pump._id, pump.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-red-700 transition-all"
                  >
                    {pump.status === 'ACTIVE' ? 'Stop' : 'Start'}
                  </button>
                  <button
                    onClick={() => handleDelete(pump._id)}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold hover:bg-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Pump Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPump ? 'Edit Pump' : 'Add New Pump'}
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
                  Pump Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., pump_1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fuel Types <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fuelTypesOptions.map((type) => (
                    <label key={type} className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.fuelTypes.includes(type)}
                        onChange={() => toggleFuelType(type)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.supervisor}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor._id} value={supervisor._id}>
                      {supervisor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  {editingPump ? 'Update' : 'Add'} Pump
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedPumpForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Pump to Employer</h2>
              <button
                onClick={() => {
                  setShowAssignmentModal(false)
                  setSelectedPumpForAssignment(null)
                  setAssignmentFormData({ employerId: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pump Name
                </label>
                <p className="text-gray-900 font-medium">{selectedPumpForAssignment.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Employer <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignmentFormData.employerId}
                  onChange={(e) => setAssignmentFormData({ employerId: e.target.value })}
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

              {getAssignedEmployer(selectedPumpForAssignment._id) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Currently assigned to: <strong>{getAssignedEmployer(selectedPumpForAssignment._id)?.email}</strong>
                    <br />
                    Selecting a new employer will reassign this pump.
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignmentModal(false)
                    setSelectedPumpForAssignment(null)
                    setAssignmentFormData({ employerId: '' })
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                >
                  {getAssignedEmployer(selectedPumpForAssignment._id) ? 'Reassign' : 'Assign'} Pump
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PumpManagement

