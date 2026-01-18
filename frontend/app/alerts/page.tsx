'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api'
import AlertCard from '@/components/AlertCard'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ACTIVE')

  useEffect(() => {
    fetchAlerts()
    fetchStatistics()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      const data = await apiClient.getAlerts(filter === 'ALL' ? undefined : filter)
      setAlerts(data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const data = await apiClient.getAlertStatistics()
      setStatistics(data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handleGenerateAlerts = async () => {
    try {
      await apiClient.generateAlerts()
      await fetchAlerts()
      await fetchStatistics()
    } catch (error) {
      console.error('Error generating alerts:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage inventory alerts
          </p>
        </div>
        <button
          onClick={handleGenerateAlerts}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw size={20} />
          Generate Alerts
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Alerts</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.total}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {statistics.byStatus.active}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Acknowledged</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {statistics.byStatus.acknowledged}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">High Priority</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {statistics.highPriority}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  filter === status
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onUpdate={fetchAlerts}
                />
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No alerts found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}









