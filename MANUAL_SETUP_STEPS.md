# 🔧 Manual Setup Steps - Video Streaming Platform

## ✅ What Has Been Done Already

The following components are **already implemented** in your project:

### Backend (Server)
- ✅ Complete database schema with Prisma (10 models)
- ✅ All service files (age verification, transcoding, moderation, payments, etc.)
- ✅ All controller files (auth, video, admin)
- ✅ All route files with proper middleware
- ✅ Security middleware (JWT, rate limiting, sanitization)
- ✅ Express server setup with Helmet, CORS
- ✅ TypeScript configuration
- ✅ Dependencies installed and types fixed

### Frontend (Client)
- ✅ Next.js 14 setup with App Router
- ✅ Enhanced Video Player component with HLS support
- ✅ Watch page component
- ✅ Age verification page
- ✅ TailwindCSS configuration
- ✅ All dependencies installed

### Documentation
- ✅ IMPLEMENTATION_GUIDE.md
- ✅ SUMMARY.md
- ✅ DEPENDENCIES.md
- ✅ Environment templates (.env.example)

---

## 🔨 What You Need to Do Manually

### Step 1: Install System Dependencies

These tools must be installed on your system:

#### 1.1 Install PostgreSQL
```bash
# Check if PostgreSQL is installed
psql --version

# If not installed:
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo service postgresql start

# Create database
sudo -u postgres createdb premium_stream_db

# Create user and grant privileges
sudo -u postgres psql -c "CREATE USER streamuser WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE premium_stream_db TO streamuser;"
```

#### 1.2 Install Redis
```bash
# Check if Redis is installed
redis-cli --version

# If not installed:
sudo apt update
sudo apt install redis-server -y

# Start Redis service
sudo service redis-server start

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### 1.3 Install FFmpeg (CRITICAL for video transcoding)
```bash
# Check if FFmpeg is installed
ffmpeg -version

# If not installed:
sudo apt update
sudo apt install ffmpeg -y

# Verify installation
ffmpeg -version
```

---

### Step 2: Configure Environment Variables

#### 2.1 Server Environment (.env)
```bash
cd /workspaces/Video-streaming-platform/server
cp .env.example .env
nano .env
```

**Fill in these REQUIRED values:**

```bash
# Database (REQUIRED - Change password)
DATABASE_URL="postgresql://streamuser:your_secure_password@localhost:5432/premium_stream_db?schema=public"

# JWT Secret (REQUIRED - Generate random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server Config
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Redis (REQUIRED if using caching)
REDIS_URL=redis://localhost:6379

# AWS S3 (REQUIRED for video storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_VIDEOS=your-bucket-videos
AWS_S3_BUCKET_UPLOADS=your-bucket-uploads
AWS_S3_BUCKET_COMPLIANCE=your-bucket-compliance

# CloudFront (REQUIRED for CDN)
CLOUDFRONT_DOMAIN=https://your-distribution.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-key-pair-id

# Age Verification (OPTIONAL for testing, REQUIRED for production)
VERIFF_API_KEY=your_veriff_api_key
VERIFF_SECRET_KEY=your_veriff_secret_key

# Payment Processors (OPTIONAL for testing, REQUIRED for production)
CCBILL_ACCOUNT_NUMBER=your_ccbill_account
CCBILL_SUBACCOUNT=your_ccbill_subaccount
CCBILL_FLEX_FORM_ID=your_form_id
CCBILL_SALT=your_ccbill_salt

SEGPAY_MERCHANT_ID=your_segpay_merchant_id
SEGPAY_SECRET=your_segpay_secret

EPOCH_MERCHANT_ID=your_epoch_merchant_id
EPOCH_SECRET=your_epoch_secret

# Content Moderation (OPTIONAL for testing)
AWS_REKOGNITION_REGION=us-east-1
SIGHTENGINE_API_USER=your_sightengine_user
SIGHTENGINE_API_SECRET=your_sightengine_secret

# Admin Alerts (OPTIONAL)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Cookie Domain (leave empty for localhost)
COOKIE_DOMAIN=
```

#### 2.2 Client Environment (.env.local)
```bash
cd /workspaces/Video-streaming-platform/client
cp .env.example .env.local
nano .env.local
```

**Fill in:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### Step 3: Initialize Database

```bash
cd /workspaces/Video-streaming-platform/server

# Generate Prisma Client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Verify tables were created
npx prisma studio
# Opens GUI at http://localhost:5555 to view your database
```

---

### Step 4: Create Required Folders

```bash
cd /workspaces/Video-streaming-platform/server

# Create upload directories
mkdir -p uploads
mkdir -p public/videos
mkdir -p logs

