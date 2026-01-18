import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertStatus } from './entities/alert.entity';
import { UpdateAlertDto } from './dto/update-alert.dto';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate alerts for all products' })
  @ApiResponse({ status: 201, description: 'Alerts generated successfully' })
  generateAlerts() {
    return this.alertsService.generateAlerts();
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  getAlerts(@Query('status') status?: AlertStatus) {
    return this.alertsService.getAlerts(status);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active alerts' })
  @ApiResponse({ status: 200, description: 'Active alerts retrieved' })
  getActiveAlerts() {
    return this.alertsService.getActiveAlerts();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.alertsService.getAlertStatistics();
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get alerts for a specific product' })
  @ApiResponse({ status: 200, description: 'Product alerts retrieved' })
  getProductAlerts(@Param('productId') productId: string) {
    return this.alertsService.getAlertsByProduct(productId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  updateAlert(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.updateAlertStatus(id, updateAlertDto);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiResponse({ status: 200, description: 'Alert dismissed successfully' })
  dismissAlert(@Param('id') id: string) {
    return this.alertsService.dismissAlert(id);
  }
}








