import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = {
  // Products
  getProducts: async () => {
    const response = await api.get('/products')
    return response.data
  },
  
  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },
  
  createProduct: async (data: any) => {
    const response = await api.post('/products', data)
    return response.data
  },
  
  updateProduct: async (id: string, data: any) => {
    const response = await api.patch(`/products/${id}`, data)
    return response.data
  },
  
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  // Inventory
  getCurrentStock: async () => {
    const response = await api.get('/inventory/current-stock')
    return response.data
  },
  
  createTransaction: async (data: any) => {
    const response = await api.post('/inventory/transaction', data)
    return response.data
  },
  
  getProductInventory: async (productId: string) => {
    const response = await api.get(`/inventory/product/${productId}`)
    return response.data
  },
  
  getLowStockProducts: async () => {
    const response = await api.get('/inventory/low-stock')
    return response.data
  },

  // Predictions
  generatePredictions: async () => {
    const response = await api.post('/predictions/generate')
    return response.data
  },
  
  trainAllModels: async () => {
    const response = await api.post('/predictions/train-all-models')
    return response.data
  },
  
  getPredictions: async (productId?: string) => {
    const url = productId ? `/predictions?productId=${productId}` : '/predictions'
    const response = await api.get(url)
    return response.data
  },
  
  getLatestPredictions: async () => {
    const response = await api.get('/predictions/latest')
    return response.data
  },
  
  getTrends: async () => {
    const response = await api.get('/predictions/trends')
    return response.data
  },

  // Alerts
  generateAlerts: async () => {
    const response = await api.post('/alerts/generate')
    return response.data
  },
  
  getAlerts: async (status?: string) => {
    const url = status ? `/alerts?status=${status}` : '/alerts'
    const response = await api.get(url)
    return response.data
  },
  
  getActiveAlerts: async () => {
    const response = await api.get('/alerts/active')
    return response.data
  },
  
  updateAlertStatus: async (id: string, status: string) => {
    const response = await api.patch(`/alerts/${id}`, { status })
    return response.data
  },
  
  dismissAlert: async (id: string) => {
    const response = await api.patch(`/alerts/${id}/dismiss`)
    return response.data
  },
  
  getAlertStatistics: async () => {
    const response = await api.get('/alerts/statistics')
    return response.data
  },

  // Analytics
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard')
    return response.data
  },
  
  getInventoryValue: async () => {
    const response = await api.get('/analytics/inventory-value')
    return response.data
  },
  
  getSalesReport: async (startDate?: string, endDate?: string) => {
    let url = '/analytics/sales-report'
    const params = []
    if (startDate) params.push(`startDate=${startDate}`)
    if (endDate) params.push(`endDate=${endDate}`)
    if (params.length > 0) url += `?${params.join('&')}`
    const response = await api.get(url)
    return response.data
  },
  
  getTopProducts: async (limit?: number) => {
    const url = limit ? `/analytics/top-products?limit=${limit}` : '/analytics/top-products'
    const response = await api.get(url)
    return response.data
  },
}









