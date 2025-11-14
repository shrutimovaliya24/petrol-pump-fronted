'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completed: 0,
    pending: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    pumpId: '',
  })
  const [pumps, setPumps] = useState([])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchTransactions()
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTransactions()
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [currentPage, itemsPerPage])

  // Client-side filtering
  useEffect(() => {
    let filtered = [...allTransactions]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(transaction => 
        transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
        transaction.userId?.email?.toLowerCase().includes(searchLower) ||
        transaction.customerEmail?.toLowerCase().includes(searchLower) ||
        transaction.pumpId?.name?.toLowerCase().includes(searchLower) ||
        transaction.employerId?.email?.toLowerCase().includes(searchLower)
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

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setTransactions(filtered.slice(startIndex, endIndex))
    setStats(prev => ({ ...prev, total: filtered.length }))
  }, [filters, allTransactions, currentPage, itemsPerPage])

  const fetchFilterOptions = async () => {
    try {
      const pumpsRes = await axios.get('/api/admin/pumps')
      if (pumpsRes.data.success) {
        const pumpsData = pumpsRes.data.data || []
        setPumps(pumpsData)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // Fetch all transactions for client-side filtering
      const response = await axios.get(`/api/admin/transactions?limit=10000`)
      if (response.data.success) {
        const fetchedTransactions = response.data.data || []
        setAllTransactions(fetchedTransactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setAllTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      pumpId: '',
    })
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    // Get all filtered transactions (not just current page)
    let filtered = [...allTransactions]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(transaction => 
        transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
        transaction.userId?.email?.toLowerCase().includes(searchLower) ||
        transaction.customerEmail?.toLowerCase().includes(searchLower) ||
        transaction.pumpId?.name?.toLowerCase().includes(searchLower) ||
        transaction.employerId?.email?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom)
      dateFrom.setHours(0, 0, 0, 0)
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt)
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate >= dateFrom
      })
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo)
      dateTo.setHours(23, 59, 59, 999)
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt)
        return transactionDate <= dateTo
      })
    }

    if (filters.pumpId) {
      filtered = filtered.filter(transaction => {
        const pumpId = transaction.pumpId?._id || transaction.pumpId
        return pumpId?.toString() === filters.pumpId
      })
    }

    if (filtered.length === 0) {
      alert('No transactions to export')
      return
    }

    // CSV headers
    const headers = [
      'Invoice No.',
      'Customer',
      'Pump',
      'Employer',
      'Amount',
      'Liters',
      'Payment',
      'Status',
      'Date & Time'
    ]

    // CSV rows
    const rows = filtered.map(transaction => [
      transaction.invoiceNumber || 'N/A',
      transaction.customerEmail || transaction.userId?.email || 'N/A',
      transaction.pumpDetails || transaction.pumpId?.name || 'N/A',
      transaction.employerId?.email || transaction.employerId?.name || 'N/A',
      transaction.amount || 0,
      transaction.liters || 0,
      transaction.payment || transaction.paymentType || 'Cash',
      transaction.status || 'Completed',
      formatDate(transaction.createdAt)
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

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/transactions/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error)
    }
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



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-green-600 text-xs mt-1">Today revenue</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-blue-600 text-xs mt-1">Completed transactions</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-orange-600 text-xs mt-1">Pending transactions</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-purple-600 text-xs mt-1">Total transactions</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">⛽</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
          <p className="text-gray-600 text-sm mt-1">Invoice-wise sales tracking - View, filter, and export transaction data</p>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pump</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{transaction.invoiceNumber || transaction.description || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.customerEmail || transaction.userId?.email || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.pumpDetails || transaction.pumpId?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.employerId?.email || transaction.employerId?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">₹{transaction.amount?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.liters ? `${transaction.liters}L` : 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.payment || 'Cash'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status || 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">of {stats.total} transactions</span>
              </div>
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, stats.total)} of {stats.total}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default TransactionHistory


