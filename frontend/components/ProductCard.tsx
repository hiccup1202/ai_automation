'use client'

import { useState } from 'react'
import { Package, Eye, Edit, Trash2, DollarSign } from 'lucide-react'
import { apiClient } from '@/lib/api'
import ProductDetailModal from './ProductDetailModal'
import EditProductModal from './EditProductModal'

interface ProductCardProps {
  product: any
  onUpdate: () => void
}

export default function ProductCard({ product, onUpdate }: ProductCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Get current stock from inventory
  const currentStock = product.currentStock || 0
  
  // Calculate stock status
  const getStockStatus = () => {
    if (currentStock <= product.minStockLevel) return { text: 'Critical', color: 'bg-red-100 text-red-800' }
    if (currentStock <= product.reorderPoint) return { text: 'Low', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Good', color: 'bg-green-100 text-green-800' }
  }

  const stockStatus = getStockStatus()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return
    
    setDeleting(true)
    try {
      await apiClient.deleteProduct(product.id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              product.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${stockStatus.color}`}>
              {stockStatus.text}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-2 mb-4">
          {/* Current Stock - Most Important */}
          <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
            <span className="text-gray-600 font-medium">Current Stock:</span>
            <span className="font-bold text-gray-900">{currentStock} units</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium text-gray-900">${Number(product.price).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cost:</span>
            <span className="font-medium text-gray-900">${Number(product.cost || 0).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Min Stock:</span>
            <span className="font-medium text-gray-900">{product.minStockLevel}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Max Stock:</span>
            <span className="font-medium text-gray-900">{product.maxStockLevel}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reorder Point:</span>
            <span className="font-medium text-gray-900">{product.reorderPoint}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reorder Qty:</span>
            <span className="font-medium text-gray-900">{product.reorderQuantity}</span>
          </div>
        </div>

        {/* Category */}
        {product.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {product.category}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={() => setShowDetail(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Eye size={16} />
            View
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDetail && (
        <ProductDetailModal
          product={product}
          onClose={() => setShowDetail(false)}
        />
      )}

      {showEdit && (
        <EditProductModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            onUpdate()
          }}
        />
      )}
    </>
  )
}



