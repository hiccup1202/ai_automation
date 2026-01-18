'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [salesReport, setSalesReport] = useState<any>(null)
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [inventoryValue, setInventoryValue] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [sales, products, value] = await Promise.all([
        apiClient.getSalesReport(),
        apiClient.getTopProducts(10),
        apiClient.getInventoryValue(),
      ])
      setSalesReport(sales)
      setTopProducts(products)
      setInventoryValue(value)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const topProductsChartData = topProducts.slice(0, 6).map(item => ({
    name: item.product.name.length > 15 ? item.product.name.substring(0, 15) + '...' : item.product.name,
    quantity: item.totalQuantity,
    revenue: Number(item.totalRevenue)
  }))

  const revenueData = topProducts.slice(0, 5).map(item => ({
    name: item.product.name.length > 12 ? item.product.name.substring(0, 12) + '...' : item.product.name,
    value: Number(item.totalRevenue)
  }))

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
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${salesReport?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {salesReport?.totalSales || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {salesReport?.totalQuantity || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${inventoryValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Top Products by Units Sold
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#3b82f6" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            💰 Revenue Distribution (Top 5)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Comparison Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Revenue by Product
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={topProductsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Table (Compact) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Top 5 Products Details
          </h2>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{product.product.name}</div>
                    <div className="text-xs text-gray-500">{product.product.sku}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${product.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{product.totalQuantity} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Average Sale Value</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${salesReport?.averageSaleValue?.toFixed(2) || 0}
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {salesReport?.totalSales || 0}
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600">Period</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              All Time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



