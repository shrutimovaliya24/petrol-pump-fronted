'use client'

import { useState, useEffect } from 'react' 
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const Transactions = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [pumps, setPumps] = useState([])
  const [assignedUsers, setAssignedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    pumpId: '',
  })
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerEmail: '',
    customerName: '',
    pumpId: '',
    amount: '',
    liters: '',
    paymentType: 'Cash',
    autoInvoice: true,
  })

  useEffect(() => {
    if (user?.id) {
      fetchTransactions()
      fetchPumps()
      fetchAssignedUsers()
    }
  }, [user])

  useEffect(() => {
    // Auto-select first assigned pump
    if (pumps.length > 0 && !formData.pumpId) {
      setFormData(prev => ({ ...prev, pumpId: pumps[0]._id }))
    }
  }, [pumps])

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/employer/transactions?employerId=${user.id}&limit=1000`)
      if (response.data.success) {
        const fetchedTransactions = response.data.data || []
        setAllTransactions(fetchedTransactions)
        setTransactions(fetchedTransactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
      setAllTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions based on search, date range, and pump
  useEffect(() => {
    let filtered = [...allTransactions]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(transaction => 
        transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
        transaction.userId?.email?.toLowerCase().includes(searchLower) ||
        transaction.customerEmail?.toLowerCase().includes(searchLower) ||
        transaction.pumpId?.name?.toLowerCase().includes(searchLower)
      )
    }

    // Date from filter
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom)
      dateFrom.setHours(0, 0, 0, 0)
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt)
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate >= dateFrom
      })
    }

    // Date to filter
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo)
      dateTo.setHours(23, 59, 59, 999)
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt)
        return transactionDate <= dateTo
      })
    }

    // Pump filter
    if (filters.pumpId) {
      filtered = filtered.filter(transaction => {
        const pumpId = transaction.pumpId?._id || transaction.pumpId
        return pumpId?.toString() === filters.pumpId
      })
    }

    setTransactions(filtered)
  }, [filters, allTransactions])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export')
      return
    }

    // CSV headers
    const headers = [
      'Invoice No.',
      'Customer',
      'Employer',
      'Pump',
      'Amount',
      'Liters',
      'Payment',
      'Date & Time',
      'Reward Points'
    ]

    // CSV rows
    const rows = transactions.map(transaction => [
      transaction.invoiceNumber || 'N/A',
      transaction.userId?.email || transaction.customerEmail || 'N/A',
      transaction.employerId?.email || transaction.employerId?.name || 'N/A',
      transaction.pumpId?.name || transaction.pumpDetails || 'N/A',
      transaction.amount || 0,
      transaction.liters || 0,
      transaction.payment || transaction.paymentType || 'Cash',
      formatDate(transaction.createdAt),
      transaction.rewardPoints || 0
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const fetchPumps = async () => {
    try {
      const response = await axios.get(`/api/employer/pumps?employerId=${user.id}`)
      if (response.data.success) {
        setPumps(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching pumps:', error)
    }
  }

  const fetchAssignedUsers = async () => {
    try {
      const response = await axios.get(`/api/employer/users?employerId=${user.id}`)
      if (response.data.success) {
        setAssignedUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching assigned users:', error)
      setAssignedUsers([])
    }
  }


  const downloadInvoicePDF = async (transaction) => {
    try {
      // Load html2pdf library dynamically
      if (!window.html2pdf) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        script.onload = () => generatePDF(transaction)
        document.head.appendChild(script)
      } else {
        generatePDF(transaction)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Error downloading invoice')
    }
  }

  const generatePDF = (transaction) => {
    // Create invoice HTML element
    const invoiceDiv = document.createElement('div')
    invoiceDiv.style.padding = '40px'
    invoiceDiv.style.fontFamily = 'Arial, sans-serif'
    invoiceDiv.style.maxWidth = '800px'
    invoiceDiv.style.margin = '0 auto'
    invoiceDiv.style.backgroundColor = 'white'
    
    invoiceDiv.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; color: #000;">Petrol Pump Management System</h1>
        <p style="margin: 5px 0; color: #666; font-size: 16px;">Fuel Invoice</p>
      </div>
      <div style="margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Invoice Number:</span>
          <span style="font-weight: bold; color: #000;">${transaction.invoiceNumber || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Date & Time:</span>
          <span style="font-weight: bold; color: #000;">${formatDate(transaction.createdAt)}</span>
        </div>
      </div>
      <div style="margin: 30px 0; border-top: 1px solid #ccc; padding-top: 20px;">
        <h2 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Customer Details</h2>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Email:</span>
          <span style="font-weight: bold; color: #000;">${transaction.userId?.email || transaction.customerEmail || 'N/A'}</span>
        </div>
        ${transaction.customerName ? `<div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #666;">Name:</span><span style="font-weight: bold; color: #000;">${transaction.customerName}</span></div>` : ''}
      </div>
      <div style="margin: 30px 0; border-top: 1px solid #ccc; padding-top: 20px;">
        <h2 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Transaction Details</h2>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Pump:</span>
          <span style="font-weight: bold; color: #000;">${transaction.pumpId?.name || transaction.pumpDetails || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Amount:</span>
          <span style="font-weight: bold; color: #000; font-size: 18px;">₹${transaction.amount?.toLocaleString() || 0}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Liters:</span>
          <span style="font-weight: bold; color: #000;">${transaction.liters || 0}L</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Payment Mode:</span>
          <span style="font-weight: bold; color: #000;">${transaction.payment || transaction.paymentType || 'Cash'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Reward Points:</span>
          <span style="font-weight: bold; color: #22c55e;">${transaction.rewardPoints || 0} pts</span>
        </div>
      </div>
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ccc; padding-top: 20px;">
        <p>Thank you for your business!</p>
       
      </div>
    `

    // Configure html2pdf options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice-${transaction.invoiceNumber || transaction._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    // Generate and download PDF
    window.html2pdf().set(opt).from(invoiceDiv).save()
  }

  const generateInvoiceNumber = async () => {
    try {
      const response = await axios.get('/api/employer/transactions/next-invoice-number')
      if (response.data.success) {
        return response.data.data.invoiceNumber
      }
      throw new Error('Failed to generate invoice number')
    } catch (error) {
      console.error('Error generating invoice number:', error)
      // Fallback to timestamp-based if API fails
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 1000)
      return `INV-${timestamp}-${random}`
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validate user is available
      if (!user || !user.id) {
        alert('User session expired. Please log in again.')
        return
      }

      // Validate required fields
      if (!formData.pumpId) {
        alert('Please select a pump')
        return
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        alert('Please enter a valid amount')
        return
      }

      const invoiceNum = formData.autoInvoice ? await generateInvoiceNumber() : formData.invoiceNumber
      
      // Try to find user by email if provided
      let userId = null
      if (formData.customerEmail) {
        try {
          const userResponse = await axios.get(`/api/users?email=${formData.customerEmail}`)
          if (userResponse.data.success && userResponse.data.data && userResponse.data.data.length > 0) {
            userId = userResponse.data.data[0]._id
          }
        } catch (err) {
          console.log('User not found by email, proceeding without userId')
        }
      }

      const transactionData = {
        invoiceNumber: invoiceNum,
        userId: userId,
        pumpId: formData.pumpId,
        amount: parseFloat(formData.amount),
        liters: formData.liters ? parseFloat(formData.liters) : null,
        paymentType: formData.paymentType,
        employerId: user.id,
        description: `Fuel sale - ${invoiceNum}`,
        customerEmail: formData.customerEmail || '',
        customerName: formData.customerName || '',
      }

      const response = await axios.post('/api/employer/transactions', transactionData)
      if (response.data.success) {
        alert('Transaction recorded successfully!')
        setShowAddModal(false)
        resetForm()
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error creating transaction. Please try again.'
      alert(errorMessage)
      
      // If it's an authentication error, suggest re-login
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      customerEmail: '',
      customerName: '',
      pumpId: pumps.length > 0 ? pumps[0]._id : '',
      amount: '',
      liters: '',
      paymentType: 'Cash',
      autoInvoice: true,
    })
  }

  const handleViewInvoice = (transaction) => {
    setSelectedTransaction(transaction)
    setShowInvoiceModal(true)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">View and manage all transactions</p>
        </div>
        <button
          onClick={() => {
            if (!user || !user.id) {
              alert('User session expired. Please log in again.')
              return
            }
            resetForm()
            fetchAssignedUsers() // Refresh users list when opening modal
            setShowAddModal(true)
          }}
          disabled={!user || !user.id}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          + New Transaction
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Search */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Select Pump */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Pump</label>
            <select
              value={filters.pumpId}
              onChange={(e) => handleFilterChange('pumpId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Pumps</option>
              {pumps.map((pump) => (
                <option key={pump._id} value={pump._id}>
                  {pump.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-3xl sm:text-4xl">💰</span>
            </div>
            <p className="text-gray-500 text-base sm:text-lg font-medium">No transactions found</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">Start by creating a new transaction</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No.
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employer
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pump
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liters
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reward Points
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{transaction.invoiceNumber || 'N/A'}</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {transaction.userId?.email || transaction.customerEmail || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {transaction.employerId?.email || transaction.employerId?.name || user?.email || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {transaction.pumpId?.name || transaction.pumpDetails || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">₹{transaction.amount?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.liters || 0}L</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.payment || transaction.paymentType || 'Cash'}</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">{transaction.rewardPoints || 0} pts</span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewInvoice(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Invoice"
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {transaction.invoiceNumber || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewInvoice(transaction)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-1 border border-blue-600 rounded-lg"
                        title="View Invoice"
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">User</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.userId?.email || transaction.customerEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pump</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.pumpId?.name || transaction.pumpDetails || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="text-sm font-semibold text-gray-900">₹{transaction.amount?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Liters</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.liters || 0}L</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.payment || transaction.paymentType || 'Cash'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reward Points</p>
                      <p className="text-sm font-semibold text-green-600">{transaction.rewardPoints || 0} pts</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Record New Transaction</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.autoInvoice}
                  onChange={(e) => setFormData({ ...formData, autoInvoice: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium text-gray-700">Auto-generate Invoice Number</label>
              </div>

              {!formData.autoInvoice && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    required={!formData.autoInvoice}
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter invoice number"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Email <span className="text-red-500">*</span>
                </label>
                {assignedUsers.length > 0 ? (
                  <select
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select customer email</option>
                    {assignedUsers.map((user) => (
                      <option key={user._id || user.id} value={user.email}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">No users assigned to this employer</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pump <span className="text-red-500">*</span>
                </label>
                {pumps.length > 0 ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-900 font-medium">{pumps.find(p => p._id === formData.pumpId)?.name || pumps[0]?.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">No pumps assigned to you</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Liters <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.liters}
                    onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Enter liters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm sm:text-base"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Invoice</h2>
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setSelectedTransaction(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl p-1"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Fuel Invoice</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Invoice No: {selectedTransaction.invoiceNumber || 'N/A'}</p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Date:</span>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Customer:</span>
                  <span className="text-sm sm:text-base text-gray-900 font-medium break-all sm:break-normal">
                    {selectedTransaction.userId?.email || selectedTransaction.customerEmail || 'N/A'}
                  </span>
                </div>
                {selectedTransaction.customerName && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-sm sm:text-base text-gray-600">Customer Name:</span>
                    <span className="text-sm sm:text-base text-gray-900 font-medium">{selectedTransaction.customerName}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Pump:</span>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">
                    {selectedTransaction.pumpId?.name || selectedTransaction.pumpDetails || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Amount:</span>
                  <span className="text-sm sm:text-base text-gray-900 font-semibold">₹{selectedTransaction.amount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Liters:</span>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">{selectedTransaction.liters || 0}L</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Payment Mode:</span>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">{selectedTransaction.payment || selectedTransaction.paymentType || 'Cash'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base text-gray-600">Reward Points:</span>
                  <span className="text-sm sm:text-base text-green-600 font-semibold">{selectedTransaction.rewardPoints || 0} pts</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setSelectedTransaction(null)
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => downloadInvoicePDF(selectedTransaction)}
                  className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm sm:text-base"
                >
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions

