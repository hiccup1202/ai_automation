import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { AdvancedMLService } from './advanced-ml.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, Product]),
    LlmModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, AdvancedMLService],
  exports: [InventoryService, AdvancedMLService],
})
export class InventoryModule {}



