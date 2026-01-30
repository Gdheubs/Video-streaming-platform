#!/bin/bash

echo "🔍 Checking Video Streaming Platform Setup..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    if sudo service postgresql status | grep -q "is running"; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ Installed but not running${NC}"
        echo "  Run: sudo service postgresql start"
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: sudo apt install postgresql -y"
fi

# Check Redis
echo -n "Checking Redis... "
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ Installed but not running${NC}"
        echo "  Run: sudo service redis-server start"
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: sudo apt install redis-server -y"
fi

# Check FFmpeg
echo -n "Checking FFmpeg... "
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: sudo apt install ffmpeg -y"
fi

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node -v)
    echo -e "${GREEN}✓ $VERSION${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

echo ""
echo "📁 Checking Project Files..."

# Check server .env
echo -n "Server .env file... "
if [ -f "/workspaces/Video-streaming-platform/server/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
    
    # Check critical variables
    if grep -q "DATABASE_URL=" "/workspaces/Video-streaming-platform/server/.env"; then
        echo -e "  ${GREEN}✓${NC} DATABASE_URL configured"
    else
        echo -e "  ${RED}✗${NC} DATABASE_URL missing"
    fi
    
    if grep -q "JWT_SECRET=" "/workspaces/Video-streaming-platform/server/.env" && ! grep -q "JWT_SECRET=\"\"" "/workspaces/Video-streaming-platform/server/.env"; then
        echo -e "  ${GREEN}✓${NC} JWT_SECRET configured"
    else
        echo -e "  ${YELLOW}⚠${NC} JWT_SECRET not set"
    fi
else
    echo -e "${RED}✗ Missing${NC}"
    echo "  Run: cp server/.env.example server/.env"
fi

# Check client .env
echo -n "Client .env.local file... "
if [ -f "/workspaces/Video-streaming-platform/client/.env.local" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Missing${NC}"
    echo "  Run: cp client/.env.example client/.env.local"
fi

# Check Prisma
echo -n "Prisma Client... "
if [ -d "/workspaces/Video-streaming-platform/server/node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓ Generated${NC}"
else
    echo -e "${RED}✗ Not generated${NC}"
    echo "  Run: cd server && npx prisma generate"
fi

# Check database migrations
echo -n "Database Migrations... "
if [ -d "/workspaces/Video-streaming-platform/server/prisma/migrations" ]; then
    echo -e "${GREEN}✓ Exist${NC}"
else
    echo -e "${YELLOW}⚠ Not run yet${NC}"
    echo "  Run: cd server && npx prisma migrate dev --name init"
fi

echo ""
echo "🔑 Environment Variables Status:"
if [ -f "/workspaces/Video-streaming-platform/server/.env" ]; then
    source "/workspaces/Video-streaming-platform/server/.env" 2>/dev/null
    
    [ -n "$DATABASE_URL" ] && echo -e "  ${GREEN}✓${NC} DATABASE_URL" || echo -e "  ${RED}✗${NC} DATABASE_URL"
    [ -n "$JWT_SECRET" ] && echo -e "  ${GREEN}✓${NC} JWT_SECRET" || echo -e "  ${RED}✗${NC} JWT_SECRET"
    [ -n "$REDIS_URL" ] && echo -e "  ${GREEN}✓${NC} REDIS_URL" || echo -e "  ${YELLOW}⚠${NC} REDIS_URL (optional for testing)"
    [ -n "$AWS_ACCESS_KEY_ID" ] && echo -e "  ${GREEN}✓${NC} AWS_ACCESS_KEY_ID" || echo -e "  ${YELLOW}⚠${NC} AWS_ACCESS_KEY_ID (optional for testing)"
fi

echo ""
echo "📦 Required Dependencies:"

# Check server dependencies
cd /workspaces/Video-streaming-platform/server
echo -n "  Server packages... "
if npm list express bcryptjs jsonwebtoken @prisma/client &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Some missing${NC}"
fi

# Check client dependencies
cd /workspaces/Video-streaming-platform/client
echo -n "  Client packages... "
if npm list next react axios video.js &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Some missing${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo ""
echo "1. If any system dependencies are missing, install them"
echo "2. Configure server/.env with your database credentials"
echo "3. Run: cd server && npx prisma migrate dev --name init"
echo "4. Start servers:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo "See MANUAL_SETUP_STEPS.md for detailed instructions"
echo ""
