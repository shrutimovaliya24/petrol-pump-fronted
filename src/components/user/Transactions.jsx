'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const UserTransactions = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/user/transactions?userId=${user.id}`)
      if (response.data.success) {
        setTransactions(response.data.data || [])
      }
    } catch (error) {
      setTransactions([])
    } finally {
      setLoading(false)
    }
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
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-display">My Transactions</h1>
        <p className="text-caption mt-0.5 sm:mt-1">View all your fuel purchase transactions invoice-wise</p>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="card p-6 sm:p-8 md:p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl md:text-4xl">💰</span>
            </div>
            <p className="text-body font-medium">No transactions found</p>
            <p className="text-caption mt-1 sm:mt-2">You haven't made any transactions yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction._id} className="card p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Invoice #{transaction.invoiceNumber || 'N/A'}</h3>
                    <span className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                      {transaction.status || 'Completed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-caption">Pump / Employer</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {transaction.pumpId?.name || transaction.pumpDetails || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption">Amount Paid</p>
                      <p className="font-semibold text-gray-900">₹{transaction.amount?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-caption">Liters</p>
                      <p className="font-semibold text-gray-900">{transaction.liters || 0}L</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Type</p>
                      <p className="font-semibold text-gray-900">
                        {transaction.payment || transaction.paymentType || 'Cash'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span>📅 {formatDate(transaction.createdAt)}</span>
                    <span className="text-green-600 font-semibold">⭐ {transaction.rewardPoints || 0} Reward Points</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleViewInvoice(transaction)}
                      className="btn-primary text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      View Invoice
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice View Modal */}
      {showInvoiceModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-heading">Invoice Details</h2>
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setSelectedTransaction(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="text-center border-b border-gray-100 pb-3 sm:pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Fuel Invoice</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Invoice No: {selectedTransaction.invoiceNumber || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pump / Employer:</span>
                  <span className="text-gray-900">
                    {selectedTransaction.pumpId?.name || selectedTransaction.pumpDetails || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-900 font-semibold">₹{selectedTransaction.amount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Liters:</span>
                  <span className="text-gray-900">{selectedTransaction.liters || 0}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Mode:</span>
                  <span className="text-gray-900">
                    {selectedTransaction.payment || selectedTransaction.paymentType || 'Cash'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reward Points:</span>
                  <span className="text-green-600 font-semibold">{selectedTransaction.rewardPoints || 0} pts</span>
                </div>
              </div>


              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Print
                </button>
                <button
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setSelectedTransaction(null)
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

export default UserTransactions

