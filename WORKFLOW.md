# 📊 Project Workflow Guide

## Overview

This guide shows you how to use the AI-powered inventory system from the frontend, including complete workflows with sample data.

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Managing Products](#managing-products)
3. [Recording Transactions](#recording-transactions)
4. [Viewing Predictions](#viewing-predictions)
5. [Monitoring Alerts](#monitoring-alerts)
6. [Analyzing Data](#analyzing-data)
7. [Complete Sample Workflow](#complete-sample-workflow)

---

## Dashboard Overview

### Access the System

1. Open browser: **http://localhost:3001**
2. You'll see the main dashboard with:
   - Total products count
   - Current stock value
   - Low stock alerts
   - Recent predictions

---

## Managing Products

### Navigate to Products Page

**Frontend**: Click "Products" in the sidebar

**URL**: http://localhost:3001/products

### Create a New Product

**Step 1**: Click "Add New Product" button

**Step 2**: Fill in the form with sample data:

```
Product Name: Laptop Stand
SKU: DESK-LS-001
Category: Office Accessories
Current Stock: 150
Min Stock Level: 30
Max Stock Level: 300
Reorder Quantity: 100
Cost: $25.00
Price: $49.99
Description: Ergonomic aluminum laptop stand with adjustable height
```

**Step 3**: Click "Save Product"

### Sample Products Data

Here are 5 sample products you can create:

#### Product 1: Laptop Stand
```json
{
  "name": "Laptop Stand",
  "sku": "DESK-LS-001",
  "category": "Office Accessories",
  "currentStock": 150,
  "minStockLevel": 30,
  "maxStockLevel": 300,
  "reorderQuantity": 100,
  "cost": 25.00,
  "price": 49.99,
  "description": "Ergonomic aluminum laptop stand"
}
```

#### Product 2: Wireless Mouse
```json
{
  "name": "Wireless Mouse",
  "sku": "COMP-WM-002",
  "category": "Computer Accessories",
  "currentStock": 200,
  "minStockLevel": 50,
  "maxStockLevel": 400,
  "reorderQuantity": 150,
  "cost": 12.50,
  "price": 29.99,
  "description": "Ergonomic wireless mouse with USB receiver"
}
```

#### Product 3: USB-C Cable
```json
{
  "name": "USB-C Cable 2m",
  "sku": "CABLE-UC-003",
  "category": "Cables",
  "currentStock": 500,
  "minStockLevel": 100,
  "maxStockLevel": 1000,
  "reorderQuantity": 300,
  "cost": 3.50,
  "price": 12.99,
  "description": "High-speed USB-C charging and data cable"
}
```

#### Product 4: Desk Lamp
```json
{
  "name": "LED Desk Lamp",
  "sku": "LIGHT-DL-004",
  "category": "Lighting",
  "currentStock": 80,
  "minStockLevel": 20,
  "maxStockLevel": 200,
  "reorderQuantity": 60,
  "cost": 18.00,
  "price": 39.99,
  "description": "Adjustable LED desk lamp with touch control"
}
```

#### Product 5: Notebook
```json
{
  "name": "A5 Notebook",
  "sku": "STAT-NB-005",
  "category": "Stationery",
  "currentStock": 300,
  "minStockLevel": 80,
  "maxStockLevel": 600,
  "reorderQuantity": 200,
  "cost": 2.50,
  "price": 7.99,
  "description": "Hardcover A5 notebook with 200 pages"
}
```

### API: Create Product via Command Line

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Stand",
    "sku": "DESK-LS-001",
    "category": "Office Accessories",
    "currentStock": 150,
    "minStockLevel": 30,
    "maxStockLevel": 300,
    "reorderQuantity": 100,
    "cost": 25.00,
    "price": 49.99,
    "description": "Ergonomic aluminum laptop stand"
  }'
```

**Response**:
```json
{
  "id": "uuid-here",
  "name": "Laptop Stand",
  "sku": "DESK-LS-001",
  "currentStock": 150,
  "isActive": true,
  "createdAt": "2026-01-11T10:00:00.000Z"
}
```

### View Product Details

**Frontend**: Click on any product card

**Details shown**:
- Current stock level
- Stock status (In Stock / Low Stock / Critical)
- Cost and price
- Reorder information
- AI model status (if trained)

### Edit Product

**Frontend**: Click "Edit" button on product card

**API**:
```bash
curl -X PATCH http://localhost:3000/products/{productId} \
  -H "Content-Type: application/json" \
  -d '{"currentStock": 200}'
```

### Delete Product

**Frontend**: Click "Delete" button on product card

**API**:
```bash
curl -X DELETE http://localhost:3000/products/{productId}
```

---

## Recording Transactions

### Navigate to Inventory Page

**Frontend**: Click "Inventory" in the sidebar

**URL**: http://localhost:3001/inventory

### Transaction Types

1. **SALE** - Product sold (decreases stock)
2. **PURCHASE** - Product purchased (increases stock)
3. **ADJUSTMENT** - Stock adjustment (can increase or decrease)
4. **RETURN** - Product returned (increases stock)

### Record a Sale Transaction

**Step 1**: Click "Add Transaction" button

**Step 2**: Fill in the form:

```
Product: Laptop Stand (select from dropdown)
Transaction Type: SALE
Quantity: 5 (stock will decrease by 5)
Notes: Sold to customer ABC Corp
```

**Step 3**: Click "Save Transaction"

**What Happens**:
- ✅ Stock decreases from 150 to 145
- ✅ Transaction recorded in database
- 🦙 **Lag-Llama AI model is triggered** to update predictions
- 📊 New prediction generated after 7+ sales

### Sample Transaction Workflow

Let's create 15 sales transactions for "Laptop Stand" to train the AI model:

#### Week 1 (Days 1-7)
```json
Day 1: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -3}
Day 2: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -5}
Day 3: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -2}
Day 4: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -4}
Day 5: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -6}
Day 6: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -3}
Day 7: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -4}
```

#### Week 2 (Days 8-14)
```json
Day 8:  {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -5}
Day 9:  {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -7}
Day 10: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -3}
Day 11: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -4}
Day 12: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -6}
Day 13: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -2}
Day 14: {"productId": "laptop-stand-id", "transactionType": "SALE", "quantity": -5}
```

**Total Sales**: 59 units over 14 days
**Average Daily Demand**: ~4.2 units/day

### API: Create Transaction

```bash
curl -X POST http://localhost:3000/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "transactionType": "SALE",
    "quantity": -5,
    "notes": "Sold to customer ABC Corp"
  }'
