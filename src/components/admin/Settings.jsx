'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const Settings = () => {
  const [settings, setSettings] = useState({
    // Company Info
    stationName: 'Fuel Station',
    address: '123 Main Street, City, State 12345',
    phone: '+91 98765 43210',
    email: 'admin@myfuel.com',
    // Fuel Prices
    petrolPrice: 0,
    dieselPrice: 0,
    lpgPrice: 0,
    cngPrice: 0,
    // Reward Calculation
    rewardMultiplier: 1,
    pointsPerLiter: 1, // Points per liter
  })
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/admin/settings')
        if (response.data.success && response.data.data) {
          const data = response.data.data
          // Filter out rewardFormula if it exists (legacy field)
          const { rewardFormula, ...cleanData } = data
          setSettings({
            stationName: cleanData.stationName || 'Fuel Station',
            address: cleanData.address || '',
            phone: cleanData.phone || '',
            email: cleanData.email || '',
            petrolPrice: cleanData.petrolPrice || 0,
            dieselPrice: cleanData.dieselPrice || 0,
            lpgPrice: cleanData.lpgPrice || 0,
            cngPrice: cleanData.cngPrice || 0,
            rewardMultiplier: cleanData.rewardMultiplier || 1,
            pointsPerLiter: cleanData.pointsPerLiter || 1,
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Save settings to backend
      await axios.post('/api/admin/settings', settings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64">
        <p className="text-body text-gray-600">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-display">Settings</h1>
        <p className="text-caption mt-1">Configure system settings and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
        {/* Company Information & Branding */}
        <div className="card p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg sm:text-xl md:text-2xl">🏢</span>
            </div>
            <h2 className="text-heading">Company Information & Branding</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Station Name
              </label>
              <input
                type="text"
                value={settings.stationName}
                onChange={(e) => setSettings({ ...settings, stationName: e.target.value })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Fuel Prices */}
        <div className="card p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-lg sm:text-xl md:text-2xl">⛽</span>
            </div>
            <h2 className="text-heading">Fuel Prices</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Petrol Price (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.petrolPrice}
                onChange={(e) => setSettings({ ...settings, petrolPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Diesel Price (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.dieselPrice}
                onChange={(e) => setSettings({ ...settings, dieselPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                LPG Price (₹/kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.lpgPrice}
                onChange={(e) => setSettings({ ...settings, lpgPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                CNG Price (₹/kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.cngPrice}
                onChange={(e) => setSettings({ ...settings, cngPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Reward Calculation Formula */}
        <div className="card p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg sm:text-xl md:text-2xl">⭐</span>
            </div>
            <h2 className="text-heading">Reward Calculation Formula</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Points Per Liter
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.pointsPerLiter}
                onChange={(e) => setSettings({ ...settings, pointsPerLiter: parseFloat(e.target.value) || 1 })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-caption mt-1">Number of points awarded per liter of fuel purchased (e.g., 1 point per liter)</p>
            </div>
            <div>
              <label className="block text-label mb-1 sm:mb-2">
                Reward Multiplier
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.rewardMultiplier}
                onChange={(e) => setSettings({ ...settings, rewardMultiplier: parseFloat(e.target.value) || 1 })}
                className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-caption mt-1">Multiplier applied to reward points calculation (e.g., 1.5 = 50% bonus points)</p>
            </div>
          </div>
        </div>


        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 sm:px-8 py-2 sm:py-2.5 md:py-3 flex items-center gap-2"
          >
            <span>💾</span>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings


