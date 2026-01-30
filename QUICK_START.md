# 🚀 Quick Start Guide - Video Streaming Platform

## ⚡ What's Already Done

✅ All code files created  
✅ Dependencies installed  
✅ Environment files created  
✅ JWT secret generated  
✅ TypeScript configured  

## 📋 What You Need to Do (Manual Steps)

### Step 1: Install System Dependencies (REQUIRED)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo service postgresql start

# Install Redis
sudo apt install redis-server -y
sudo service redis-server start

# Install FFmpeg (for video processing)
sudo apt install ffmpeg -y

# Verify installations
psql --version
redis-cli ping  # Should return "PONG"
ffmpeg -version
```

---

### Step 2: Setup PostgreSQL Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE premium_stream_db;
CREATE USER streamuser WITH ENCRYPTED PASSWORD 'streampass123';
GRANT ALL PRIVILEGES ON DATABASE premium_stream_db TO streamuser;
ALTER DATABASE premium_stream_db OWNER TO streamuser;
\q
EOF

# Verify database was created
sudo -u postgres psql -l | grep premium_stream_db
```

---

### Step 3: Run Database Migrations

```bash
cd /workspaces/Video-streaming-platform/server

# Generate Prisma Client (already done, but run again to be sure)
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Open Prisma Studio to view your database (optional)
npx prisma studio
# Access at: http://localhost:5555
```

---

### Step 4: Create Required Directories

```bash
cd /workspaces/Video-streaming-platform/server

# Create upload and video storage directories
mkdir -p uploads
mkdir -p public/videos
mkdir -p logs

# Create dummy CloudFront private key for local testing
cat > private_key.pem << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAyDUMVELVLOCDpumVf3hdI1dEFQaWFuqFHvMQqJFIKLxU0c
(This is a placeholder for local testing without CloudFront)
-----END RSA PRIVATE KEY-----
EOF

chmod 600 private_key.pem
```

---

### Step 5: Start the Application

#### Terminal 1 - Backend Server
```bash
cd /workspaces/Video-streaming-platform/server
npm run dev

# You should see:
# 🚀 Server running on port 5000
```

#### Terminal 2 - Frontend (Open new terminal)
```bash
cd /workspaces/Video-streaming-platform/client
npm run dev

# You should see:
# ▲ Next.js 14.0.0
# - Local: http://localhost:3000
```

---

### Step 6: Test the Setup

```bash
# Test health endpoint
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"2026-01-28T..."}
```

Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/health

---

## 🐛 Troubleshooting Common Issues

### Issue: "PostgreSQL connection failed"

**Solution:**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# If not running, start it
sudo service postgresql start

# Verify connection
psql -h localhost -U streamuser -d premium_stream_db
# Password: streampass123
```

### Issue: "Redis connection refused"

**Solution:**
```bash
# Start Redis
sudo service redis-server start

# Test connection
redis-cli ping
# Should return: PONG
```

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
cd /workspaces/Video-streaming-platform/server
npx prisma generate
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in server/.env to 5001
```

### Issue: "FFmpeg not found"

**Solution:**
```bash
sudo apt install ffmpeg -y
which ffmpeg  # Should show: /usr/bin/ffmpeg
```

---

## 🧪 Create Test User

Once both servers are running, create a test user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "username": "testuser"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

---

## 📝 Daily Development Workflow

### Start Everything:
```bash
# Terminal 1 - Backend
cd /workspaces/Video-streaming-platform/server && npm run dev

# Terminal 2 - Frontend
cd /workspaces/Video-streaming-platform/client && npm run dev

# Terminal 3 - Database GUI (optional)
cd /workspaces/Video-streaming-platform/server && npx prisma studio
```

### Stop Everything:
Press `Ctrl + C` in each terminal

---

## 🎯 What Features Work Right Now

With just the basic setup above, you can:

- ✅ User registration and login
- ✅ JWT authentication
- ✅ API health checks
- ✅ Database operations
- ✅ Frontend UI rendering

## 🚧 Features That Need Additional Setup

These features are implemented but need external services:

- ⚠️ Age Verification (needs Veriff API key)
- ⚠️ Video Upload to S3 (needs AWS credentials)
- ⚠️ CloudFront CDN (needs CloudFront distribution)
- ⚠️ Payment Processing (needs CCBill/Segpay account)
- ⚠️ Content Moderation AI (needs AWS Rekognition)
- ⚠️ Video Transcoding (needs FFmpeg + S3 configured)

See [MANUAL_SETUP_STEPS.md](MANUAL_SETUP_STEPS.md) for production setup.

---

## 🔑 Current Environment Variables

Your `server/.env` is already configured with:

```
DATABASE_URL=postgresql://streamuser:streampass123@localhost:5432/premium_stream_db
JWT_SECRET=<auto-generated-secure-key>
PORT=5000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

**⚠️ IMPORTANT:** Change `streampass123` to a secure password before production!

---

## 📚 Next Steps

1. ✅ Complete Steps 1-5 above to get the platform running locally
2. Test user registration at http://localhost:3000
3. Review [MANUAL_SETUP_STEPS.md](MANUAL_SETUP_STEPS.md) for detailed configuration
4. Read [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for architecture overview
5. Check [SUMMARY.md](SUMMARY.md) for full feature list

---

## 🆘 Still Having Issues?

Run the setup checker:
```bash
./check-setup.sh
```

This will show you exactly what's missing.

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ `./check-setup.sh` shows all green checkmarks
2. ✅ Backend terminal shows "🚀 Server running on port 5000"
3. ✅ Frontend terminal shows Next.js ready
4. ✅ `curl http://localhost:5000/health` returns success
5. ✅ Browser opens http://localhost:3000 without errors

**If you see these, congratulations! Your platform is ready for development! 🎊**
