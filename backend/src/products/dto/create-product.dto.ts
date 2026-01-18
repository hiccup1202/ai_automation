import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001', description: 'Unique product SKU' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Laptop Computer', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'High-performance laptop for business',
    description: 'Product description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Electronics', description: 'Product category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 999.99, description: 'Selling price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 750.00, description: 'Cost price', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiProperty({ example: 10, description: 'Minimum stock level', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number;

  @ApiProperty({ example: 100, description: 'Maximum stock level', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStockLevel?: number;

  @ApiProperty({ example: 20, description: 'Reorder point threshold', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiProperty({ example: 50, description: 'Quantity to reorder', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @ApiProperty({ example: true, description: 'Is product active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}









