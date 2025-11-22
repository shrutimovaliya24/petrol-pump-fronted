'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '../../../../context/AuthContext'
import axios from 'axios'

export default function InvoicePage() {
  const params = useParams()
  const { user } = useAuth()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id && user?.id) {
      fetchTransaction()
    }
  }, [params.id, user])

  const fetchTransaction = async () => {
    try {
      // Get transaction by ID with employerId
      const response = await axios.get(`/api/employer/transactions?transactionId=${params.id}&employerId=${user.id}`)
      if (response.data.success) {
        setTransaction(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Invoice not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8 print:p-4">
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .print-page {
            page-break-after: always;
          }
        }
      `}</style>
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-3 sm:pb-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Petrol Pump Management System</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">Fuel Invoice</p>
        </div>

        {/* Invoice Details */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <p className="text-caption mb-1">Invoice Number</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{transaction.invoiceNumber || 'N/A'}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-caption mb-1">Date & Time</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{formatDate(transaction.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="border-t border-b border-gray-300 py-3 sm:py-4 mb-4 sm:mb-6">
          <h2 className="text-heading mb-3 sm:mb-4">Customer Details</h2>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-body text-gray-600">Customer Email:</span>
              <span className="text-body font-medium text-gray-900">
                {transaction.userId?.email || transaction.customerEmail || 'N/A'}
              </span>
            </div>
            {transaction.customerName && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-body text-gray-600">Customer Name:</span>
                <span className="text-body font-medium text-gray-900">{transaction.customerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="border-t border-b border-gray-300 py-3 sm:py-4 mb-4 sm:mb-6">
          <h2 className="text-heading mb-3 sm:mb-4">Transaction Details</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-body text-gray-600">Pump:</span>
              <span className="text-body font-medium text-gray-900">
                {transaction.pumpId?.name || transaction.pumpDetails || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-body text-gray-600">Amount:</span>
              <span className="text-body sm:text-lg md:text-xl font-bold text-gray-900">₹{transaction.amount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-body text-gray-600">Liters:</span>
              <span className="text-body font-medium text-gray-900">{transaction.liters || 0}L</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-body text-gray-600">Payment Mode:</span>
              <span className="text-body font-medium text-gray-900">
                {transaction.payment || transaction.paymentType || 'Cash'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-body text-gray-600">Reward Points:</span>
              <span className="text-body sm:text-lg font-bold text-green-600">{transaction.rewardPoints || 0} pts</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-3 sm:pt-4 mt-4 sm:mt-6">
          <div className="text-center text-caption text-gray-600">
            <p>Thank you for your business!</p>
          
          </div>
        </div>

        {/* Print Button (hidden when printing) */}
        <div className="no-print mt-6 sm:mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="btn-primary px-4 sm:px-6 py-2 sm:py-3"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

