import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Helper to generate random date within last N days
function randomDate(daysAgo: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

// Helper to generate random quantity with trend
function generateQuantityWithTrend(baseQuantity: number, dayIndex: number, totalDays: number, trend: 'increasing' | 'decreasing' | 'stable'): number {
  let trendFactor = 1;
  
  if (trend === 'increasing') {
    trendFactor = 1 + (dayIndex / totalDays) * 0.5; // Up to 50% increase
  } else if (trend === 'decreasing') {
    trendFactor = 1 - (dayIndex / totalDays) * 0.3; // Up to 30% decrease
  }
  
  // Add some randomness
  const randomFactor = 0.7 + Math.random() * 0.6; // ±30%
  const quantity = Math.max(1, Math.floor(baseQuantity * trendFactor * randomFactor));
  
  return quantity;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.prediction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();

  // Product categories and sample data
  const productTemplates = [
    // Electronics
    { name: 'Wireless Mouse', sku: 'ELEC-001', category: 'Electronics', price: 2500, cost: 1500, baseQuantity: 15 },
    { name: 'USB Cable', sku: 'ELEC-002', category: 'Electronics', price: 500, cost: 300, baseQuantity: 50 },
    { name: 'Keyboard', sku: 'ELEC-003', category: 'Electronics', price: 4500, cost: 3000, baseQuantity: 10 },
    { name: 'Headphones', sku: 'ELEC-004', category: 'Electronics', price: 3500, cost: 2000, baseQuantity: 20 },
    { name: 'Phone Charger', sku: 'ELEC-005', category: 'Electronics', price: 1500, cost: 800, baseQuantity: 30 },
    
    // Cosmetics
    { name: 'Shampoo', sku: 'COSM-001', category: 'Cosmetics', price: 2000, cost: 1200, baseQuantity: 25 },
    { name: 'Conditioner', sku: 'COSM-002', category: 'Cosmetics', price: 2200, cost: 1300, baseQuantity: 20 },
    { name: 'Body Lotion', sku: 'COSM-003', category: 'Cosmetics', price: 1800, cost: 1000, baseQuantity: 30 },
    { name: 'Face Cream', sku: 'COSM-004', category: 'Cosmetics', price: 3500, cost: 2000, baseQuantity: 15 },
    { name: 'Sunscreen', sku: 'COSM-005', category: 'Cosmetics', price: 2500, cost: 1500, baseQuantity: 20 },
    
    // Food & Beverages
    { name: 'Coffee Beans', sku: 'FOOD-001', category: 'Food', price: 1500, cost: 800, baseQuantity: 40 },
    { name: 'Green Tea', sku: 'FOOD-002', category: 'Food', price: 800, cost: 400, baseQuantity: 60 },
    { name: 'Instant Noodles', sku: 'FOOD-003', category: 'Food', price: 300, cost: 150, baseQuantity: 100 },
    { name: 'Protein Bar', sku: 'FOOD-004', category: 'Food', price: 500, cost: 250, baseQuantity: 80 },
    { name: 'Energy Drink', sku: 'FOOD-005', category: 'Food', price: 700, cost: 400, baseQuantity: 50 },
    
    // Office Supplies
    { name: 'Notebook', sku: 'OFFC-001', category: 'Office', price: 400, cost: 200, baseQuantity: 70 },
    { name: 'Pen Set', sku: 'OFFC-002', category: 'Office', price: 600, cost: 300, baseQuantity: 60 },
    { name: 'Stapler', sku: 'OFFC-003', category: 'Office', price: 800, cost: 450, baseQuantity: 30 },
    { name: 'Paper Clips', sku: 'OFFC-004', category: 'Office', price: 200, cost: 100, baseQuantity: 100 },
    { name: 'Sticky Notes', sku: 'OFFC-005', category: 'Office', price: 350, cost: 180, baseQuantity: 80 },
  ];

  console.log(`Creating ${productTemplates.length} products...`);

  const products = [];
  const trends: Array<'increasing' | 'decreasing' | 'stable'> = ['increasing', 'decreasing', 'stable'];

  for (const template of productTemplates) {
    const product = await prisma.product.create({
      data: {
        sku: template.sku,
        name: template.name,
        description: `${template.name} - High quality ${template.category.toLowerCase()} product`,
        category: template.category,
        price: template.price,
        cost: template.cost,
        minStockLevel: Math.floor(template.baseQuantity * 0.3),
        maxStockLevel: Math.floor(template.baseQuantity * 3),
        reorderPoint: Math.floor(template.baseQuantity * 0.5),
        reorderQuantity: Math.floor(template.baseQuantity * 2),
        isActive: true,
        modelWeightA: 1.0,
        modelWeightB: 0.0,
        modelConfidence: 50.0,
        modelTrainingCount: 0,
        modelEwmaAlpha: 0.3,
        modelTrendStrength: 0.0,
        modelVolatility: 0.0,
      },
    });

    products.push({ ...product, ...template });
  }

  console.log(`✅ Created ${products.length} products`);

  // Generate transaction history for last 90 days
  console.log('Generating transaction history for the last 90 days...');
  const daysOfHistory = 90;
  let totalTransactions = 0;

  for (const product of products) {
    const trend = trends[Math.floor(Math.random() * trends.length)];
    let currentStock = 0;
    
    // Initial stock purchase
    currentStock += product.maxStockLevel;
    await prisma.inventory.create({
      data: {
        productId: product.id,
        transactionType: 'PURCHASE',
        quantity: product.maxStockLevel,
        currentStock: currentStock,
        notes: 'Initial stock purchase',
        createdAt: randomDate(daysOfHistory),
      },
    });
    totalTransactions++;

    // Generate daily sales with varying patterns
    for (let day = daysOfHistory; day >= 0; day--) {
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1; // 1-3 transactions per day
      
      for (let i = 0; i < transactionsPerDay; i++) {
        const quantity = generateQuantityWithTrend(product.baseQuantity, daysOfHistory - day, daysOfHistory, trend);
        
        // 80% sales, 15% purchases, 5% adjustments
        const rand = Math.random();
        let transactionType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT';
        
        if (rand < 0.80) {
          transactionType = 'SALE';
          // Can't sell more than available
          const actualQuantity = Math.min(quantity, currentStock);
          if (actualQuantity > 0) {
            currentStock -= actualQuantity;
            await prisma.inventory.create({
              data: {
                productId: product.id,
                transactionType,
                quantity: actualQuantity,
                currentStock: currentStock,
                notes: `${transactionType.toLowerCase()} - Day ${daysOfHistory - day}`,
                createdAt: randomDate(day),
              },
            });
            totalTransactions++;
          }
        } else if (rand < 0.95) {
          transactionType = 'PURCHASE';
          currentStock += quantity;
          await prisma.inventory.create({
            data: {
              productId: product.id,
              transactionType,
              quantity,
              currentStock: currentStock,
              notes: `${transactionType.toLowerCase()} - Day ${daysOfHistory - day}`,
              createdAt: randomDate(day),
            },
          });
          totalTransactions++;
        } else {
          transactionType = 'ADJUSTMENT';
          const adjustmentQuantity = Math.floor(Math.random() * 10) - 5; // -5 to +5
          currentStock = Math.max(0, currentStock + adjustmentQuantity);
          await prisma.inventory.create({
            data: {
              productId: product.id,
              transactionType,
              quantity: Math.abs(adjustmentQuantity),
              currentStock: currentStock,
              notes: `${transactionType.toLowerCase()} - Day ${daysOfHistory - day}`,
              createdAt: randomDate(day),
            },
          });
          totalTransactions++;
        }
      }
    }
  }

  console.log(`✅ Created ${totalTransactions} transactions`);

  // Generate some recent predictions
  console.log('Generating sample predictions...');
  let predictionCount = 0;
  
  for (const product of products.slice(0, 10)) { // First 10 products
    await prisma.prediction.create({
      data: {
        productId: product.id,
        predictedDemand: Math.floor(product.baseQuantity * (0.8 + Math.random() * 0.4)),
        confidence: 60 + Math.floor(Math.random() * 30),
        predictionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
        daysAhead: 7,
        metadata: {
          method: 'lag-llama',
          historicalDataPoints: daysOfHistory * 2,
          trendDetected: true,
        },
      },
    });
    predictionCount++;
  }

  console.log(`✅ Created ${predictionCount} predictions`);

  // Generate some alerts
  console.log('Generating sample alerts...');
  let alertCount = 0;
  
  for (const product of products.slice(0, 5)) { // First 5 products
    // Low stock alert
    await prisma.alert.create({
      data: {
        productId: product.id,
        alertType: 'LOW_STOCK',
        priority: 7, // High priority (1-10 scale)
        message: `Stock level for ${product.name} is below reorder point`,
        status: Math.random() > 0.5 ? 'ACTIVE' : 'DISMISSED',
        metadata: {
          currentStock: product.minStockLevel - 5,
          reorderPoint: product.reorderPoint,
          recommendedAction: 'Reorder soon',
        },
      },
    });
    alertCount++;
  }

  console.log(`✅ Created ${alertCount} alerts`);

  console.log('\n✨ Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Transactions: ${totalTransactions}`);
  console.log(`   Predictions: ${predictionCount}`);
  console.log(`   Alerts: ${alertCount}`);
  console.log(`\n🎯 Now you can test the LLM predictions with real data!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
