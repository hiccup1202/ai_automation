'use client'

import { X, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'

interface ProductDetailModalProps {
  product: any
  onClose: () => void
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const currentStock = product.currentStock || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="text-primary-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badges */}
          <div className="flex gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded ${
              product.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
            {product.category && (
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                {product.category}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Stock Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package size={16} />
              Stock Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentStock}</p>
                <p className="text-xs text-gray-500 mt-1">units available</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Min Stock Level</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{product.minStockLevel}</p>
                <p className="text-xs text-gray-500 mt-1">safety stock</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Max Stock Level</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{product.maxStockLevel}</p>
                <p className="text-xs text-gray-500 mt-1">capacity limit</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Reorder Point</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{product.reorderPoint}</p>
                <p className="text-xs text-gray-500 mt-1">trigger level</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Reorder Quantity</p>
                  <p className="text-xs text-gray-500 mt-1">Amount to order when stock is low</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{product.reorderQuantity}</p>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign size={16} />
              Pricing Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Selling Price</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${Number(product.price).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Cost Price</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  ${Number(product.cost || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {product.cost ? ((((product.price - product.cost) / product.price) * 100).toFixed(1)) : '0'}%
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Inventory Value</p>
                  <p className="text-xs text-gray-500 mt-1">Cost × Current Stock</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${(Number(product.cost || 0) * currentStock).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Status Alert */}
          {currentStock <= product.minStockLevel && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-900">Critical Stock Level</p>
                <p className="text-sm text-red-700 mt-1">
                  Current stock ({currentStock}) is below minimum level ({product.minStockLevel}). 
                  Please reorder {product.reorderQuantity} units immediately.
                </p>
              </div>
            </div>
          )}

          {currentStock > product.minStockLevel && currentStock <= product.reorderPoint && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-yellow-900">Low Stock Warning</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Current stock ({currentStock}) has reached the reorder point ({product.reorderPoint}). 
                  Consider ordering {product.reorderQuantity} units soon.
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Product ID</p>
                <p className="font-medium text-gray-900 mt-1 font-mono text-xs">{product.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Created At</p>
                <p className="font-medium text-gray-900 mt-1">
                  {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900 mt-1">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}






