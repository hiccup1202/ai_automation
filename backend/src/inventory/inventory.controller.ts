import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('transaction')
  @ApiOperation({ summary: 'Create an inventory transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createTransaction(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createTransaction(createInventoryDto);
  }

  @Get('current-stock')
  @ApiOperation({ summary: 'Get current stock levels for all products' })
  @ApiResponse({ status: 200, description: 'Stock levels retrieved successfully' })
  getCurrentStock() {
    return this.inventoryService.getCurrentStock();
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get inventory history for a product' })
  @ApiResponse({ status: 200, description: 'Inventory history retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductInventory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventory(productId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock levels' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved' })
  getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get inventory transaction history' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  getHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.getHistory(startDate, endDate);
  }
}








