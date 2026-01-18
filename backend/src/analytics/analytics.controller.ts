import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getDashboard() {
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get('inventory-value')
  @ApiOperation({ summary: 'Get total inventory value' })
  @ApiResponse({ status: 200, description: 'Inventory value calculated' })
  getInventoryValue() {
    return this.analyticsService.calculateInventoryValue();
  }

  @Get('sales-report')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Sales report generated' })
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.generateSalesReport(startDate, endDate);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top products retrieved' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.analyticsService.getTopProducts(limit || 10);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({ status: 200, description: 'System health retrieved' })
  getSystemHealth() {
    return this.analyticsService.getSystemHealth();
  }
}








