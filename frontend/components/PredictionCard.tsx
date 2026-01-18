'use client'

import { TrendingUp, Calendar, AlertTriangle, Package, Clock } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

interface PredictionCardProps {
  prediction: any
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const [currentStock, setCurrentStock] = useState<number>(0)
  
  useEffect(() => {
    fetchCurrentStock()
  }, [prediction.productId])

  const fetchCurrentStock = async () => {
    try {
      const stockData = await apiClient.getCurrentStock()
      const productStock = stockData.find((s: any) => s.productId === prediction.productId)
      setCurrentStock(productStock?.currentStock || 0)
    } catch (error) {
      console.error('Error fetching stock:', error)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600 bg-green-100'
    if (confidence >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  // Calculate daily demand rate
  const dailyDemand = prediction.daysAhead > 0 ? prediction.predictedDemand / prediction.daysAhead : 0

  // Calculate when stock will hit reorder point and minimum level
  const product = prediction.product
  const minLevel = product?.minStockLevel || 0
  const reorderPoint = product?.reorderPoint || 0
  
  const daysUntilReorder = dailyDemand > 0 ? Math.floor((currentStock - reorderPoint) / dailyDemand) : Infinity
  const daysUntilCritical = dailyDemand > 0 ? Math.floor((currentStock - minLevel) / dailyDemand) : Infinity

  const reorderDate = daysUntilReorder > 0 ? addDays(new Date(), daysUntilReorder) : null
  const criticalDate = daysUntilCritical > 0 ? addDays(new Date(), daysUntilCritical) : null

  const getStockStatus = () => {
    if (currentStock <= minLevel) return { text: 'Critical', color: 'bg-red-100 text-red-800', icon: '🔴' }
    if (currentStock <= reorderPoint) return { text: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }
    return { text: 'Good', color: 'bg-green-100 text-green-800', icon: '🟢' }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {prediction.product?.name || 'Unknown Product'}
          </h3>
          <p className="text-sm text-gray-500">
            SKU: {prediction.product?.sku || 'N/A'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
            {prediction.confidence.toFixed(1)}% confidence
          </div>
          <span className={`px-3 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
            {stockStatus.icon} {stockStatus.text}
          </span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Package size={16} />
            <span>Current Stock</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currentStock}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
            <TrendingUp size={16} />
            <span>Predicted ({prediction.daysAhead}d)</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {prediction.predictedDemand}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
            <Calendar size={16} />
            <span>Daily Rate</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {dailyDemand.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Alert Predictions */}
      <div className="space-y-3 mb-4">
        {/* Reorder Point Alert */}
        {reorderDate && daysUntilReorder > 0 && daysUntilReorder < 30 ? (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 text-sm">
                ⚠️ Low Stock Alert Expected
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Stock will hit reorder point ({reorderPoint} units) in approximately <strong>{daysUntilReorder} days</strong>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                📅 Around {format(reorderDate, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        ) : currentStock <= reorderPoint ? (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 text-sm">
                ⚠️ Already at Reorder Point!
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Current stock ({currentStock}) is at or below reorder point ({reorderPoint})
              </p>
            </div>
          </div>
        ) : null}

        {/* Critical Level Alert */}
        {criticalDate && daysUntilCritical > 0 && daysUntilCritical < 30 ? (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Clock className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-red-900 text-sm">
                🔴 Critical Alert Expected
              </p>
              <p className="text-xs text-red-700 mt-1">
                Stock will hit critical level ({minLevel} units) in approximately <strong>{daysUntilCritical} days</strong>
              </p>
              <p className="text-xs text-red-600 mt-1">
                📅 Around {format(criticalDate, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        ) : currentStock <= minLevel ? (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-red-900 text-sm">
                🔴 CRITICAL! Stock Below Minimum
              </p>
              <p className="text-xs text-red-700 mt-1">
                Current stock ({currentStock}) is below minimum level ({minLevel}). Order immediately!
              </p>
            </div>
          </div>
        ) : null}

        {/* All Good */}
        {currentStock > reorderPoint && daysUntilReorder > 30 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✅ Stock levels are healthy. No alerts expected in next 30 days.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
        <div>
          Data points: {prediction.metadata?.historicalDataPoints || 0}
        </div>
        <div>
          Forecast: {format(new Date(prediction.predictionDate), 'MMM dd, yyyy')}
        </div>
      </div>
    </div>
  )
}



