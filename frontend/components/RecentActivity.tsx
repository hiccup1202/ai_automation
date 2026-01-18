'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { format } from 'date-fns'

export default function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const data = await apiClient.getLowStockProducts()
      setActivities(data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.name}
            </p>
            <p className="text-xs text-gray-500">
              Stock: {activity.currentStock} / Reorder: {activity.reorderPoint}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}









