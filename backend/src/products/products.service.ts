import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Ensure default values for optional fields
    const productData = {
      ...createProductDto,
      cost: createProductDto.cost ?? 0,
      minStockLevel: createProductDto.minStockLevel ?? 0,
      maxStockLevel: createProductDto.maxStockLevel ?? 100,
      reorderPoint: createProductDto.reorderPoint ?? 20,
      reorderQuantity: createProductDto.reorderQuantity ?? 50,
      isActive: createProductDto.isActive ?? true,
    };
    
    const product = this.productsRepository.create(productData);
    return await this.productsRepository.save(product);
  }

  async findAll(category?: string, isActive?: boolean): Promise<Product[]> {
    const query = this.productsRepository.createQueryBuilder('product');

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    if (isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['inventoryRecords'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  async findBySku(sku: string): Promise<Product> {
    return await this.productsRepository.findOne({ where: { sku } });
  }

  /**
   * 🔥 NEW: Get product's ML model information
   */
  async getModelInfo(id: string): Promise<any> {
    const product = await this.findOne(id);

    if (!product.modelWeightA || product.modelTrainingCount === 0) {
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        hasModel: false,
        message: 'No model trained yet. Model will learn from sales transactions.',
      };
    }

    // Parse seasonality JSON if it's a string
    let seasonality = product.modelSeasonality;
    if (typeof seasonality === 'string') {
      try {
        seasonality = JSON.parse(seasonality);
      } catch (e) {
        seasonality = null;
      }
    }

    const a = Number(product.modelWeightA);
    const b = Number(product.modelWeightB);
    const confidence = Number(product.modelConfidence);

    // Calculate some useful metrics
    const dailyChange = Math.abs(a);
    const trend = a > 0.01 ? 'Increasing' : a < -0.01 ? 'Decreasing' : 'Stable';
    const trendEmoji = a > 0.01 ? '📈' : a < -0.01 ? '📉' : '➡️';

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      hasModel: true,
      model: {
        equation: `y = ${a.toFixed(4)}x + ${b.toFixed(2)}`,
        slope: a,
        intercept: b,
        confidence: confidence,
        trainingCount: product.modelTrainingCount,
        lastUpdated: product.modelLastUpdated,
        trendStrength: Number(product.modelTrendStrength || 0),
        volatility: Number(product.modelVolatility || 0),
        ewmaAlpha: Number(product.modelEwmaAlpha || 0.3),
        hasSeasonality: seasonality?.hasPattern || false,
      },
      interpretation: {
        trend: `${trendEmoji} ${trend}`,
        dailyChange: `${dailyChange.toFixed(2)} units/day`,
        baseline: `${b.toFixed(0)} units`,
        description: this.getModelDescription(a, b, confidence),
      },
      stats: {
        confidenceLevel: confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : 'Low',
        dataQuality: product.modelTrainingCount >= 20 ? 'Excellent' : 
                     product.modelTrainingCount >= 10 ? 'Good' : 'Fair',
        reliability: confidence >= 70 && product.modelTrainingCount >= 15 ? 'Reliable' : 'Moderate',
      },
      seasonality: seasonality || null,
    };
  }

  private getModelDescription(a: number, b: number, confidence: number): string {
    const dailyChange = Math.abs(a).toFixed(2);
    const baseline = b.toFixed(0);
    const direction = a > 0 ? 'increasing' : a < 0 ? 'decreasing' : 'stable';

    return `This product shows ${direction} demand with a baseline of ${baseline} units. ` +
           `Daily change rate is ${dailyChange} units. ` +
           `Model confidence: ${confidence.toFixed(1)}%.`;
  }
}


