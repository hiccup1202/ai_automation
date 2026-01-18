import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * 🦙 Lag-Llama Integration Service
 * 
 * Connects NestJS backend to local Lag-Llama Python service
 * Handles time series forecasting using LLM
 */

export interface TimeSeriesData {
  dates: string[];
  quantities: number[];
  product_id: string;
  product_name?: string;
  days_ahead?: number;
  context_length?: number;
}

export interface LagLlamaPrediction {
  product_id: string;
  predictions: number[];
  prediction_dates: string[];
  confidence_intervals: {
    lower: number[];
    median: number[];
    upper: number[];
  };
  model_type: string;
  metadata: {
    trend: string;
    historical_mean: number;
    predicted_mean: number;
    has_seasonality: boolean;
    forecast_horizon: number;
    context_length: number;
    model: string;
    confidence_range: string;
  };
}

@Injectable()
export class LagLlamaService {
  private readonly logger = new Logger(LagLlamaService.name);
  private readonly client: AxiosInstance;
  private readonly serviceUrl: string;
  private isServiceAvailable: boolean = false;

  constructor() {
    this.serviceUrl = process.env.LAG_LLAMA_SERVICE_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 60000, // 60 seconds (model inference can be slow)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check service availability on startup
    this.checkServiceAvailability();
  }

  /**
   * Check if Lag-Llama service is running
   */
  async checkServiceAvailability(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      this.isServiceAvailable = response.data.status === 'healthy';
      
      if (this.isServiceAvailable) {
        this.logger.log('✅ Lag-Llama service is available');
        this.logger.log(`   Model ready: ${response.data.model_ready}`);
        this.logger.log(`   Device: ${response.data.device}`);
      }
      
      return this.isServiceAvailable;
    } catch (error) {
      this.isServiceAvailable = false;
      this.logger.error('❌ Lag-Llama service not available. Cannot generate predictions without LLM service.');
      return false;
    }
  }

  /**
   * Generate prediction using Lag-Llama
   */
  async predict(data: TimeSeriesData): Promise<LagLlamaPrediction | null> {
    try {
      // Check service availability
      if (!this.isServiceAvailable) {
        const available = await this.checkServiceAvailability();
        if (!available) {
          this.logger.warn('Lag-Llama service unavailable, returning null');
          return null;
        }
      }

      this.logger.log(`🦙 Requesting Lag-Llama prediction for product ${data.product_id}`);

      const response = await this.client.post<LagLlamaPrediction>('/predict', data);

      this.logger.log(`✅ Lag-Llama prediction completed for ${data.product_id}`);
      this.logger.log(`   Predicted demand: ${response.data.predictions[0].toFixed(2)} (Day 1)`);
      this.logger.log(`   Trend: ${response.data.metadata.trend}`);

      return response.data;

    } catch (error) {
      this.logger.error(`❌ Lag-Llama prediction failed: ${error.message}`);
      
      // Mark service as unavailable on error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.isServiceAvailable = false;
      }
      
      return null;
    }
  }

  /**
   * Batch prediction for multiple products
   */
  async predictBatch(products: TimeSeriesData[]): Promise<(LagLlamaPrediction | null)[]> {
    try {
      if (!this.isServiceAvailable) {
        const available = await this.checkServiceAvailability();
        if (!available) {
          return products.map(() => null);
        }
      }

      this.logger.log(`🦙 Batch prediction for ${products.length} products`);

      const response = await this.client.post('/predict-batch', products);
      
      return response.data;

    } catch (error) {
      this.logger.error(`❌ Batch prediction failed: ${error.message}`);
      return products.map(() => null);
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(): { available: boolean; url: string } {
    return {
      available: this.isServiceAvailable,
      url: this.serviceUrl,
    };
  }
}

