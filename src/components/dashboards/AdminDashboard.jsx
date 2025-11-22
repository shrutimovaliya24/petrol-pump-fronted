'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPumps: 0,
    totalTransactions: 0,
    totalUsers: 0,
    totalGifts: 0,
  })
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    revenue: 0,
    transactions: 0,
    avgOrder: 0,
    growth: 0,
  })
  const [performanceMetrics, setPerformanceMetrics] = useState({
    transactions: 0,
    avgOrder: 0,
    growth: 0,
  })
  const [salesChartData, setSalesChartData] = useState(null)
  const [performanceChartData, setPerformanceChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7days')
  const [performancePeriod, setPerformancePeriod] = useState('thisMonth')

  useEffect(() => {
    fetchDashboardStats()
    fetchAnalytics()
    fetchPerformanceMetrics()
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats()
      fetchAnalytics()
      fetchPerformanceMetrics()
    }, 30000)
    return () => clearInterval(interval)
  }, [analyticsPeriod, performancePeriod])

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Fetch all transactions for analytics
      const transactionsRes = await axios.get(`/api/admin/transactions?limit=10000`)
      
      if (transactionsRes.data.success) {
        const transactions = transactionsRes.data.data || []
        
        // Calculate analytics based on period
        const now = new Date()
        let startDate = new Date()
        
        if (analyticsPeriod === '7days') {
          startDate.setDate(now.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
        } else if (analyticsPeriod === '30days') {
          startDate.setDate(now.getDate() - 30)
          startDate.setHours(0, 0, 0, 0)
        } else if (analyticsPeriod === '90days') {
          startDate.setDate(now.getDate() - 90)
          startDate.setHours(0, 0, 0, 0)
        }

        const periodTransactions = transactions.filter(t => {
          if (!t.createdAt) return false
          const tDate = new Date(t.createdAt)
          return tDate >= startDate && t.status === 'Completed'
        })

        const totalSales = periodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const revenue = totalSales // Revenue is the same as total sales for completed transactions

        // Calculate growth (compare with previous period)
        const prevStartDate = new Date(startDate)
        const periodDays = (now - startDate) / (1000 * 60 * 60 * 24)
        prevStartDate.setDate(prevStartDate.getDate() - periodDays)
        
        const prevTransactions = transactions.filter(t => {
          if (!t.createdAt) return false
          const tDate = new Date(t.createdAt)
          return tDate >= prevStartDate && tDate < startDate && t.status === 'Completed'
        })
        const prevSales = prevTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const growth = prevSales > 0 ? ((totalSales - prevSales) / prevSales * 100) : (totalSales > 0 ? 100 : 0)

        setAnalytics({
          totalSales,
          revenue,
          transactions: periodTransactions.length,
          avgOrder: periodTransactions.length > 0 ? Math.round(totalSales / periodTransactions.length) : 0,
          growth: Math.round(growth * 10) / 10,
        })

        // Create chart data for Sales Overview
        const days = analyticsPeriod === '7days' ? 7 : analyticsPeriod === '30days' ? 30 : 90
        const labels = []
        const salesData = []
        const revenueData = []

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)

          const dayTransactions = transactions.filter(t => {
            if (!t.createdAt) return false
            const tDate = new Date(t.createdAt)
            return tDate >= date && tDate < nextDate && t.status === 'Completed'
          })

          const daySales = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
          
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
          salesData.push(daySales)
          revenueData.push(daySales)
        }

        setSalesChartData({
          labels,
          datasets: [
            {
              label: 'Sales',
              data: salesData,
              borderColor: 'rgb(2, 132, 199)',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Revenue',
              data: revenueData,
              borderColor: 'rgb(14, 165, 233)',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      // Fetch all transactions for performance metrics
      const transactionsRes = await axios.get(`/api/admin/transactions?limit=10000`)
      
      if (transactionsRes.data.success) {
        const transactions = transactionsRes.data.data || []
        
        // Calculate performance metrics based on period
        const now = new Date()
        let startDate = new Date()
        let endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        
        if (performancePeriod === 'thisMonth') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
        } else if (performancePeriod === 'lastMonth') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        } else if (performancePeriod === 'thisYear') {
          startDate = new Date(now.getFullYear(), 0, 1)
          startDate.setHours(0, 0, 0, 0)
        }

        const periodTransactions = transactions.filter(t => {
          if (!t.createdAt) return false
          const tDate = new Date(t.createdAt)
          return tDate >= startDate && tDate <= endDate && t.status === 'Completed'
        })

        const totalSales = periodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const avgOrder = periodTransactions.length > 0 ? totalSales / periodTransactions.length : 0

        // Calculate growth (compare with previous period)
        let prevStartDate, prevEndDate
        if (performancePeriod === 'thisMonth') {
          prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          prevStartDate.setHours(0, 0, 0, 0)
          prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        } else if (performancePeriod === 'lastMonth') {
          prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          prevStartDate.setHours(0, 0, 0, 0)
          prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
        } else if (performancePeriod === 'thisYear') {
          prevStartDate = new Date(now.getFullYear() - 1, 0, 1)
          prevStartDate.setHours(0, 0, 0, 0)
          prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
        }
        
        const prevTransactions = transactions.filter(t => {
          if (!t.createdAt) return false
          const tDate = new Date(t.createdAt)
          return tDate >= prevStartDate && tDate <= prevEndDate && t.status === 'Completed'
        })
        const prevSales = prevTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const growth = prevSales > 0 ? ((totalSales - prevSales) / prevSales * 100) : (totalSales > 0 ? 100 : 0)

        setPerformanceMetrics({
          transactions: periodTransactions.length,
          avgOrder: Math.round(avgOrder),
          growth: Math.round(growth * 10) / 10,
        })

        // Create chart data for Performance Metrics
        const prevAvgOrder = prevTransactions.length > 0 
          ? Math.round(prevTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / prevTransactions.length)
          : 0

        setPerformanceChartData({
          labels: ['Transactions', 'Avg. Order', 'Growth %'],
          datasets: [
            {
              label: 'Current Period',
              data: [
                periodTransactions.length,
                Math.round(avgOrder),
                Math.round(growth * 10) / 10,
              ],
              backgroundColor: [
                'rgba(2, 132, 199, 0.6)',
                'rgba(14, 165, 233, 0.6)',
                growth >= 0 ? 'rgba(2, 132, 199, 0.6)' : 'rgba(239, 68, 68, 0.6)',
              ],
              borderColor: [
                'rgba(2, 132, 199, 1)',
                'rgba(14, 165, 233, 1)',
                growth >= 0 ? 'rgba(2, 132, 199, 1)' : 'rgba(239, 68, 68, 1)',
              ],
              borderWidth: 1,
            },
            {
              label: 'Previous Period',
              data: [
                prevTransactions.length,
                prevAvgOrder,
                0,
              ],
              backgroundColor: [
                'rgba(2, 132, 199, 0.3)',
                'rgba(14, 165, 233, 0.3)',
                'rgba(156, 163, 175, 0.3)',
              ],
              borderColor: [
                'rgba(2, 132, 199, 0.5)',
                'rgba(14, 165, 233, 0.5)',
                'rgba(156, 163, 175, 0.5)',
              ],
              borderWidth: 1,
            },
          ],
        })
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchAnalytics(),
        fetchPerformanceMetrics()
      ])
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-display">Admin Dashboard</h1>
          <p className="text-caption mt-0.5 sm:mt-1">System overview and analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          <span className="sm:hidden">{refreshing ? '...' : '↻'}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Total Pumps</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalPumps || 0}</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">⛽</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Transactions</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalTransactions || 0}</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Total Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption mb-0.5">Total Gifts</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalGifts || 0}</p>
            </div>
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">🎁</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="card p-2 sm:p-3 md:p-4 lg:p-6">
        <h2 className="text-heading mb-2 sm:mb-3 md:mb-4">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {/* Sales Overview Chart */}
          <div className="border border-gray-100 rounded-lg p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
              <h3 className="text-subheading">Sales Overview</h3>
              <select 
                value={analyticsPeriod}
                onChange={(e) => setAnalyticsPeriod(e.target.value)}
                className="text-xs sm:text-sm border border-gray-200 rounded px-2 py-1 sm:px-3 sm:py-1.5 w-full sm:w-auto bg-white"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
            <div className="h-32 sm:h-40 md:h-48 lg:h-56">
              {salesChartData ? (
                <Line
                  data={salesChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          font: { size: 11 },
                          padding: 8,
                        },
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: { size: 10 },
                          callback: function(value) {
                            return '₹' + value.toLocaleString()
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: { size: 10 },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📈</div>
                    <p className="text-xs text-gray-500">Loading...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
              <div className="text-center p-1.5 sm:p-2 md:p-3 bg-primary-50 rounded-lg">
                <p className="text-caption">Total Sales</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-primary-600">₹{analytics.totalSales.toLocaleString()}</p>
              </div>
              <div className="text-center p-1.5 sm:p-2 md:p-3 bg-primary-50 rounded-lg">
                <p className="text-caption">Revenue</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-primary-700">₹{analytics.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics Chart */}
          <div className="border border-gray-100 rounded-lg p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
              <h3 className="text-subheading">Performance</h3>
              <select 
                value={performancePeriod}
                onChange={(e) => setPerformancePeriod(e.target.value)}
                className="text-xs sm:text-sm border border-gray-200 rounded px-2 py-1 sm:px-3 sm:py-1.5 w-full sm:w-auto bg-white"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>
            <div className="h-32 sm:h-40 md:h-48 lg:h-56">
              {performanceChartData ? (
                <Bar
                  data={performanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          font: { size: 11 },
                          padding: 8,
                        },
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: { size: 10 },
                          callback: function(value, index) {
                            if (index === 2) {
                              return value + '%'
                            }
                            return value
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: { size: 10 },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <p className="text-xs text-gray-500">Loading...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 sm:mt-3 grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2">
              <div className="text-center p-1 sm:p-1.5 md:p-2 bg-primary-50 rounded-lg">
                <p className="text-caption">Transactions</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-primary-600">{performanceMetrics.transactions}</p>
              </div>
              <div className="text-center p-1 sm:p-1.5 md:p-2 bg-primary-50 rounded-lg">
                <p className="text-caption">Avg. Order</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-primary-600">₹{performanceMetrics.avgOrder.toLocaleString()}</p>
              </div>
              <div className="text-center p-1 sm:p-1.5 md:p-2 bg-primary-50 rounded-lg">
                <p className="text-caption">Growth</p>
                <p className={`text-xs sm:text-sm md:text-base font-bold ${performanceMetrics.growth >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
                  {performanceMetrics.growth >= 0 ? '+' : ''}{performanceMetrics.growth}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
