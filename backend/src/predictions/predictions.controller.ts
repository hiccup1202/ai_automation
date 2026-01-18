import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PredictionsService } from './predictions.service';

@ApiTags('predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate demand predictions for all active products' })
  @ApiResponse({ status: 201, description: 'Predictions generated successfully' })
  generatePredictions() {
    return this.predictionsService.generatePredictionsForAllProducts();
  }

  @Post('product/:productId')
  @ApiOperation({ summary: 'Generate demand prediction for a specific product' })
  @ApiQuery({ name: 'daysAhead', required: false, description: 'Number of days ahead to predict' })
  @ApiResponse({ status: 201, description: 'Prediction generated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  predictProductDemand(
    @Param('productId') productId: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    return this.predictionsService.predictDemand(productId, daysAhead || 7);
  }

  @Get()
  @ApiOperation({ summary: 'Get all predictions' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filter by product ID' })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  getPredictions(@Query('productId') productId?: string) {
    return this.predictionsService.getPredictions(productId);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest predictions for all products' })
  @ApiResponse({ status: 200, description: 'Latest predictions retrieved' })
  getLatestPredictions() {
    return this.predictionsService.getLatestPredictions();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Analyze demand trends' })
  @ApiResponse({ status: 200, description: 'Trends analyzed successfully' })
  analyzeTrends() {
    return this.predictionsService.analyzeTrends();
  }

  @Post('train-all-models')
  @ApiOperation({ summary: 'Train Lag-Llama models for all products' })
  @ApiResponse({ status: 201, description: 'Model training initiated for all products' })
  trainAllModels() {
    return this.predictionsService.trainAllModels();
  }
}






