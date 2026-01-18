import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '../entities/inventory.entity';

export class CreateInventoryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.PURCHASE,
    description: 'Type of transaction',
  })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({ example: 50, description: 'Quantity of transaction' })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 'Restocking from supplier',
    description: 'Additional notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}








