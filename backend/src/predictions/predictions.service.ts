import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Prediction } from './entities/prediction.entity';
import { Product } from '../products/entities/product.entity';
import { Inventory, TransactionType } from '../inventory/entities/inventory.entity';
import { AdvancedMLService } from '../inventory/advanced-ml.service';
import { LagLlamaService } from '../llm/lag-llama.service';
const regression = require('regression');

@Injectable()
export class PredictionsService {
  constructor(
    @InjectRepository(Prediction)
    private predictionsRepository: Repository<Prediction>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private advancedMLService: AdvancedMLService,
    private lagLlamaService: LagLlamaService,
  ) {}

  async generatePredictionsForAllProducts(): Promise<Prediction[]> {
    const products = await this.productsRepository.find({ where: { isActive: true } });
    const predictions = [];

    for (const product of products) {
      try {
        const prediction = await this.predictDemand(product.id, 7);
        predictions.push(prediction);
      } catch (error) {
        console.error(`Error predicting demand for product ${product.id}:`, error);
      }
    }

    return predictions;
  }

  async predictDemand(productId: string, daysAhead: number = 7): Promise<Prediction> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Use Lag-Llama model if available
    if (product.modelWeightA !== null && product.modelTrainingCount > 2) {
      return this.predictWithLagLlamaModel(product, daysAhead);
    }

    // Fallback: Use standard regression if no trained model
    console.log(`⚠️  No trained model for ${productId}, using fallback prediction`);
    return this.predictWithStandardRegression(productId, daysAhead);
  }

  /**
   * 🦙 Predict using Lag-Llama LLM model (REAL LLM SERVICE)
   * Uses: Transformer-based time series forecasting from Python service
   */
  private async predictWithLagLlamaModel(product: Product, daysAhead: number): Promise<Prediction> {
    // First, try to use the REAL LLM service
    const llmPrediction = await this.predictWithRealLLM(product, daysAhead);
    
    if (llmPrediction) {
      console.log(`✅ Using REAL LLM service for prediction`);
      return llmPrediction;
    }
    
    // Fallback to stored linear approximation if LLM service unavailable
    console.log(`⚠️  LLM service unavailable, using stored linear approximation`);
    return this.predictWithStoredLinearization(product, daysAhead);
  }

  /**
   * 🦙 NEW: Predict using REAL Lag-Llama LLM service
   */
  private async predictWithRealLLM(product: Product, daysAhead: number): Promise<Prediction | null> {
    try {
      // Check if service is available
      const serviceStatus = this.lagLlamaService.getServiceStatus();
      if (!serviceStatus.available) {
        console.log(`❌ LLM service not available at ${serviceStatus.url}`);
        return null;
      }

      // Fetch historical sales data
      const salesData = await this.inventoryRepository.find({
        where: {
          productId: product.id,
          transactionType: TransactionType.SALE,
        },
        order: { createdAt: 'ASC' },
        take: 90, // Last 90 days
      });

      if (salesData.length < 7) {
        console.log(`⚠️  Not enough historical data (${salesData.length} points)`);
        return null;
      }

      // Prepare data for LLM
      const lagLlamaData = {
        dates: salesData.map(d => d.createdAt.toISOString()),
        quantities: salesData.map(d => Math.abs(d.quantity)), // Sales are negative
        product_id: product.id,
        days_ahead: daysAhead,
      };

      console.log(`🦙 Calling REAL Lag-Llama service for ${product.sku}...`);
      const llmResult = await this.lagLlamaService.predict(lagLlamaData);

      if (!llmResult) {
        return null;
      }

      // Extract first day prediction (or sum if needed)
      const predictedDemand = Math.max(0, Math.round(llmResult.predictions[0]));
      const futureDate = new Date(llmResult.prediction_dates[0]);

      // Calculate confidence from prediction intervals
      const lowerBound = Math.round(llmResult.confidence_intervals.lower[0]);
      const upperBound = Math.round(llmResult.confidence_intervals.upper[0]);
      const confidence = Math.round(
        100 - ((upperBound - lowerBound) / predictedDemand * 50)
      );

      const prediction = this.predictionsRepository.create({
        productId: product.id,
        predictedDemand,
        confidence: Math.min(95, Math.max(70, confidence)),
        predictionDate: futureDate,
        daysAhead,
        metadata: {
          method: '🦙 REAL Lag-Llama LLM Service',
          algorithm: 'Transformer-based Time Series Forecasting',
          source: 'Python FastAPI LLM Service',
          
          // LLM predictions
          predictions: llmResult.predictions,
          predictionDates: llmResult.prediction_dates,
          
          // Confidence intervals
          lowerBound: lowerBound,
          upperBound: upperBound,
          confidenceRange: llmResult.metadata.confidence_range,
          
          // Trend analysis from LLM
          trend: llmResult.metadata.trend,
          historicalMean: llmResult.metadata.historical_mean,
          predictedMean: llmResult.metadata.predicted_mean,
          hasSeasonality: llmResult.metadata.has_seasonality,
          
          // Model info
          forecastHorizon: llmResult.metadata.forecast_horizon,
          contextLength: llmResult.metadata.context_length,
          modelType: llmResult.model_type,
          
          // Display info
          trendIcon: llmResult.metadata.trend === 'increasing' ? '📈' : 
                     llmResult.metadata.trend === 'decreasing' ? '📉' : '➡️',
        },
      });

      return await this.predictionsRepository.save(prediction);

    } catch (error) {
      console.error(`❌ Error calling real LLM service: ${error.message}`);
      return null;
    }
  }

  /**
   * Fallback: Use stored linear approximation from previous training
   */
  private async predictWithStoredLinearization(product: Product, daysAhead: number): Promise<Prediction> {
    // Parse seasonality JSON if it's a string
    let seasonality = product.modelSeasonality;
    if (typeof seasonality === 'string') {
      try {
        seasonality = JSON.parse(seasonality);
      } catch (e) {
        seasonality = null;
      }
    }
    
    const modelParams = {
      weightA: Number(product.modelWeightA),
      weightB: Number(product.modelWeightB),
      trainingCount: Number(product.modelTrainingCount),
      confidence: Number(product.modelConfidence || 85),
      seasonality: seasonality,
      trendStrength: Number(product.modelTrendStrength || 0),
      volatility: Number(product.modelVolatility || 0),
    };

    // Simple linear prediction from Lag-Llama stored weights
    const predictedValue = modelParams.weightA * daysAhead + modelParams.weightB;
    const predictedDemand = Math.max(0, Math.round(predictedValue));

    // Calculate prediction intervals (confidence bounds)
    const stdDev = modelParams.volatility * predictedValue;
    const lowerBound = Math.max(0, Math.round(predictedValue - 1.96 * stdDev)); // 95% confidence
    const upperBound = Math.round(predictedValue + 1.96 * stdDev);

    // Determine if seasonality is affecting this prediction
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const dayOfWeek = futureDate.getDay();
    const seasonalFactor = modelParams.seasonality?.weekly?.[dayOfWeek] || 1.0;
    const isSeasonalPeak = seasonalFactor > 1.1;
    const isSeasonalLow = seasonalFactor < 0.9;

    const prediction = this.predictionsRepository.create({
      productId: product.id,
      predictedDemand,
      confidence: modelParams.confidence,
      predictionDate: futureDate,
      daysAhead,
      metadata: {
        method: '🦙 Stored Linear Approximation (Fallback)',
        algorithm: 'Linear model from previous LLM training',
        note: 'LLM service unavailable - using cached model',
        
        // Model parameters
        trendEquation: `y = ${modelParams.weightA.toFixed(4)}x + ${modelParams.weightB.toFixed(2)}`,
        trendStrength: `${modelParams.trendStrength.toFixed(1)}%`,
        volatility: `${(modelParams.volatility * 100).toFixed(1)}%`,
        
        // Prediction details
        basePrediction: Math.round(modelParams.weightA * (modelParams.trainingCount + daysAhead) + modelParams.weightB),
        seasonalAdjustment: seasonalFactor.toFixed(2),
        seasonalImpact: isSeasonalPeak ? 'Peak Day' : isSeasonalLow ? 'Low Day' : 'Normal Day',
        lowerBound: lowerBound,
        upperBound: upperBound,
        
        // Model quality
        trainingDataPoints: product.modelTrainingCount,
        lastModelUpdate: product.modelLastUpdated,
        hasSeasonality: modelParams.seasonality?.hasPattern || false,
        
        // Trend analysis
        trend: modelParams.weightA > 0.01 ? '📈 Increasing' : 
               modelParams.weightA < -0.01 ? '📉 Decreasing' : 
               '➡️ Stable',
        dailyChangeRate: Math.abs(modelParams.weightA).toFixed(2),
      },
    });

    return await this.predictionsRepository.save(prediction);
  }

  /**
   * @deprecated No longer used - Lag-Llama only
   * Standard regression prediction (fallback when no trained model exists)
   */
  private async predictWithStandardRegression(productId: string, daysAhead: number): Promise<Prediction> {
    // Get historical sales data
    const historicalData = await this.getHistoricalSalesData(productId);

    if (historicalData.length < 3) {
      // Not enough data, return a basic prediction
      return this.createBasicPrediction(productId, daysAhead);
    }

    // Prepare data for linear regression
    const dataPoints = historicalData.map((item, index) => [index, item.quantity]);

    // Perform linear regression
    const result = regression.linear(dataPoints);

    // Predict for the next period
    const nextIndex = historicalData.length;
    const predictedValue = result.predict(nextIndex)[1];

    // Calculate confidence based on R-squared
    const confidence = Math.max(0, Math.min(100, result.r2 * 100));

    // Ensure prediction is not negative
    const predictedDemand = Math.max(0, Math.round(predictedValue));

    const prediction = this.predictionsRepository.create({
      productId,
      predictedDemand,
      confidence,
      predictionDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
      daysAhead,
      metadata: {
        method: 'Standard Regression',
        historicalDataPoints: historicalData.length,
        equation: result.equation,
        r2: result.r2,
      },
    });

    return await this.predictionsRepository.save(prediction);
  }

  async getPredictions(productId?: string): Promise<Prediction[]> {
    const query = this.predictionsRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.product', 'product')
      .orderBy('prediction.createdAt', 'DESC');

    if (productId) {
      query.where('prediction.productId = :productId', { productId });
    }

    return await query.take(100).getMany();
  }

  async getLatestPredictions(): Promise<any[]> {
    const products = await this.productsRepository.find({ where: { isActive: true } });
    const latestPredictions = [];

    for (const product of products) {
      // Get the most recent prediction based on createdAt, regardless of predictionDate
      const prediction = await this.predictionsRepository.findOne({
        where: {
          productId: product.id,
        },
        order: { createdAt: 'DESC' },
      });

      if (prediction) {
        latestPredictions.push({
          ...prediction,
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
          },
        });
      }
    }

    return latestPredictions;
  }

  private async getHistoricalSalesData(productId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesData = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.productId = :productId', { productId })
      .andWhere('inventory.transactionType = :type', { type: TransactionType.SALE })
      .andWhere('inventory.createdAt >= :startDate', { startDate })
      .orderBy('inventory.createdAt', 'ASC')
      .getMany();

    // Aggregate sales by day
    const dailySales = new Map<string, number>();

    salesData.forEach((sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      dailySales.set(date, (dailySales.get(date) || 0) + sale.quantity);
    });

    return Array.from(dailySales.entries()).map(([date, quantity]) => ({
      date,
      quantity,
    }));
  }

  private async createBasicPrediction(productId: string, daysAhead: number): Promise<Prediction> {
    // Get recent average if available
    const recentSales = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.productId = :productId', { productId })
      .andWhere('inventory.transactionType = :type', { type: TransactionType.SALE })
      .orderBy('inventory.createdAt', 'DESC')
      .take(5)
      .getMany();

    const avgDemand = recentSales.length > 0
      ? Math.round(recentSales.reduce((sum, sale) => sum + sale.quantity, 0) / recentSales.length)
      : 10; // Default prediction

    const prediction = this.predictionsRepository.create({
      productId,
      predictedDemand: avgDemand,
      confidence: 30, // Low confidence due to insufficient data
      predictionDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
      daysAhead,
      metadata: {
        historicalDataPoints: recentSales.length,
        method: 'basic-average',
      },
    });

    return await this.predictionsRepository.save(prediction);
  }

  async analyzeTrends(): Promise<any> {
    const products = await this.productsRepository.find({ where: { isActive: true } });
    const trends = [];

    for (const product of products) {
      const historicalData = await this.getHistoricalSalesData(product.id, 30);
      
      if (historicalData.length >= 2) {
        const recentAvg = this.calculateAverage(
          historicalData.slice(-7).map(d => d.quantity)
        );
        const previousAvg = this.calculateAverage(
          historicalData.slice(0, -7).map(d => d.quantity)
        );

        const trend = recentAvg > previousAvg ? 'INCREASING' : 
                     recentAvg < previousAvg ? 'DECREASING' : 'STABLE';

        const changePercent = previousAvg !== 0 
          ? ((recentAvg - previousAvg) / previousAvg * 100).toFixed(2)
          : 0;

        trends.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          trend,
          recentAverage: recentAvg,
          previousAverage: previousAvg,
          changePercent,
        });
      }
    }

    return trends;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * 🦙 Train Lag-Llama models for all products
   * This should be called after seeding or when models need to be retrained
   */
  async trainAllModels(): Promise<any> {
    const products = await this.productsRepository.find({ where: { isActive: true } });
    const results = {
      total: products.length,
      trained: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    for (const product of products) {
      try {
        await this.advancedMLService.updateProductModel(product.id);
        results.trained++;
        results.details.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          status: 'trained',
        });
      } catch (error) {
        if (error.message.includes('Not enough data')) {
          results.skipped++;
          results.details.push({
            productId: product.id,
            sku: product.sku,
            name: product.name,
            status: 'skipped',
            reason: 'Insufficient data (need at least 7 transactions)',
          });
        } else {
          results.failed++;
          results.details.push({
            productId: product.id,
            sku: product.sku,
            name: product.name,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return {
      message: `Model training completed: ${results.trained} trained, ${results.skipped} skipped, ${results.failed} failed`,
      summary: results,
    };
  }
}



