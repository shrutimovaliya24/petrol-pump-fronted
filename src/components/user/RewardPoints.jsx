'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const UserRewardPoints = () => {
  const { user } = useAuth()
  const [pointsData, setPointsData] = useState({
    totalEarned: 0,
    totalRedeemed: 0,
    availableBalance: 0,
  })
  const [redemptions, setRedemptions] = useState([])
  const [availableGifts, setAvailableGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRedemptionModal, setShowRedemptionModal] = useState(false)
  const [selectedGift, setSelectedGift] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchRewardPoints()
      fetchRedemptions()
      fetchAvailableGifts()
    }
  }, [user])

  const fetchRewardPoints = async () => {
    try {
      const response = await axios.get(`/api/user/reward-points?userId=${user.id}`)
      if (response.data.success) {
        setPointsData(response.data.data)
      }
    } catch (error) {
      // Error fetching reward points
    } finally {
      setLoading(false)
    }
  }

  const fetchRedemptions = async () => {
    try {
      const response = await axios.get(`/api/redemptions?userId=${user.id}`)
      if (response.data.success) {
        setRedemptions(response.data.data || [])
      }
    } catch (error) {
      // Error fetching redemptions
    }
  }

  const fetchAvailableGifts = async () => {
    try {
      const response = await axios.get(`/api/user/available-gifts?userId=${user.id}`)
      if (response.data.success) {
        setAvailableGifts(response.data.data || [])
      }
    } catch (error) {
      // Error fetching available gifts
    }
  }

  const handleRequestRedemption = (gift) => {
    setSelectedGift(gift)
    setShowRedemptionModal(true)
  }

  const handleConfirmRedemption = async () => {
    try {
      const response = await axios.post('/api/redemptions', {
        giftId: selectedGift._id || selectedGift.gift?._id,
        userId: user.id,
        pointsUsed: selectedGift.pointsRequired || selectedGift.gift?.pointsRequired,
        quantity: 1,
      })
      if (response.data.success) {
        alert('Redemption request submitted successfully! It is now pending approval.')
        setShowRedemptionModal(false)
        setSelectedGift(null)
        fetchRewardPoints()
        fetchRedemptions()
        fetchAvailableGifts()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting redemption. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reward Points</h1>
        <p className="text-gray-600 mt-1">Track your points and redeem gifts</p>
      </div>

      {/* Points Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Earned</p>
              <p className="text-3xl font-bold text-gray-900">{pointsData.totalEarned || 0} pts</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Redeemed</p>
              <p className="text-3xl font-bold text-gray-900">{pointsData.totalRedeemed || 0} pts</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">🎁</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">{pointsData.availableBalance || 0} pts</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Gifts */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Available Gifts</h2>
          <p className="text-sm text-gray-600 mt-1">Redeem your points for these gifts</p>
        </div>
        {availableGifts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No gifts available for redemption</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableGifts.map((item) => {
              const gift = item.gift || item;
              const pointsRequired = item.pointsRequired || gift.pointsRequired;
              const canRedeem = pointsData.availableBalance >= pointsRequired && item.isAvailable;
              
              return (
                <div key={item._id || item.assignmentId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{gift.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{gift.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">{pointsRequired} pts</span>
                    <button
                      onClick={() => handleRequestRedemption(item)}
                      disabled={!canRedeem}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        canRedeem
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemption History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Redemption History</h2>
        </div>
        {redemptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No redemption requests yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redemptions.map((redemption) => (
                  <tr key={redemption._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{redemption.giftId?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{redemption.giftId?.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {redemption.pointsUsed || redemption.giftId?.pointsRequired || 0} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{formatDate(redemption.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(redemption.status)}`}>
                        {redemption.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Redemption Confirmation Modal */}
      {showRedemptionModal && selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Confirm Redemption</h2>
              <button
                onClick={() => {
                  setShowRedemptionModal(false)
                  setSelectedGift(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gift</p>
                <p className="font-semibold text-gray-900">{selectedGift.gift?.name || selectedGift.name}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedGift.gift?.description || selectedGift.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Points Required</p>
                <p className="text-2xl font-bold text-green-600">{selectedGift.pointsRequired || selectedGift.gift?.pointsRequired} pts</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Available Balance</p>
                <p className="text-lg font-semibold text-gray-900">{pointsData.availableBalance || 0} pts</p>
              </div>
              {pointsData.availableBalance < (selectedGift.pointsRequired || selectedGift.gift?.pointsRequired) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">
                    Insufficient points. You need {(selectedGift.pointsRequired || selectedGift.gift?.pointsRequired) - pointsData.availableBalance} more points.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRedemptionModal(false)
                    setSelectedGift(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedemption}
                  disabled={pointsData.availableBalance < selectedGift.pointsRequired}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    pointsData.availableBalance >= selectedGift.pointsRequired
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Redemption
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRewardPoints

