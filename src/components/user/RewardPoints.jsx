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
      <div className="flex items-center justify-center h-48 sm:h-64">
        <div className="text-body text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-display">Reward Points</h1>
        <p className="text-caption mt-1">Track your points and redeem gifts</p>
      </div>

      {/* Points Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption mb-1">Total Earned</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{pointsData.totalEarned || 0} pts</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
              <span className="text-lg sm:text-xl md:text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption mb-1">Total Redeemed</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{pointsData.totalRedeemed || 0} pts</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
              <span className="text-lg sm:text-xl md:text-2xl">🎁</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption mb-1">Available Balance</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{pointsData.availableBalance || 0} pts</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
              <span className="text-lg sm:text-xl md:text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Gifts */}
      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-heading">Available Gifts</h2>
          <p className="text-caption mt-1">Redeem your points for these gifts</p>
        </div>
        {availableGifts.length === 0 ? (
          <div className="p-6 sm:p-8 md:p-12 text-center text-gray-500 text-body">No gifts available for redemption</div>
        ) : (
          <div className="p-3 sm:p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {availableGifts.map((item) => {
              const gift = item.gift || item;
              const pointsRequired = item.pointsRequired || gift.pointsRequired;
              const canRedeem = pointsData.availableBalance >= pointsRequired && item.isAvailable;
              
              return (
                <div key={item._id || item.assignmentId} className="card-compact hover:shadow-md transition-shadow">
                  <h3 className="text-subheading mb-1 sm:mb-2">{gift.name}</h3>
                  <p className="text-body mb-2 sm:mb-3">{gift.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base sm:text-lg font-bold text-green-600">{pointsRequired} pts</span>
                    <button
                      onClick={() => handleRequestRedemption(item)}
                      disabled={!canRedeem}
                      className={`btn-primary text-xs sm:text-sm ${
                        !canRedeem
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
                          : ''
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
      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-heading">Redemption History</h2>
        </div>
        {redemptions.length === 0 ? (
          <div className="p-6 sm:p-8 md:p-12 text-center text-gray-500 text-body">No redemption requests yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Gift
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Points Used
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Request Date
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-label">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redemptions.map((redemption) => (
                  <tr key={redemption._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <div>
                        <p className="text-body font-medium">{redemption.giftId?.name || 'N/A'}</p>
                        <p className="text-caption">{redemption.giftId?.description}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body font-semibold">
                        {redemption.pointsUsed || redemption.giftId?.pointsRequired || 0} pts
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-body">{formatDate(redemption.createdAt)}</span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-caption font-semibold rounded-full ${getStatusColor(redemption.status)}`}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-2 sm:m-4">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-heading">Confirm Redemption</h2>
              <button
                onClick={() => {
                  setShowRedemptionModal(false)
                  setSelectedGift(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <p className="text-caption mb-1">Gift</p>
                <p className="text-subheading">{selectedGift.gift?.name || selectedGift.name}</p>
                <p className="text-body mt-1">{selectedGift.gift?.description || selectedGift.description}</p>
              </div>
              <div>
                <p className="text-caption mb-1">Points Required</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{selectedGift.pointsRequired || selectedGift.gift?.pointsRequired} pts</p>
              </div>
              <div>
                <p className="text-caption mb-1">Your Available Balance</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">{pointsData.availableBalance || 0} pts</p>
              </div>
              {pointsData.availableBalance < (selectedGift.pointsRequired || selectedGift.gift?.pointsRequired) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                  <p className="text-body text-red-600">
                    Insufficient points. You need {(selectedGift.pointsRequired || selectedGift.gift?.pointsRequired) - pointsData.availableBalance} more points.
                  </p>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  onClick={() => {
                    setShowRedemptionModal(false)
                    setSelectedGift(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedemption}
                  disabled={pointsData.availableBalance < selectedGift.pointsRequired}
                  className={`flex-1 btn-primary ${
                    pointsData.availableBalance >= selectedGift.pointsRequired
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
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

