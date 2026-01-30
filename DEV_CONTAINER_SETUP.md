# 🐳 Dev Container Specific Setup Guide

## Current Situation

You're running in a **GitHub Codespaces** dev container. Here's what's different:

### ✅ What's Already Done
- PostgreSQL 16 installed and running
- Redis installed and running  
- FFmpeg installed
- All Node.js dependencies installed
- Environment files created

### ⚠️ Dev Container Limitation

The `postgres` system user requires a password in this environment, which is different from standard Linux setups. We need to use an alternative approach.

---

## 🔧 Solution: Use SQLite for Development (Easier)

For local development in a dev container, you can use SQLite instead of PostgreSQL. It's much simpler and requires no setup.

### Option 1: Use SQLite (Recommended for Dev Container)

1. **Update Prisma Schema**
```bash
cd /workspaces/Video-streaming-platform/server
```

Edit `prisma/schema.prisma` and change the datasource:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. **Update .env**
```bash
nano .env
```

Change DATABASE_URL to:
```
DATABASE_URL="file:./prisma/dev.db"
```

3. **Run migrations**
```bash
npx prisma migrate dev --name init
```

That's it! SQLite creates the database file automatically.

---

## Option 2: Fix PostgreSQL (More Complex)

If you really need PostgreSQL, here's how to configure it for the dev container:

### Step 1: Configure PostgreSQL for Peer Authentication

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Find the line:
```
local   all             postgres                                peer
```

Change it to:
```
local   all             all                                     trust
```

Save and restart:
```bash
sudo service postgresql restart
```

### Step 2: Create Database

Now you can run without password:
```bash
createdb premium_stream_db
psql premium_stream_db -c "CREATE USER streamuser WITH PASSWORD 'streampass123';"
psql premium_stream_db -c "GRANT ALL PRIVILEGES ON DATABASE premium_stream_db TO streamuser;"
psql premium_stream_db -c "ALTER DATABASE premium_stream_db OWNER TO streamuser;"
```

### Step 3: Run Migrations

```bash
cd /workspaces/Video-streaming-platform/server
npx prisma migrate dev --name init
```

---

## ✅ Recommended: Quick Start with SQLite

**For dev containers, SQLite is the fastest path to getting started:**

```bash
cd /workspaces/Video-streaming-platform/server

# Update .env
sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:./prisma/dev.db"|' .env

# Update schema (temporarily, just for testing)
cat > prisma/schema-sqlite.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum UserRole {
  GUEST
  USER
  CREATOR
  ADMIN
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum VideoVisibility {
  PUBLIC
  PREMIUM
  PRIVATE
}

enum VideoStatus {
  UPLOADING
  PROCESSING
  READY
  FAILED
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}

model User {
  id                    String                @id @default(uuid())
  email                 String                @unique
  username              String                @unique
  password              String
  role                  UserRole              @default(USER)
  
  // Age Verification
  ageVerified           Boolean               @default(false)
  ageVerifiedAt         DateTime?
  ageVerificationToken  String?
  
  // Creator Profile
  creatorProfile        Creator?
  videos                Video[]
  
  // Subscriptions
  subscriptions         Subscription[]        @relation("UserSubscriptions")
  subscribers           Subscription[]        @relation("CreatorSubscriptions")
  
  // Engagement
  comments              Comment[]
  videoLikes            Like[]
  views                 View[]
  reports               Report[]
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
}

model Creator {
  id                    String                @id @default(uuid())
  userId                String                @unique
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // USC 2257 Compliance
  verificationStatus    VerificationStatus    @default(PENDING)
  complianceRecords     String?               // JSON encrypted with 2257 records
  
  // Monetization
  subscriptionPrice     Float                 @default(9.99)
  revenue               Float                 @default(0)
  payoutPending         Float                 @default(0)
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
}

model Video {
  id                    String                @id @default(uuid())
  title                 String
  description           String?
  
  // Storage
  originalFileUrl       String
  hlsManifestUrl        String?
  thumbnailUrl          String?
  spriteSheetUrl        String?
  
  visibility            VideoVisibility       @default(PUBLIC)
  status                VideoStatus           @default(PROCESSING)
  moderationStatus      ModerationStatus      @default(PENDING)
  
  durationSeconds       Int?
  viewCount             Int                   @default(0)
  likeCount             Int                   @default(0)
  
  // Tags and Categories
  tags                  String?
  category              String?
  isExplicit            Boolean               @default(true)
  
  // Creator
  creatorId             String
  creator               User                  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  // AI Moderation
  aiScanResult          String?               // JSON
  aiConfidenceScore     Float?
  
  // Relationships
  comments              Comment[]
  videoLikes            Like[]
  videoViews            View[]
  reports               Report[]
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  publishedAt           DateTime?
}

model Subscription {
  id                    String                @id @default(uuid())
  
  subscriberId          String
  subscriber            User                  @relation("UserSubscriptions", fields: [subscriberId], references: [id], onDelete: Cascade)
  
  creatorId             String
  creator               User                  @relation("CreatorSubscriptions", fields: [creatorId], references: [id], onDelete: Cascade)
  
  status                String                @default("ACTIVE")
  expiresAt             DateTime
  
  // Payment Info
  paymentProcessor      String?
  processorSubscriptionId String?
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
}

model Comment {
  id                    String                @id @default(uuid())
  content               String
  
  userId                String
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  videoId               String
  video                 Video                 @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
}

model Like {
  id                    String                @id @default(uuid())
  
  userId                String
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  videoId               String
  video                 Video                 @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime              @default(now())
}

model View {
  id                    String                @id @default(uuid())
  
  userId                String?
  user                  User?                 @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  videoId               String
  video                 Video                 @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  ipAddress             String?
  userAgent             String?
  watchDuration         Int                   @default(0)
  
  createdAt             DateTime              @default(now())
}

model Report {
  id                    String                @id @default(uuid())
  reason                String
  description           String?
  status                String                @default("PENDING")
  
  userId                String
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  videoId               String
  video                 Video                 @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
}

model AuditLog {
  id                    String                @id @default(uuid())
  action                String
  entityType            String
  entityId              String
  userId                String?
  ipAddress             String?
  metadata              String?               // JSON
  
  createdAt             DateTime              @default(now())
}
EOF

# Create migrations with SQLite
cp prisma/schema.prisma prisma/schema-postgres-backup.prisma
cp prisma/schema-sqlite.prisma prisma/schema.prisma

# Generate and migrate
npx prisma generate
npx prisma migrate dev --name init_sqlite

echo "✅ Database setup complete with SQLite!"
echo "You can now start the servers:"
echo "  Terminal 1: npm run dev"
echo "  Terminal 2: cd ../client && npm run dev"
```

---

## 🚀 Start Your App

Once database is set up (with either SQLite or PostgreSQL):

**Terminal 1 - Backend:**
```bash
cd /workspaces/Video-streaming-platform/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /workspaces/Video-streaming-platform/client
npm run dev
```

---

## 📝 Notes

- **SQLite** is perfect for development and testing
- **PostgreSQL** is needed for production with concurrent users
- You can switch back to PostgreSQL later when deploying
- All your code will work the same way with both databases (Prisma abstracts the differences)

---

## ✅ Quick Check

Run the setup checker:
```bash
./check-setup.sh
```

You should see all green checkmarks except possibly AWS services (which are optional for testing).
