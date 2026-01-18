'use client'

import { useState, useEffect } from 'react'
import { X, Save, Package, TrendingUp, TrendingDown, RotateCcw, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface AddTransactionModalProps {
  onClose: () => void
  onSuccess: () => void
  preselectedProductId?: string
}

export default function AddTransactionModal({ onClose, onSuccess, preselectedProductId }: AddTransactionModalProps) {
  const [products, setProducts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    productId: preselectedProductId || '',
    transactionType: 'PURCHASE',
    quantity: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.productId) {
      setError('Please select a product')
      return
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    setLoading(true)

    try {
      await apiClient.createTransaction({
        productId: formData.productId,
        transactionType: formData.transactionType,
        quantity: Number(formData.quantity),
        notes: formData.notes || undefined,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <TrendingUp className="text-green-600" size={20} />
      case 'SALE':
        return <TrendingDown className="text-red-600" size={20} />
      case 'ADJUSTMENT':
        return <RotateCcw className="text-blue-600" size={20} />
      case 'RETURN':
        return <RefreshCw className="text-orange-600" size={20} />
      default:
        return <Package className="text-gray-600" size={20} />
    }
  }

  const getTransactionDescription = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'Receiving stock from supplier (adds inventory)'
      case 'SALE':
        return 'Selling to customer (removes inventory)'
      case 'ADJUSTMENT':
        return 'Manual correction for damage, loss, or found items'
      case 'RETURN':
        return 'Customer return (adds inventory)'
      default:
        return ''
    }
  }

  const selectedProduct = products.find(p => p.id === formData.productId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Inventory Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Select a product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-semibold text-gray-900">{selectedProduct.currentStock || 0} units</span>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, transactionType: type })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.transactionType === type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getTransactionIcon(type)}
                    <span className="font-semibold text-gray-900">{type}</span>
                  </div>
                  <p className="text-xs text-gray-600 text-left">
                    {getTransactionDescription(type)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.transactionType === 'PURCHASE' && '✅ This will ADD units to inventory'}
              {formData.transactionType === 'SALE' && '⚠️ This will REMOVE units from inventory'}
              {formData.transactionType === 'ADJUSTMENT' && '🔧 This will adjust inventory (use negative for removal)'}
              {formData.transactionType === 'RETURN' && '↩️ This will ADD returned units to inventory'}
            </p>
            {selectedProduct && formData.quantity && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">New Stock After Transaction:</span>
                  <span className="font-bold text-blue-600">
                    {formData.transactionType === 'SALE' 
                      ? Math.max(0, (selectedProduct.currentStock || 0) - Number(formData.quantity))
                      : (selectedProduct.currentStock || 0) + Number(formData.quantity)
                    } units
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Supplier invoice #12345, Customer order #67890, etc."
            />
          </div>

          {/* Examples */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">💡 Examples:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• <strong>PURCHASE:</strong> "Received 100 units from Supplier XYZ - Invoice #INV-2024-001"</p>
              <p>• <strong>SALE:</strong> "Sold 5 units to Customer ABC - Order #ORD-5678"</p>
              <p>• <strong>ADJUSTMENT:</strong> "Found 3 damaged items, removing from inventory"</p>
              <p>• <strong>RETURN:</strong> "Customer returned 2 defective units"</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}







