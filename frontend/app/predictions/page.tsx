'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, RefreshCw, Zap } from 'lucide-react'
import { apiClient } from '@/lib/api'
import PredictionCard from '@/components/PredictionCard'

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [training, setTraining] = useState(false)
  const [trainingResult, setTrainingResult] = useState<string | null>(null)

  useEffect(() => {
    fetchPredictions()
    fetchTrends()
  }, [])

  const fetchPredictions = async () => {
    try {
      const data = await apiClient.getLatestPredictions()
      setPredictions(data)
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const data = await apiClient.getTrends()
      setTrends(data)
    } catch (error) {
      console.error('Error fetching trends:', error)
    }
  }

  const handleGeneratePredictions = async () => {
    setGenerating(true)
    setTrainingResult(null)
    try {
      await apiClient.generatePredictions()
      await fetchPredictions()
    } catch (error) {
      console.error('Error generating predictions:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleTrainModels = async () => {
    setTraining(true)
    setTrainingResult(null)
    try {
      const result = await apiClient.trainAllModels()
      setTrainingResult(result.message)
      // Optionally refresh predictions after training
      await fetchPredictions()
      await fetchTrends()
    } catch (error) {
      console.error('Error training models:', error)
      setTrainingResult('Error: Failed to train models')
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Predictions</h1>
          <p className="mt-2 text-gray-600">
            Amazon Chronos powered demand forecasting
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleTrainModels}
            disabled={training || generating}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Zap size={20} className={training ? 'animate-pulse' : ''} />
            {training ? 'Training...' : 'Train Models'}
          </button>
          <button
            onClick={handleGeneratePredictions}
            disabled={generating || training}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : 'Generate Predictions'}
          </button>
        </div>
      </div>

      {/* Training Result Message */}
      {trainingResult && (
        <div className={`rounded-lg p-4 ${
          trainingResult.includes('Error') 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <p className={`text-sm font-medium ${
            trainingResult.includes('Error') ? 'text-red-800' : 'text-green-800'
          }`}>
            {trainingResult}
          </p>
        </div>
      )}

      {/* Trends Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Demand Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trends.slice(0, 6).map((trend) => (
            <div key={trend.productId} className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{trend.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm font-semibold ${
                  trend.trend === 'INCREASING' ? 'text-green-600' :
                  trend.trend === 'DECREASING' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {trend.trend}
                </span>
                <span className="text-sm text-gray-600">
                  {trend.changePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictions List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Latest Predictions
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
            {predictions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No predictions available. Generate predictions to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}









