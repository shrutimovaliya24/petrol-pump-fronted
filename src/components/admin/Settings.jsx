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
    rewardFormula: 'amount / 100', // Points per ₹100
    rewardMultiplier: 1,
  })
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information & Branding */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Company Information & Branding</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Station Name
              </label>
              <input
                type="text"
                value={settings.stationName}
                onChange={(e) => setSettings({ ...settings, stationName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Fuel Prices */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⛽</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Fuel Prices</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Petrol Price (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.petrolPrice}
                onChange={(e) => setSettings({ ...settings, petrolPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Diesel Price (₹/L)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.dieselPrice}
                onChange={(e) => setSettings({ ...settings, dieselPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                LPG Price (₹/kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.lpgPrice}
                onChange={(e) => setSettings({ ...settings, lpgPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CNG Price (₹/kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.cngPrice}
                onChange={(e) => setSettings({ ...settings, cngPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reward Calculation Formula */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Reward Calculation Formula</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reward Formula
              </label>
              <input
                type="text"
                value={settings.rewardFormula}
                onChange={(e) => setSettings({ ...settings, rewardFormula: e.target.value })}
                placeholder="e.g., amount / 100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Formula to calculate reward points (e.g., amount / 100 = 1 point per ₹100)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reward Multiplier
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.rewardMultiplier}
                onChange={(e) => setSettings({ ...settings, rewardMultiplier: parseFloat(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Multiplier for reward points calculation</p>
            </div>
          </div>
        </div>


        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
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