```

**Response**:
```json
{
  "id": "transaction-uuid",
  "productId": "product-uuid",
  "transactionType": "SALE",
  "quantity": -5,
  "currentStock": 145,
  "createdAt": "2026-01-11T10:00:00.000Z"
}
```

### Batch Create Transactions (Testing)

Use this bash script to create 15 sample transactions:

```bash
#!/bin/bash
PRODUCT_ID="YOUR_PRODUCT_ID"
API_URL="http://localhost:3000/inventory"

# Week 1 sales
quantities=(-3 -5 -2 -4 -6 -3 -4 -5 -7 -3 -4 -6 -2 -5 -4)

for qty in "${quantities[@]}"; do
  echo "Creating transaction: $qty units"
  curl -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d "{\"productId\":\"$PRODUCT_ID\",\"transactionType\":\"SALE\",\"quantity\":$qty}"
  echo ""
  sleep 2  # Wait 2 seconds between transactions
done

echo "✅ All transactions created!"
```

### View Transaction History

**Frontend**: Scroll down on Inventory page to see transaction table

**Shows**:
- Transaction type
- Quantity
- Stock after transaction
- Date and time
- Notes

---

## Viewing Predictions

### Navigate to Predictions Page

**Frontend**: Click "Predictions" in the sidebar

**URL**: http://localhost:3001/predictions

### How Predictions Work

1. **Minimum Data Required**: 7+ sales transactions
2. **AI Model**: Lag-Llama LLM analyzes historical sales
3. **Prediction**: Forecasts demand for next 7 days
4. **Updates**: Model retrains after each new sale

### Prediction Card Information

Each prediction card shows:

```
Product: Laptop Stand
Current Stock: 145 units
Predicted Demand (7 days): 30 units
Confidence: 87%
Model: Lag-Llama LLM

⚠️ Alert Predictions:
  Low Stock Alert in: 28 days
  Critical Stock Alert in: 35 days

📈 Trend: Increasing
📊 Historical Average: 4.2 units/day
```

### API: Get Prediction

```bash
curl http://localhost:3000/predictions/{productId}
```

**Response**:
```json
{
  "id": "prediction-uuid",
  "productId": "product-uuid",
  "predictedDemand": 30,
  "confidence": 87,
  "predictionDate": "2026-01-18T00:00:00.000Z",
  "daysAhead": 7,
  "metadata": {
    "method": "🦙 Lag-Llama LLM",
    "algorithm": "Transformer-based Time Series Forecasting",
    "trend": "📈 Increasing",
    "trendStrength": "65.3%",
    "trainingDataPoints": 14,
    "hasSeasonality": true,
    "lowerBound": 25,
    "upperBound": 35
  }
}
```

### Understanding Confidence Levels

- **90-100%**: High confidence - Strong prediction accuracy
- **80-89%**: Good confidence - Reliable predictions
- **70-79%**: Moderate confidence - Use with caution
- **Below 70%**: Low confidence - Need more data

### Prediction Intervals

The system provides confidence intervals:

```
Predicted Demand: 30 units

