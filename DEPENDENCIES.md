# 📦 DEPENDENCIES TO INSTALL

## Server Dependencies

```bash
cd server

# Core dependencies (already installed)
npm install @aws-sdk/client-rekognition@^3.400.0
npm install @aws-sdk/client-s3@^3.400.0
npm install @aws-sdk/cloudfront-signer@^3.400.0
npm install @aws-sdk/s3-request-presigner@^3.400.0
npm install @prisma/client@^5.0.0
npm install axios@^1.5.0
npm install bcryptjs@^2.4.3
npm install cors@^2.8.5
npm install dotenv@^16.3.1
npm install express@^4.18.2
npm install fluent-ffmpeg@^2.1.2
npm install jsonwebtoken@^9.0.2
npm install multer@^1.4.5-lts.1

# NEW dependencies (need to install)
npm install helmet@^7.0.0
npm install ioredis@^5.3.0

# Dev dependencies
npm install -D @types/bcryptjs@^2.4.2
npm install -D @types/cors@^2.8.13
npm install -D @types/express@^4.17.17
npm install -D @types/fluent-ffmpeg@^2.1.21
npm install -D @types/jsonwebtoken@^9.0.2
npm install -D @types/multer@^1.4.7
npm install -D @types/node@^20.0.0
npm install -D prisma@^5.0.0
npm install -D ts-node-dev@^2.0.0
npm install -D typescript@^5.0.0
```

## Client Dependencies

```bash
cd client

# Core dependencies (already installed)
npm install axios@^1.5.0
npm install next@14.0.0
npm install react@^18
npm install react-dom@^18
npm install video.js@^8.5.0

# NEW dependencies (need to install)
npm install hls.js@^1.4.0

# Dev dependencies
npm install -D @types/node@^20
npm install -D @types/react@^18
npm install -D @types/video.js@^7.3.50
npm install -D autoprefixer@^10
npm install -D postcss@^8
npm install -D tailwindcss@^3
npm install -D typescript@^5
```

## System Dependencies

### FFmpeg (for video transcoding)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### PostgreSQL (database)

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Docker (recommended):**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=adult_platform \
  -p 5432:5432 \
  postgres:14-alpine
```

### Redis (caching)

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker (recommended):**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine
```

## Verification

After installation, verify:

```bash
# Check FFmpeg
ffmpeg -version

# Check PostgreSQL
psql --version

# Check Redis
redis-cli ping
# Should return: PONG

# Check Node.js
node --version
# Should be 18+

# Check npm
npm --version
```

## Quick Install Script

Create a file `install-deps.sh`:

```bash
#!/bin/bash

echo "Installing server dependencies..."
cd server
npm install
npm install helmet ioredis

echo "Installing client dependencies..."
cd ../client
npm install
npm install hls.js

echo "Generating Prisma client..."
cd ../server
npx prisma generate

echo "Done! ✅"
echo "Next steps:"
echo "1. Configure .env files"
echo "2. Start Redis: redis-server"
echo "3. Start PostgreSQL"
echo "4. Run migrations: cd server && npx prisma migrate dev"
echo "5. Start dev servers: npm run dev"
```

Make executable:
```bash
chmod +x install-deps.sh
./install-deps.sh
```

## Troubleshooting

### FFmpeg not found
```bash
# Add to PATH or use full path in code
which ffmpeg
# If not found, reinstall
```

### Prisma connection error
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
sudo systemctl status postgresql
```

### Redis connection refused
```bash
# Check if Redis is running
redis-cli ping
# If failed, start Redis
redis-server
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```
