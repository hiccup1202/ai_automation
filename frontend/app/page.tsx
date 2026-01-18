'use client'

import { useEffect, useState } from 'react'
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import { apiClient } from '@/lib/api'
import StatsCard from '@/components/StatsCard'
import AlertsList from '@/components/AlertsList'
import RecentActivity from '@/components/RecentActivity'
import InventoryChart from '@/components/InventoryChart'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.getDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to AI-Based Smart Inventory Automation System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={dashboardData?.products?.active || 0}
          icon={Package}
          color="blue"
          trend="+2.5%"
        />
        <StatsCard
          title="Active Alerts"
          value={dashboardData?.alerts?.active || 0}
          icon={AlertTriangle}
          color="red"
          trend="-5.2%"
        />
        <StatsCard
          title="Low Stock Items"
          value={dashboardData?.inventory?.lowStockItems || 0}
          icon={TrendingUp}
          color="yellow"
          trend="+3.1%"
        />
        <StatsCard
          title="Inventory Value"
          value={`$${dashboardData?.inventory?.totalValue?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
          trend="+8.7%"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Overview
          </h2>
          <InventoryChart />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <RecentActivity />
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Alerts
        </h2>
        <AlertsList />
      </div>
    </div>
  )
}