# Set permissions
chmod 755 uploads public/videos
```

---

### Step 5: Generate JWT Secret

```bash
# Generate a secure random string for JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and paste it into server/.env as JWT_SECRET
```

---

### Step 6: AWS Setup (For Production)

#### 6.1 Create S3 Buckets
1. Log in to AWS Console
2. Go to S3
3. Create 3 buckets:
   - `your-app-videos` (for processed HLS videos)
   - `your-app-uploads` (for temporary uploads)
   - `your-app-compliance` (for encrypted ID documents)
4. Enable versioning on compliance bucket (legal requirement)

#### 6.2 Create CloudFront Distribution
1. Go to CloudFront in AWS Console
2. Create distribution pointing to your S3 video bucket
3. Enable "Restrict Bucket Access"
4. Create CloudFront Key Pair:
   - Go to Security Credentials
   - Create CloudFront Key Pair
   - Download private key → save as `server/private_key.pem`
   - Copy Key Pair ID → put in `.env` as `CLOUDFRONT_KEY_PAIR_ID`

#### 6.3 Setup IAM User
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-videos/*",
        "arn:aws:s3:::your-bucket-uploads/*",
        "arn:aws:s3:::your-bucket-compliance/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:StartContentModeration",
        "rekognition:GetContentModeration"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### Step 7: Test the Setup

#### 7.1 Start Backend
```bash
cd /workspaces/Video-streaming-platform/server
npm run dev

# Should see:
# 🚀 Server running on port 5000
```

**Common Errors & Fixes:**
- **"Cannot connect to database"**: Check PostgreSQL is running and DATABASE_URL is correct
- **"Redis connection failed"**: Start Redis with `sudo service redis-server start`
- **"Private key not found"**: Create dummy file `touch server/private_key.pem` for local testing

#### 7.2 Start Frontend
```bash
# Open NEW terminal tab
cd /workspaces/Video-streaming-platform/client
npm run dev

# Should see:
# ▲ Next.js 14.0.0
# - Local: http://localhost:3000
```

#### 7.3 Verify Health Check
```bash
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"2026-01-28T..."}
```

---

### Step 8: Create Test Data (Optional)

Create a test user via API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "username": "testuser"
  }'
```

---

### Step 9: Fix Remaining Code Issues

#### 9.1 CloudFront Private Key for Local Testing
For local development without CloudFront:
```bash
cd /workspaces/Video-streaming-platform/server

# Create dummy private key
cat > private_key.pem << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz...
(This is just a placeholder for local testing)
-----END RSA PRIVATE KEY-----
EOF
```

**Note:** For production, use real CloudFront private key from AWS.

#### 9.2 Update Video Player for Local Testing

If testing without CloudFront, update [server/src/controllers/enhanced-video.controller.ts](server/src/controllers/enhanced-video.controller.ts#L170-180):

```typescript
// Comment out CloudFront cookies for local testing
// const cookies = generateSignedCookies(`videos/${id}/*`);
// if (cookies) {
//   setCloudfrontCookies(res, cookies);
// }

res.json({
  url: video.hlsManifestUrl || `http://localhost:5000/videos/${id}/index.m3u8`,
  videoId: id,
});
```

---

### Step 10: Production Checklist

Before deploying to production:

#### Legal Requirements
- [ ] Register with Age Verification Provider (Veriff/Yoti)
- [ ] Designate USC 2257 Custodian of Records
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] Implement Cookie Consent Banner
- [ ] Setup DMCA takedown process

#### Payment Processing
- [ ] Apply for high-risk merchant account (CCBill/Segpay/Epoch)
- [ ] Configure webhook URLs in processor dashboard
- [ ] Test payment flow in sandbox mode
- [ ] Setup chargeback monitoring

#### Security
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure firewall rules
- [ ] Setup DDoS protection (Cloudflare)
- [ ] Enable database backups
- [ ] Configure log rotation
- [ ] Setup monitoring (Sentry/DataDog)

#### Infrastructure
- [ ] Deploy to production server (AWS/DigitalOcean)
- [ ] Setup auto-scaling for transcoding workers
- [ ] Configure CDN caching rules
- [ ] Setup database connection pooling
- [ ] Enable Redis persistence

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module @prisma/client"
```bash
cd server
npx prisma generate
```

### Issue 2: "Redis connection refused"
```bash
sudo service redis-server start
redis-cli ping
```

### Issue 3: "PostgreSQL connection failed"
```bash
sudo service postgresql start
# Check connection string in .env
```

### Issue 4: "FFmpeg not found"
```bash
sudo apt install ffmpeg -y
ffmpeg -version
```

### Issue 5: "Port 5000 already in use"
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in .env
```

### Issue 6: "CORS errors in browser"
Check that `ALLOWED_ORIGINS` in server/.env includes your frontend URL:
```bash
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📋 Quick Start Commands

Once setup is complete, use these commands daily:

```bash
# Terminal 1 - Start Backend
cd /workspaces/Video-streaming-platform/server && npm run dev

# Terminal 2 - Start Frontend  
cd /workspaces/Video-streaming-platform/client && npm run dev

# Terminal 3 - View Database
cd /workspaces/Video-streaming-platform/server && npx prisma studio
```

---

## 🎯 Testing the Complete Flow

1. **Register User**: `http://localhost:3000` → Sign up
2. **Age Verification**: Complete age verification flow
3. **Upload Video** (as creator): Upload test video
4. **Watch Video**: Navigate to watch page
5. **Subscribe**: Test subscription flow
6. **Admin Panel**: Access moderation queue

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check the [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
2. Review [SUMMARY.md](SUMMARY.md) for architecture overview
3. Check error logs in `server/logs/`
4. Verify all environment variables are set correctly
5. Ensure all system dependencies are installed

---

## ⚠️ Security Reminders

**NEVER commit these files to Git:**
- `.env` files
- `private_key.pem`
- `node_modules/`
- Database backups with real data
- Any file containing API keys

**The `.gitignore` is already configured, but double-check before pushing!**
