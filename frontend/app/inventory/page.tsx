'use client'

import { useEffect, useState } from 'react'
import { Plus, Package, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { apiClient } from '@/lib/api'
import AddTransactionModal from '@/components/AddTransactionModal'

export default function InventoryPage() {
  const [currentStock, setCurrentStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchCurrentStock()
  }, [])

  const fetchCurrentStock = async () => {
    try {
      const data = await apiClient.getCurrentStock()
      setCurrentStock(data)
    } catch (error) {
      console.error('Error fetching current stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (current: number, min: number, reorder: number) => {
    if (current <= min) {
      return { text: 'Critical', color: 'bg-red-100 text-red-800', icon: '🔴' }
    }
    if (current <= reorder) {
      return { text: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }
    }
    return { text: 'Good', color: 'bg-green-100 text-green-800', icon: '🟢' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-gray-600">View current stock levels and manage transactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{currentStock.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {currentStock.reduce((sum, item) => sum + (item.currentStock || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {currentStock.filter(item => 
                  item.currentStock <= (item.reorderPoint || 0)
                ).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingDown className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Items</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {currentStock.filter(item => 
                  item.currentStock <= (item.minStockLevel || 0)
                ).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <RotateCcw className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Current Stock Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Current Stock Levels</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentStock.map((item) => {
                  const status = getStockStatus(
                    item.currentStock,
                    item.minStockLevel || 0,
                    item.reorderPoint || 0
                  )
                  
                  return (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-primary-100 rounded-lg mr-3">
                            <Package className="text-primary-600" size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.name || 'Unknown'}
                            </div>
                            {item.category && (
                              <div className="text-xs text-gray-500">{item.category}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{item.currentStock}</div>
                        <div className="text-xs text-gray-500">units</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minStockLevel || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.reorderPoint || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.icon} {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Add Transaction
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {currentStock.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-gray-500">No products found</p>
            <p className="mt-2 text-sm text-gray-400">Add products to start tracking inventory</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchCurrentStock()
          }}
        />
      )}
    </div>
  )
}

