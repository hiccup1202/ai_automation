'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { apiClient } from '@/lib/api'

export default function AlertsList() {
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const data = await apiClient.getActiveAlerts()
      setAlerts(data.slice(0, 5)) // Show only top 5
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No active alerts
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-4 border border-red-200 bg-red-50 rounded-lg"
        >
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{alert.message}</p>
            <p className="text-xs text-gray-600 mt-1">
              Priority: {alert.priority}/10
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}









