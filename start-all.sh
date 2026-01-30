#!/bin/bash

echo "🚀 Starting Video Streaming Platform..."
echo ""

# Check if PostgreSQL and Redis are running
echo "📊 Checking services..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Starting Redis..."
    sudo service redis-server start
fi

if ! pg_isready -q; then
    echo "⚠️  Starting PostgreSQL..."
    sudo service postgresql start
fi

echo "✅ Services are running"
echo ""

# Kill any existing processes on ports 5000 and 3000
echo "🧹 Cleaning up old processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo ""
echo "🎬 Starting Backend (Port 5000)..."
echo "🎨 Starting Frontend (Port 3000)..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start both servers using trap to handle Ctrl+C
trap 'kill $(jobs -p); echo ""; echo "👋 Shutting down..."; exit 0' INT TERM

# Start backend in background
(
    cd server
    echo "📡 BACKEND: Starting server..."
    npm run dev 2>&1 | sed 's/^/[BACKEND] /'
) &

# Wait a moment for backend to initialize
sleep 2

# Start frontend in background
(
    cd client
    echo "🌐 FRONTEND: Starting Next.js..."
    npm run dev 2>&1 | sed 's/^/[FRONTEND] /'
) &

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Both servers are starting!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend:  http://localhost:5000"
echo "🗄️  Database: Run 'npx prisma studio' in another terminal"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for both background processes
wait