Confidence Range (10th-90th percentile):
  Lower Bound: 25 units (pessimistic)
  Median: 30 units (most likely)
  Upper Bound: 35 units (optimistic)
```

**Use Cases**:
- **Lower Bound**: Safety stock calculation
- **Median**: Regular ordering
- **Upper Bound**: Peak demand preparation

---

## Monitoring Alerts

### Navigate to Alerts Page

**Frontend**: Click "Alerts" in the sidebar

**URL**: http://localhost:3001/alerts

### Alert Types

1. **LOW_STOCK**: Stock below min level (30 units)
2. **CRITICAL_STOCK**: Stock critically low (below 15 units)
3. **OVERSTOCK**: Stock above max level (300 units)
4. **REORDER**: Time to reorder

### Alert Statuses

- 🟡 **PENDING**: Alert active, action needed
- ✅ **RESOLVED**: Alert resolved (stock replenished)
- ❌ **DISMISSED**: Alert dismissed by user

### Sample Alert Workflow

**Scenario**: Laptop Stand stock drops to 25 units

1. **Alert Generated Automatically**:
   ```
   Alert Type: LOW_STOCK
   Product: Laptop Stand
   Current Stock: 25 units
   Min Stock Level: 30 units
   Status: PENDING
   Message: "Stock below minimum level"
   ```

2. **Action Taken**: Create purchase transaction
   ```bash
   curl -X POST http://localhost:3000/inventory \
     -H "Content-Type: application/json" \
     -d '{
       "productId": "laptop-stand-id",
       "transactionType": "PURCHASE",
       "quantity": 100,
       "notes": "Reorder from supplier XYZ"
     }'
   ```

3. **Alert Auto-Resolved**: Stock now 125 units (above min)

### API: Get All Alerts

```bash
curl http://localhost:3000/alerts
```

### API: Resolve Alert

```bash
curl -X PATCH http://localhost:3000/alerts/{alertId} \
  -H "Content-Type: application/json" \
  -d '{"status": "RESOLVED"}'
```

---

## Analyzing Data

### Navigate to Analytics Page

**Frontend**: Click "Analytics" in the sidebar

**URL**: http://localhost:3001/analytics

### Available Analytics

#### 1. Sales Report (Bar Chart)
```
X-axis: Days
Y-axis: Sales Quantity
Shows: Daily sales trend over time
```

#### 2. Revenue Distribution (Pie Chart)
```
Shows: Revenue by product category
Helps: Identify best-performing categories
```

#### 3. Top Products (Bar Chart)
```
Shows: Products by total sales volume
Helps: Identify inventory priorities
```

#### 4. Stock Status (Summary Cards)
```
- Total Products
- Low Stock Items
- Critical Stock Items
- Total Stock Value
```

### API: Get Analytics

```bash
# Sales report
curl http://localhost:3000/analytics/sales-report

# Top products
curl http://localhost:3000/analytics/top-products
```

---

## Complete Sample Workflow

### End-to-End Scenario: Setting Up a New Product

**Goal**: Add a new product, record sales, and get AI predictions

#### Step 1: Create Product (Frontend)

1. Navigate to **Products** page
2. Click "Add New Product"
3. Enter data:
   ```
   Name: Wireless Keyboard
   SKU: COMP-WK-006
   Category: Computer Accessories
   Current Stock: 100
   Min Stock: 20
   Max Stock: 200
   Reorder Qty: 80
   Cost: $15.00
   Price: $39.99
   ```
4. Click "Save"
5. **Note the Product ID** (shown in URL or response)

#### Step 2: Record 15 Sales Transactions

Use the following bash script:

```bash
#!/bin/bash
PRODUCT_ID="your-product-id-here"

# Simulated 2 weeks of sales
sales=(-3 -5 -2 -4 -6 -3 -4 -5 -7 -3 -4 -6 -2 -5 -4)

echo "🛒 Recording sales transactions..."
for i in "${!sales[@]}"; do
  day=$((i + 1))
  qty="${sales[$i]}"
  
  echo "Day $day: Selling ${qty#-} units"
  
  curl -X POST http://localhost:3000/inventory \
    -H "Content-Type: application/json" \
    -d "{
      \"productId\": \"$PRODUCT_ID\",
      \"transactionType\": \"SALE\",
      \"quantity\": $qty,
      \"notes\": \"Day $day sales\"
    }" \
    --silent --output /dev/null
  
  echo " ✅"
  sleep 2
done

