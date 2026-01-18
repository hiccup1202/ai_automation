'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

export default function InventoryChart() {
  const [stockData, setStockData] = useState<any[]>([])

  useEffect(() => {
    fetchStockData()
  }, [])

  const fetchStockData = async () => {
    try {
      const data = await apiClient.getCurrentStock()
      setStockData(data.slice(0, 8))
    } catch (error) {
      console.error('Error fetching stock data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-500'
      case 'LOW': return 'bg-yellow-500'
      case 'NORMAL': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {stockData.map((item) => (
        <div key={item.productId} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{item.name}</span>
            <span className="text-gray-600">{item.currentStock} units</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStatusColor(item.status)}`}
              style={{
                width: `${Math.min((item.currentStock / item.minStockLevel) * 50, 100)}%`
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}









