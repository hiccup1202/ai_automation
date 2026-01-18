import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ default: 0 })
  minStockLevel: number;

  @Column({ default: 100 })
  maxStockLevel: number;

  @Column({ default: 20 })
  reorderPoint: number;

  @Column({ default: 50 })
  reorderQuantity: number;

  @Column({ default: true })
  isActive: boolean;

  // NEW: Advanced ML Model Parameters
  @Column('decimal', { precision: 10, scale: 6, default: 1.0, nullable: true })
  modelWeightA: number; // Linear trend coefficient

  @Column('decimal', { precision: 10, scale: 6, default: 0.0, nullable: true })
  modelWeightB: number; // Baseline/intercept

  @Column('decimal', { precision: 5, scale: 2, default: 50.0, nullable: true })
  modelConfidence: number; // Overall confidence 0-100

  @Column({ type: 'int', default: 0, nullable: true })
  modelTrainingCount: number; // Number of training samples

  @Column({ type: 'datetime', nullable: true })
  modelLastUpdated: Date; // Last training timestamp

  // Advanced parameters for complex patterns
  @Column('json', { nullable: true })
  modelSeasonality: any; // Weekly/monthly seasonal patterns

  @Column('decimal', { precision: 5, scale: 2, default: 0.0, nullable: true })
  modelTrendStrength: number; // Trend strength 0-100

  @Column('decimal', { precision: 10, scale: 6, default: 0.0, nullable: true })
  modelVolatility: number; // Demand volatility (std dev)

  @Column('decimal', { precision: 5, scale: 3, default: 0.3, nullable: true })
  modelEwmaAlpha: number; // EWMA smoothing factor

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventoryRecords: Inventory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



