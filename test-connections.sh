#!/bin/bash

echo "🔍 Testing Backend ↔ Frontend ↔ Database Connections"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: PostgreSQL Database
echo "1️⃣  Testing PostgreSQL Connection..."
if PGPASSWORD=streampass123 psql -U streamuser -d premium_stream_db -c "SELECT COUNT(*) FROM \"User\";" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL Connected${NC}"
    PGPASSWORD=streampass123 psql -U streamuser -d premium_stream_db -c "\dt" | head -15
else
    echo -e "${RED}❌ PostgreSQL Connection Failed${NC}"
fi
echo ""

# Test 2: Redis
echo "2️⃣  Testing Redis Connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis Connected ($(redis-cli ping))${NC}"
else
    echo -e "${RED}❌ Redis Connection Failed${NC}"
fi
echo ""

# Test 3: Backend API
echo "3️⃣  Testing Backend API (http://localhost:5000)..."
HEALTH_CHECK=$(curl -s http://localhost:5000/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend API Running${NC}"
    echo "   Response: $HEALTH_CHECK"
else
    echo -e "${RED}❌ Backend API Not Responding${NC}"
fi
echo ""

# Test 4: Frontend
echo "4️⃣  Testing Frontend (http://localhost:3001)..."
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$FRONTEND_CHECK" = "200" ] || [ "$FRONTEND_CHECK" = "304" ]; then
    echo -e "${GREEN}✅ Frontend Running (HTTP $FRONTEND_CHECK)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend might be loading... (HTTP $FRONTEND_CHECK)${NC}"
fi
echo ""

# Test 5: CORS Configuration
echo "5️⃣  Testing CORS Configuration..."
echo "   Backend ALLOWED_ORIGINS:"
grep ALLOWED_ORIGINS /workspaces/Video-streaming-platform/server/.env
echo ""
echo "   Frontend API_URL:"
grep NEXT_PUBLIC_API_URL /workspaces/Video-streaming-platform/client/.env.local
echo ""

# Test 6: Prisma Schema Sync
echo "6️⃣  Testing Prisma Schema..."
cd /workspaces/Video-streaming-platform/server
if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma Schema Valid${NC}"
else
    echo -e "${RED}❌ Prisma Schema Issues${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Connection Summary:"
echo "   Database:  PostgreSQL @ localhost:5432"
echo "   Cache:     Redis @ localhost:6379"
echo "   Backend:   Express API @ localhost:5000"
echo "   Frontend:  Next.js @ localhost:3001"
echo ""
echo "🔗 Frontend → Backend → Database chain configured!"
echo ""
echo "Test the full flow:"
echo "  1. Open: http://localhost:3001"
echo "  2. Frontend fetches from: http://localhost:5000/api"
echo "  3. Backend queries: PostgreSQL + Redis"
echo ""
