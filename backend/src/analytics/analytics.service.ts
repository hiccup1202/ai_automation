import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Inventory, TransactionType } from '../inventory/entities/inventory.entity';
import { Alert, AlertStatus } from '../alerts/entities/alert.entity';
import { Prediction } from '../predictions/entities/prediction.entity';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    @InjectRepository(Prediction)
    private predictionsRepository: Repository<Prediction>,
    private inventoryService: InventoryService,
  ) {}

  async getDashboardAnalytics(): Promise<any> {
    const [
      totalProducts,
      activeProducts,
      totalAlerts,
      activeAlerts,
      lowStockCount,
      inventoryValue,
      recentSales,
    ] = await Promise.all([
      this.productsRepository.count(),
      this.productsRepository.count({ where: { isActive: true } }),
      this.alertsRepository.count(),
      this.alertsRepository.count({ where: { status: AlertStatus.ACTIVE } }),
      this.inventoryService.getLowStockProducts(),
      this.calculateInventoryValue(),
      this.getRecentSalesCount(7),
    ]);

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
      },
      inventory: {
        lowStockItems: lowStockCount.length,
        totalValue: inventoryValue,
      },
      sales: {
        last7Days: recentSales,
      },
      lastUpdated: new Date(),
    };
  }

  async calculateInventoryValue(): Promise<number> {
    const products = await this.productsRepository.find();
    let totalValue = 0;

    for (const product of products) {
      const currentStock = await this.inventoryService.getCurrentStockForProduct(product.id);
      totalValue += currentStock * Number(product.cost);
    }

    return Math.round(totalValue * 100) / 100;
  }

  async generateSalesReport(startDate?: string, endDate?: string): Promise<any> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.transactionType = :type', { type: TransactionType.SALE });

    if (startDate) {
      query.andWhere('inventory.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('inventory.createdAt <= :endDate', { endDate });
    }

    const sales = await query.getMany();

    const totalRevenue = sales.reduce((sum, sale) => {
      const price = sale.product ? Number(sale.product.price) : 0;
      return sum + (sale.quantity * price);
    }, 0);

    const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    return {
      period: {
        startDate: startDate || 'beginning',
        endDate: endDate || 'now',
      },
      totalSales: sales.length,
      totalQuantity,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageSaleValue: sales.length > 0 
        ? Math.round((totalRevenue / sales.length) * 100) / 100 
        : 0,
    };
  }

  async getTopProducts(limit: number = 10): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.transactionType = :type', { type: TransactionType.SALE })
      .andWhere('inventory.createdAt >= :startDate', { startDate: thirtyDaysAgo })
      .getMany();

    const productSales = new Map<string, { product: any; totalQuantity: number; totalRevenue: number }>();

    sales.forEach(sale => {
      if (!sale.product) return;

      const existing = productSales.get(sale.productId);
      const revenue = sale.quantity * Number(sale.product.price);

      if (existing) {
        existing.totalQuantity += sale.quantity;
        existing.totalRevenue += revenue;
      } else {
        productSales.set(sale.productId, {
          product: {
            id: sale.product.id,
            sku: sale.product.sku,
            name: sale.product.name,
            price: sale.product.price,
          },
          totalQuantity: sale.quantity,
          totalRevenue: revenue,
        });
      }
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)
      .map(item => ({
        ...item,
        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
      }));
  }

  async getSystemHealth(): Promise<any> {
    const [
      totalProducts,
      activeAlerts,
      recentPredictions,
      recentTransactions,
    ] = await Promise.all([
      this.productsRepository.count({ where: { isActive: true } }),
      this.alertsRepository.count({ where: { status: AlertStatus.ACTIVE } }),
      this.predictionsRepository.count(),
      this.inventoryRepository.count(),
    ]);

    const healthScore = this.calculateHealthScore(activeAlerts, totalProducts);

    return {
      status: healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'WARNING' : 'CRITICAL',
      healthScore,
      metrics: {
        activeProducts: totalProducts,
        activeAlerts,
        totalPredictions: recentPredictions,
        totalTransactions: recentTransactions,
      },
      timestamp: new Date(),
    };
  }

  private async getRecentSalesCount(days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.transactionType = :type', { type: TransactionType.SALE })
      .andWhere('inventory.createdAt >= :startDate', { startDate })
      .getCount();
  }

  private calculateHealthScore(activeAlerts: number, totalProducts: number): number {
    if (totalProducts === 0) return 100;
    
    const alertRatio = activeAlerts / totalProducts;
    let score = 100;

    if (alertRatio > 0.5) {
      score = 40;
    } else if (alertRatio > 0.3) {
      score = 60;
    } else if (alertRatio > 0.1) {
      score = 80;
    }

    return score;
  }
}









