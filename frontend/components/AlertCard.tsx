'use client'

import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface AlertCardProps {
  alert: any
  onUpdate: () => void
}

export default function AlertCard({ alert, onUpdate }: AlertCardProps) {
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'CRITICAL_STOCK':
        return 'bg-red-100 border-red-300 text-red-900'
      case 'LOW_STOCK':
      case 'REORDER_NEEDED':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900'
      case 'OVERSTOCK':
        return 'bg-blue-100 border-blue-300 text-blue-900'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900'
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) return 'bg-red-500 text-white'
    if (priority >= 5) return 'bg-yellow-500 text-white'
    return 'bg-blue-500 text-white'
  }

  const handleAcknowledge = async () => {
    try {
      await apiClient.updateAlertStatus(alert.id, 'ACKNOWLEDGED')
      onUpdate()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const handleDismiss = async () => {
    try {
      await apiClient.dismissAlert(alert.id)
      onUpdate()
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${getAlertTypeColor(alert.alertType)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{alert.product?.name || 'Unknown'}</h3>
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${getPriorityBadge(alert.priority)}`}>
                P{alert.priority}
              </span>
            </div>
            <p className="text-sm mb-2">{alert.message}</p>
            <p className="text-xs opacity-75">
              {alert.alertType.replace(/_/g, ' ')} • {alert.status}
            </p>
          </div>
        </div>
        
        {alert.status === 'ACTIVE' && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleAcknowledge}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title="Acknowledge"
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}









