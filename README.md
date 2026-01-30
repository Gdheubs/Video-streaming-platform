# Premium Adult Video Streaming Platform

A scalable, full-stack video streaming platform featuring HLS adaptive streaming, secure signed cookies, age verification, and high-risk payment webhook integration.

## 🚀 Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Video.js
- **Backend:** Node.js, Express, Prisma (PostgreSQL)
- **Video Engine:** FFmpeg, AWS S3, CloudFront
- **Security:** JWT Auth, Age Verification Gate, Signed Cookies

## 🛠️ Setup Instructions

### 1. Environment Variables
Create a `.env` file in `./server` and `./client` based on the examples.

### 2. Install Dependencies
```bash
npm run install-all
```

### 3. Database Migration
```bash
cd server && npx prisma db push
```

### 4. Run Development
```bash
npm start
```

## 📂 Project Structure

```
premium-streaming-platform/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── watch/[id]/    # Video player page
│   │   ├── verify-age/    # Age verification page
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── VideoPlayer.tsx
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middlewares/   # Auth & validation
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── package.json           # Root package for monorepo

```

## 🔐 Security Features
- JWT Authentication
- Signed CloudFront Cookies for video access
- Age Verification Gate
- Secure payment webhook handling

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Videos
- `POST /api/videos/upload` - Upload video (authenticated)
- `GET /api/videos/:id/stream` - Get video stream URL (age verified)

### Payments
- `POST /api/payments/webhook` - Payment processor webhook
- `GET /api/payments/subscriptions` - Get user subscriptions

## 🚀 Deployment

### Prerequisites
- PostgreSQL database
- AWS account (S3 + CloudFront)
- CloudFront key pair for signed cookies
- FFmpeg installed on server

### Steps
1. Set up production environment variables
2. Configure CloudFront with signed cookies
3. Run database migrations: `npx prisma migrate deploy`
4. Build both client and server: `npm run build`
5. Deploy to your hosting platform

## 📄 License
MIT