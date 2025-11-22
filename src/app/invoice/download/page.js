'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function MobileInvoiceDownload() {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [fuelType, setFuelType] = useState('PETROL')
  const [price, setPrice] = useState('')
  const [liters, setLiters] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [transaction, setTransaction] = useState(null)
  const [settings, setSettings] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  // Get userId from URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlUserId = params.get('userId')
      if (urlUserId) {
        setUserId(urlUserId)
      }
    }
  }, [])

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/admin/settings')
        if (response.data.success && response.data.data) {
          setSettings(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Fetch user's latest transaction when userId is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !settings) return

      setFetching(true)
      setError('')
      
      try {
        // Fetch user's transactions
        const response = await axios.get(`/api/user/transactions?userId=${userId}`)
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // Get the latest transaction
          const latestTransaction = response.data.data[0]
          setTransaction(latestTransaction)
          
          // Set user info
          if (latestTransaction.userId) {
            setUserInfo({
              name: latestTransaction.userId.name || latestTransaction.userId.email?.split('@')[0] || 'Customer',
              email: latestTransaction.userId.email || '',
              phone: latestTransaction.userId.phone || ''
            })
          }
          
          // Auto-populate invoice number from latest transaction
          if (latestTransaction.invoiceNumber) {
            setInvoiceNumber(latestTransaction.invoiceNumber)
          }
          
          // Populate fuel type
          if (latestTransaction.pumpId?.fuelTypes && latestTransaction.pumpId.fuelTypes.length > 0) {
            setFuelType(latestTransaction.pumpId.fuelTypes[0])
          } else if (latestTransaction.pumpId?.fuelType) {
            setFuelType(latestTransaction.pumpId.fuelType)
          }
          
          // Get price from settings based on fuel type
          const fuelTypeUpper = (latestTransaction.pumpId?.fuelTypes?.[0] || latestTransaction.pumpId?.fuelType || 'PETROL').toUpperCase()
          let pricePerLiter = 0
          if (fuelTypeUpper === 'PETROL') {
            pricePerLiter = settings.petrolPrice || 0
          } else if (fuelTypeUpper === 'DIESEL') {
            pricePerLiter = settings.dieselPrice || 0
          } else if (fuelTypeUpper === 'LPG') {
            pricePerLiter = settings.lpgPrice || 0
          } else if (fuelTypeUpper === 'CNG') {
            pricePerLiter = settings.cngPrice || 0
          }
          
          setPrice(pricePerLiter > 0 ? pricePerLiter.toString() : (latestTransaction.amount && latestTransaction.liters ? (latestTransaction.amount / latestTransaction.liters).toFixed(2) : ''))
          setLiters(latestTransaction.liters ? latestTransaction.liters.toString() : '')
        } else {
          setError('No transactions found for this user')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Unable to load user data. Please enter details manually.')
      } finally {
        setFetching(false)
      }
    }

    fetchUserData()
  }, [userId, settings])

  // Fetch transaction when invoice number changes manually
  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!invoiceNumber.trim()) {
        // Don't fetch if invoice number is empty
        return
      }

      setFetching(true)
      setError('')
      
      try {
        const response = await axios.get(`/api/transactions/invoice/${encodeURIComponent(invoiceNumber.trim())}`)
        
        if (response.data.success && response.data.data) {
          const transactionData = response.data.data
          setTransaction(transactionData)
          
          // Populate userInfo from transaction data
          if (transactionData.userId) {
            setUserInfo({
              name: transactionData.userId.name || transactionData.userId.email?.split('@')[0] || 'Customer',
              email: transactionData.userId.email || '',
              phone: transactionData.userId.phone || ''
            })
          }
          
          // Populate fields from database
          if (transactionData.pumpId?.fuelTypes && transactionData.pumpId.fuelTypes.length > 0) {
            setFuelType(transactionData.pumpId.fuelTypes[0])
          } else if (transactionData.pumpId?.fuelType) {
            setFuelType(transactionData.pumpId.fuelType)
          }
          
          // Get price from settings based on fuel type
          const fuelTypeUpper = (transactionData.pumpId?.fuelTypes?.[0] || transactionData.pumpId?.fuelType || 'PETROL').toUpperCase()
          let pricePerLiter = 0
          if (settings) {
            if (fuelTypeUpper === 'PETROL') {
              pricePerLiter = settings.petrolPrice || 0
            } else if (fuelTypeUpper === 'DIESEL') {
              pricePerLiter = settings.dieselPrice || 0
            } else if (fuelTypeUpper === 'LPG') {
              pricePerLiter = settings.lpgPrice || 0
            } else if (fuelTypeUpper === 'CNG') {
              pricePerLiter = settings.cngPrice || 0
            }
          }
          
          setPrice(pricePerLiter > 0 ? pricePerLiter.toString() : (transactionData.amount && transactionData.liters ? (transactionData.amount / transactionData.liters).toFixed(2) : ''))
          setLiters(transactionData.liters ? transactionData.liters.toString() : '')
        } else {
          setTransaction(null)
          setError('Invoice not found')
        }
      } catch (error) {
        console.error('Error fetching transaction:', error)
        setTransaction(null)
        setError('Invoice not found. Please check the invoice number.')
      } finally {
        setFetching(false)
      }
    }

    // Debounce the fetch
    const timeoutId = setTimeout(fetchTransactionData, 500)
    return () => clearTimeout(timeoutId)
  }, [invoiceNumber, settings, userId])

  // Update price when fuel type changes
  useEffect(() => {
    if (settings && fuelType) {
      const fuelTypeUpper = fuelType.toUpperCase()
      let pricePerLiter = 0
      
      if (fuelTypeUpper === 'PETROL') {
        pricePerLiter = settings.petrolPrice || 0
      } else if (fuelTypeUpper === 'DIESEL') {
        pricePerLiter = settings.dieselPrice || 0
      } else if (fuelTypeUpper === 'LPG') {
        pricePerLiter = settings.lpgPrice || 0
      } else if (fuelTypeUpper === 'CNG') {
        pricePerLiter = settings.cngPrice || 0
      }
      
      if (pricePerLiter > 0) {
        setPrice(pricePerLiter.toString())
      }
    }
  }, [fuelType, settings])

  const downloadInvoicePDF = async () => {
    if (!invoiceNumber.trim()) {
      setError('Please enter invoice number')
      return
    }

    if (!fuelType) {
      setError('Please select fuel type')
      return
    }

    if (!price.trim() || parseFloat(price) <= 0) {
      setError('Please enter valid price')
      return
    }

    if (!liters.trim() || parseFloat(liters) <= 0) {
      setError('Please enter valid liters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const totalBill = parseFloat(liters) * parseFloat(price)
      // Better customer name extraction - try multiple sources
      const customerName = userInfo?.name || 
                          transaction?.customerName || 
                          transaction?.userId?.name || 
                          transaction?.userId?.email?.split('@')[0] || 
                          userInfo?.email?.split('@')[0] || 
                          'Customer'

      // Load html2pdf library dynamically
      if (!window.html2pdf) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        script.onload = () => generatePDF(customerName, fuelType, parseFloat(liters), parseFloat(price), totalBill)
        document.head.appendChild(script)
      } else {
        generatePDF(customerName, fuelType, parseFloat(liters), parseFloat(price), totalBill)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      setError('Error downloading invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = (customerName, selectedFuelType, enteredLiters, pricePerLiter, totalBill) => {
    // Create invoice HTML element - styled design
    const invoiceDiv = document.createElement('div')
    invoiceDiv.style.padding = '25px'
    invoiceDiv.style.fontFamily = "'Segoe UI', Arial, sans-serif"
    invoiceDiv.style.width = '100%'
    invoiceDiv.style.backgroundColor = '#ffffff'
    invoiceDiv.style.fontSize = '14px'
    invoiceDiv.style.color = '#1f2937'
    
    invoiceDiv.innerHTML = `
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: 0.5px;">Petrol Pump Management System</h1>
          <p style="margin: 5px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.95); font-weight: 500;">Fuel Invoice</p>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Invoice Number:</span>
          <span style="font-weight: 700; color: #1e293b; font-size: 14px;">${invoiceNumber || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Date & Time:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">${formatDate(transaction?.createdAt || new Date())}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Payment Mode:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">${transaction?.payment || transaction?.paymentType || 'Cash'}</span>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">Customer Details</h2>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Name:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">${customerName || 'N/A'}</span>
        </div>
        ${userInfo?.email || transaction?.userId?.email || transaction?.customerEmail ? `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #e2e8f0; margin-top: 6px;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Email:</span><span style="font-weight: 600; color: #1e293b; font-size: 14px;">${userInfo?.email || transaction?.userId?.email || transaction?.customerEmail}</span></div>` : ''}
        ${userInfo?.phone || transaction?.userId?.phone ? `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #e2e8f0; margin-top: 6px;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Phone:</span><span style="font-weight: 600; color: #1e293b; font-size: 14px;">${userInfo?.phone || transaction?.userId?.phone}</span></div>` : ''}
      </div>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">Transaction Details</h2>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Pump:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">${transaction?.pumpId?.name || transaction?.pumpId || transaction?.pumpDetails || transaction?.pumpName || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Fuel Type:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">${selectedFuelType}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Liters:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">${enteredLiters.toFixed(2)}L</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;">
          <span style="color: #64748b; font-size: 13px; font-weight: 600;">Price per Liter:</span>
          <span style="font-weight: 600; color: #1e293b; font-size: 14px;">₹${pricePerLiter.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 18px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #3b82f6; border-bottom: 2px solid #3b82f6; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #1e40af; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">Bill Summary</h2>
        <div style="background: white; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #bfdbfe; border-bottom: 3px solid #1e40af;">
          <span style="color: #1e40af; font-size: 20px; font-weight: 700;">Total Bill:</span>
          <span style="font-weight: 800; color: #1e40af; font-size: 24px;">₹${totalBill.toFixed(2)}</span>
        </div>
        ${transaction?.rewardPoints ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; margin-top: 8px; background: rgba(255,255,255,0.6); padding: 8px; border-radius: 4px; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Reward Points Earned:</span><span style="font-weight: 700; color: #059669; font-size: 14px;">${transaction.rewardPoints} pts</span></div>` : ''}
      </div>
      
      <div style="text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 20px;">
        <p style="margin: 0; font-weight: 600;">Thank you for your business!</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">We appreciate your trust in our services</p>
      </div>
    `

    // Get invoice number for filename
    const filename = `${invoiceNumber || 'Invoice'}.pdf`

    // Configure html2pdf options - optimized for full one page
    const opt = {
      margin: [3, 3, 3, 3],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    // Generate and download PDF
    window.html2pdf().set(opt).from(invoiceDiv).save()
  }

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
          {userInfo ? (
            <p className="text-gray-600 text-sm">Welcome, {userInfo.name || userInfo.email}</p>
          ) : (
            <p className="text-gray-600 text-sm">Enter invoice number to load details</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter invoice number (e.g., I-01)"
              required
            />
            {fetching && (
              <p className="text-xs text-blue-600 mt-1">Loading transaction data...</p>
            )}
          </div>

          <div>
            <label htmlFor="fuelType" className="block text-sm font-semibold text-gray-700 mb-2">
              Fuel Type <span className="text-red-500">*</span>
            </label>
            <select
              id="fuelType"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              required
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="LPG">LPG</option>
              <option value="CNG">CNG</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
              Price per Liter <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter price per liter"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="liters" className="block text-sm font-semibold text-gray-700 mb-2">
              Liters <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="liters"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter liters"
              min="0"
              step="0.01"
              required
            />
            {price && liters && parseFloat(price) > 0 && parseFloat(liters) > 0 && (
              <p className="text-sm font-semibold text-green-600 mt-1">
                Total Amount: ₹{(parseFloat(price) * parseFloat(liters)).toFixed(2)}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={downloadInvoicePDF}
            disabled={loading || !invoiceNumber.trim() || !fuelType || !price.trim() || !liters.trim()}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
