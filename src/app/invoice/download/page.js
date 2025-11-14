'use client'

import { useState } from 'react'
import axios from 'axios'

export default function MobileInvoiceDownload() {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transaction, setTransaction] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setTransaction(null)
    
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number')
      return
    }

    setLoading(true)
    try {
      // Fetch transaction by invoice number
      const response = await axios.get(`/api/transactions/invoice/${encodeURIComponent(invoiceNumber.trim())}`)
      
      if (response.data.success && response.data.data) {
        setTransaction(response.data.data)
        setError('')
      } else {
        setError('Invoice not found. Please check the invoice number.')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setError(error.response?.data?.message || 'Invoice not found. Please check the invoice number.')
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoicePDF = async () => {
    if (!transaction) return

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Download Invoice</h1>
          <p className="text-gray-600 text-sm">Enter your invoice number to download</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter invoice number"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Searching...' : 'Search Invoice'}
          </button>
        </form>

        {transaction && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-medium mb-1">Invoice Found!</p>
              <p className="text-xs text-green-700">Invoice: {transaction.invoiceNumber}</p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{transaction.userId?.email || transaction.customerEmail || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">₹{transaction.amount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={downloadInvoicePDF}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

