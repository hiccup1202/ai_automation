#!/bin/bash

# ============================================
# Prisma Database Reset Script
# ============================================
# This script completely resets Prisma and the database

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔄 PRISMA DATABASE RESET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create .env file with DATABASE_URL"
    exit 1
fi

echo "⚠️  WARNING: This will DELETE ALL DATA in your database!"
echo ""
read -p "   Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Reset cancelled."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Starting reset process..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Delete migration files
echo "📁 Step 1: Removing old migrations..."
if [ -d "prisma/migrations" ]; then
    rm -rf prisma/migrations
    echo "   ✅ Migrations deleted"
else
    echo "   ℹ️  No migrations folder found"
fi
echo ""

# Step 2: Delete Prisma Client
echo "📦 Step 2: Removing Prisma Client..."
if [ -d "node_modules/.prisma" ]; then
    rm -rf node_modules/.prisma
    echo "   ✅ Prisma Client deleted"
fi
if [ -d "node_modules/@prisma/client" ]; then
    rm -rf node_modules/@prisma/client
    echo "   ✅ @prisma/client deleted"
fi
echo ""

# Step 3: Reset database using Prisma
echo "🗃️  Step 3: Resetting database..."
npx prisma migrate reset --force --skip-seed
echo "   ✅ Database reset complete"
echo ""

# Step 4: Generate Prisma Client
echo "🔧 Step 4: Generating Prisma Client..."
npx prisma generate
echo "   ✅ Prisma Client generated"
echo ""

# Step 5: Verify setup
echo "✅ Step 5: Verifying setup..."
npx prisma validate
echo "   ✅ Schema is valid"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ RESET COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Next steps:"
echo "   1. Run: npm run start:dev"
echo "   2. Add sample data via API or Prisma Studio"
echo "   3. Test your application"
echo ""
echo "💡 Useful commands:"
echo "   - npx prisma studio     (Open database GUI)"
echo "   - npx prisma migrate status  (Check migrations)"
echo ""




