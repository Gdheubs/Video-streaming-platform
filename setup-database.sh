#!/bin/bash

echo "🚀 Setting up Video Streaming Platform Database..."
echo ""

# Configure PostgreSQL to allow local connections without password
echo "📝 Configuring PostgreSQL..."
sudo sed -i 's/local   all             postgres                                peer/local   all             all                                     trust/' /etc/postgresql/16/main/pg_hba.conf
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' /etc/postgresql/16/main/pg_hba.conf
sudo service postgresql restart

echo "✅ PostgreSQL configured"
echo ""

# Wait for PostgreSQL to restart
sleep 2

# Create database and user
echo "🗄️  Creating database..."
createdb -U postgres premium_stream_db 2>/dev/null || echo "Database already exists"

echo "👤 Creating user..."
psql -U postgres -d premium_stream_db -c "CREATE USER streamuser WITH PASSWORD 'streampass123';" 2>/dev/null || echo "User already exists"

echo "🔐 Granting privileges..."
psql -U postgres -d premium_stream_db -c "GRANT ALL PRIVILEGES ON DATABASE premium_stream_db TO streamuser;"
psql -U postgres -d premium_stream_db -c "ALTER DATABASE premium_stream_db OWNER TO streamuser;"
psql -U postgres -d premium_stream_db -c "GRANT ALL ON SCHEMA public TO streamuser;"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd /workspaces/Video-streaming-platform/server"
echo "2. npx prisma migrate dev --name init"
echo "3. npm run dev"
echo ""
