import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, TransactionType } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { AdvancedMLService } from './advanced-ml.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private advancedMLService: AdvancedMLService,
  ) {}

  async createTransaction(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { productId, transactionType, quantity, notes } = createInventoryDto;

    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get current stock
    const currentStock = await this.getCurrentStockForProduct(productId);

    // Calculate new stock based on transaction type
    let newStock = currentStock;
    if (transactionType === TransactionType.PURCHASE || transactionType === TransactionType.RETURN) {
      newStock += quantity;
    } else if (transactionType === TransactionType.SALE) {
      newStock -= quantity;
    } else if (transactionType === TransactionType.ADJUSTMENT) {
      newStock = quantity; // Direct adjustment
    }

    const inventory = this.inventoryRepository.create({
      productId,
      transactionType,
      quantity,
      currentStock: newStock,
      notes,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // 🔥 NEW: Update product's personalized model weights after each SALE
    if (transactionType === TransactionType.SALE) {
      // Run async without blocking the response
      this.updateProductModelWeights(productId).catch(error => {
        console.error('Error updating model weights:', error);
      });
    }

    return savedInventory;
  }

  async getCurrentStock(): Promise<any[]> {
    const products = await this.productsRepository.find();
    const stockLevels = await Promise.all(
      products.map(async (product) => {
        const currentStock = await this.getCurrentStockForProduct(product.id);
        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          currentStock,
          minStockLevel: product.minStockLevel,
          reorderPoint: product.reorderPoint,
          status: this.getStockStatus(currentStock, product.reorderPoint, product.minStockLevel),
        };
      }),
    );
    return stockLevels;
  }

  async getCurrentStockForProduct(productId: string): Promise<number> {
    const latestInventory = await this.inventoryRepository.findOne({
      where: { productId },
      order: { createdAt: 'DESC' },
    });

    return latestInventory ? latestInventory.currentStock : 0;
  }

  async getProductInventory(productId: string): Promise<Inventory[]> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return await this.inventoryRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async getLowStockProducts(): Promise<any[]> {
    const products = await this.productsRepository.find({ where: { isActive: true } });
    const lowStockProducts = [];

    for (const product of products) {
      const currentStock = await this.getCurrentStockForProduct(product.id);
      if (currentStock <= product.reorderPoint) {
        lowStockProducts.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          currentStock,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity,
          deficit: product.reorderPoint - currentStock,
        });
      }
    }

    return lowStockProducts;
  }

  async getHistory(startDate?: string, endDate?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .orderBy('inventory.createdAt', 'DESC');

    if (startDate) {
      query.andWhere('inventory.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('inventory.createdAt <= :endDate', { endDate });
    }

    return await query.getMany();
  }

  private getStockStatus(currentStock: number, reorderPoint: number, minStockLevel: number): string {
    if (currentStock <= minStockLevel) {
      return 'CRITICAL';
    } else if (currentStock <= reorderPoint) {
      return 'LOW';
    } else {
      return 'NORMAL';
    }
  }

  /**
   * 🔥 Update product's advanced ML model
   * Uses: EWMA, Seasonality Detection, Time-Weighted Regression, Trend Analysis
   * This is called automatically after every SALE transaction
   */
  private async updateProductModelWeights(productId: string): Promise<void> {
    try {
      // Get last 60 days of SALE transactions (more data for better patterns)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const salesHistory = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.productId = :productId', { productId })
        .andWhere('inventory.transactionType = :type', { type: TransactionType.SALE })
        .andWhere('inventory.createdAt >= :date', { date: sixtyDaysAgo })
        .orderBy('inventory.createdAt', 'ASC')
        .getMany();

      // Need at least 3 data points
      if (salesHistory.length < 3) {
        console.log(`[Advanced ML] Not enough data for ${productId} (${salesHistory.length} points), skipping`);
        return;
      }

      // Prepare data for ML service
      const salesData = salesHistory.map(sale => ({
        date: sale.createdAt,
        quantity: sale.quantity,
      }));

      // 🦙 Update Lag-Llama model
      try {
        await this.advancedMLService.updateProductModel(productId);
        console.log(`[Lag-Llama] Model updated for ${productId}`);
      } catch (error) {
        console.warn(`⚠️  [Lag-Llama] Service unavailable for ${productId}: ${error.message}`);
        console.warn(`   Transaction completed, but prediction model not updated`);
        // Don't throw - allow transaction to complete even if LLM service is down
      }

      // Model is updated by advancedMLService.updateProductModel()
      // Logging is done in the service

    } catch (error) {
      console.error(`❌ [Advanced ML] Error updating model for ${productId}:`, error.message);
      throw error;
    }
  }
}