echo "🎉 All transactions recorded!"
```

#### Step 3: Check AI Model Training

After 7+ transactions, check backend logs:

```bash
tail -f logs/backend.log | grep "Lag-Llama"
```

**Expected logs**:
```
🦙 Requesting Lag-Llama prediction for {productId}...
✅ Lag-Llama model updated for {productId} (confidence: 10th-90th percentile)
```

#### Step 4: View Prediction (Frontend)

1. Navigate to **Predictions** page
2. Find "Wireless Keyboard" card
3. See prediction details:
   ```
   Predicted Demand (7 days): 28 units
   Confidence: 85%
   Trend: Stable
   Current Stock: 41 units
   
   Alert Predictions:
   Low Stock Alert in: 15 days
   Critical Stock Alert in: 22 days
   ```

#### Step 5: View Prediction (API)

```bash
curl http://localhost:3000/predictions/$PRODUCT_ID | jq
```

**Response**:
```json
{
  "id": "...",
  "productId": "...",
  "predictedDemand": 28,
  "confidence": 85,
  "metadata": {
    "method": "🦙 Lag-Llama LLM",
    "trend": "➡️ Stable",
    "trendStrength": "45.2%",
    "volatility": "8.3%",
    "trainingDataPoints": 15,
    "hasSeasonality": true,
    "lowerBound": 24,
    "upperBound": 32
  }
}
```

#### Step 6: Monitor Stock (Frontend)

1. Navigate to **Inventory** page
2. View transaction history table
3. See current stock: **41 units**
4. Check if any alerts generated

#### Step 7: View Analytics (Frontend)

1. Navigate to **Analytics** page
2. See "Wireless Keyboard" in charts:
   - Sales report showing daily trend
   - Revenue contribution
   - Ranking in top products

#### Step 8: Plan Reordering

Based on prediction:
```
Current Stock: 41 units
Predicted Demand (7 days): 28 units
Remaining after 7 days: 13 units

Action: Reorder soon!
Min Stock Level: 20 units
Days until low stock: ~15 days
Reorder Quantity: 80 units
```

---

## API Reference Quick Guide

### Products

```bash
# List all products
GET http://localhost:3000/products

# Get single product
GET http://localhost:3000/products/{id}

# Create product
POST http://localhost:3000/products
Body: {name, sku, currentStock, minStockLevel, maxStockLevel, ...}

# Update product
PATCH http://localhost:3000/products/{id}
Body: {currentStock: 200}

# Delete product
DELETE http://localhost:3000/products/{id}

# Get product AI model info
GET http://localhost:3000/products/{id}/model
```

### Inventory Transactions

```bash
# List transactions
GET http://localhost:3000/inventory

# Create transaction
POST http://localhost:3000/inventory
Body: {productId, transactionType, quantity, notes}

# Get product transaction history
GET http://localhost:3000/inventory/product/{productId}
```

### Predictions

```bash
# Get prediction for product
GET http://localhost:3000/predictions/{productId}

# Generate predictions for all products
POST http://localhost:3000/predictions/generate
```

### Alerts

```bash
# List all alerts
GET http://localhost:3000/alerts

# Get pending alerts
GET http://localhost:3000/alerts?status=PENDING

# Resolve alert
PATCH http://localhost:3000/alerts/{id}
Body: {status: "RESOLVED"}
```

### Analytics

```bash
# Get sales report
GET http://localhost:3000/analytics/sales-report

# Get top products
GET http://localhost:3000/analytics/top-products

# Get revenue summary
GET http://localhost:3000/analytics/revenue
```

---

## Best Practices

### 1. Data Quality
- ✅ Record transactions promptly
- ✅ Use consistent transaction types
- ✅ Add notes to transactions for context

### 2. AI Model Accuracy
- ✅ Minimum 7 transactions for predictions
- ✅ Recommended 30+ transactions for best accuracy
- ✅ Regular sales data improves model over time

### 3. Stock Management
- ✅ Set realistic min/max stock levels
- ✅ Monitor alerts daily
- ✅ Review predictions weekly
- ✅ Plan reorders based on AI predictions

### 4. Performance Monitoring
- ✅ Check backend logs for errors
- ✅ Verify Lag-Llama service is running
- ✅ Monitor prediction confidence scores
- ✅ Compare predictions vs actual demand

---

## Troubleshooting

### "No prediction available"

**Cause**: Less than 7 sales transactions

**Solution**: Add more sales transactions (see Step 2 in complete workflow)

### "Lag-Llama service unavailable"

**Cause**: Python service not running

**Solution**:
```bash
cd llm-service
./start.sh
```

### Stock not updating after transaction

**Cause**: API error or database issue

**Solution**: Check backend logs:
```bash
tail -f logs/backend.log
```

---

**Ready to use!** Follow the workflows above to manage your inventory with AI-powered predictions. 🚀






