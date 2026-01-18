import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType, AlertStatus } from './entities/alert.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryService } from '../inventory/inventory.service';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private inventoryService: InventoryService,
  ) {}

  async generateAlerts(): Promise<Alert[]> {
    const products = await this.productsRepository.find({ where: { isActive: true } });
    const newAlerts = [];

    for (const product of products) {
      const currentStock = await this.inventoryService.getCurrentStockForProduct(product.id);

      // Check for critical stock
      if (currentStock <= product.minStockLevel) {
        const alert = await this.createAlertIfNotExists(
          product.id,
          AlertType.CRITICAL_STOCK,
          `Critical stock level for ${product.name}. Current: ${currentStock}, Min: ${product.minStockLevel}`,
          10,
          { currentStock, minStockLevel: product.minStockLevel },
        );
        if (alert) newAlerts.push(alert);
      }
      // Check for low stock
      else if (currentStock <= product.reorderPoint) {
        const alert = await this.createAlertIfNotExists(
          product.id,
          AlertType.LOW_STOCK,
          `Low stock level for ${product.name}. Current: ${currentStock}, Reorder Point: ${product.reorderPoint}`,
          7,
          { currentStock, reorderPoint: product.reorderPoint },
        );
        if (alert) newAlerts.push(alert);
      }

      // Check for overstock
      if (currentStock > product.maxStockLevel) {
        const alert = await this.createAlertIfNotExists(
          product.id,
          AlertType.OVERSTOCK,
          `Overstock detected for ${product.name}. Current: ${currentStock}, Max: ${product.maxStockLevel}`,
          3,
          { currentStock, maxStockLevel: product.maxStockLevel },
        );
        if (alert) newAlerts.push(alert);
      }

      // Check if reorder is needed
      if (currentStock <= product.reorderPoint) {
        const alert = await this.createAlertIfNotExists(
          product.id,
          AlertType.REORDER_NEEDED,
          `Reorder needed for ${product.name}. Suggested quantity: ${product.reorderQuantity}`,
          8,
          {
            currentStock,
            reorderPoint: product.reorderPoint,
            reorderQuantity: product.reorderQuantity,
          },
        );
        if (alert) newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  async getAlerts(status?: AlertStatus): Promise<Alert[]> {
    const query = this.alertsRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.product', 'product')
      .orderBy('alert.priority', 'DESC')
      .addOrderBy('alert.createdAt', 'DESC');

    if (status) {
      query.where('alert.status = :status', { status });
    }

    return await query.getMany();
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return this.getAlerts(AlertStatus.ACTIVE);
  }

  async updateAlertStatus(id: string, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.alertsRepository.findOne({ where: { id } });
    
    if (!alert) {
      throw new Error(`Alert with ID ${id} not found`);
    }

    alert.status = updateAlertDto.status;
    return await this.alertsRepository.save(alert);
  }

  async dismissAlert(id: string): Promise<void> {
    await this.updateAlertStatus(id, { status: AlertStatus.DISMISSED });
  }

  async getAlertsByProduct(productId: string): Promise<Alert[]> {
    return await this.alertsRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAlertStatistics(): Promise<any> {
    const alerts = await this.alertsRepository.find();

    const statistics = {
      total: alerts.length,
      byStatus: {
        active: alerts.filter(a => a.status === AlertStatus.ACTIVE).length,
        acknowledged: alerts.filter(a => a.status === AlertStatus.ACKNOWLEDGED).length,
        resolved: alerts.filter(a => a.status === AlertStatus.RESOLVED).length,
        dismissed: alerts.filter(a => a.status === AlertStatus.DISMISSED).length,
      },
      byType: {
        lowStock: alerts.filter(a => a.alertType === AlertType.LOW_STOCK).length,
        criticalStock: alerts.filter(a => a.alertType === AlertType.CRITICAL_STOCK).length,
        overstock: alerts.filter(a => a.alertType === AlertType.OVERSTOCK).length,
        reorderNeeded: alerts.filter(a => a.alertType === AlertType.REORDER_NEEDED).length,
        predictedShortage: alerts.filter(a => a.alertType === AlertType.PREDICTED_SHORTAGE).length,
      },
      highPriority: alerts.filter(a => a.priority >= 8 && a.status === AlertStatus.ACTIVE).length,
    };

    return statistics;
  }

  private async createAlertIfNotExists(
    productId: string,
    alertType: AlertType,
    message: string,
    priority: number,
    metadata: any,
  ): Promise<Alert | null> {
    // Check if similar active alert already exists
    const existingAlert = await this.alertsRepository.findOne({
      where: {
        productId,
        alertType,
        status: AlertStatus.ACTIVE,
      },
    });

    if (existingAlert) {
      return null; // Don't create duplicate
    }

    const alert = this.alertsRepository.create({
      productId,
      alertType,
      message,
      priority,
      metadata,
    });

    return await this.alertsRepository.save(alert);
  }
}








