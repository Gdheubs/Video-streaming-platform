# 🚀 How to Run the Full Project

## ✨ Option 1: Single Command (Recommended)

Run both frontend and backend together with one command:

```bash
cd /workspaces/Video-streaming-platform
npm start
```

This will:
- ✅ Start the backend server on port 5000
- ✅ Start the frontend on port 3000
- ✅ Show logs from both in the same terminal
- ✅ Stop both when you press Ctrl+C

---

## 🎯 Option 2: Using the Startup Script

```bash
./start-all.sh
```

This script will:
- Check and start PostgreSQL and Redis if needed
- Clean up any old processes
- Start both servers with labeled output
- Handle graceful shutdown

---

## 📋 Option 3: Manual (Two Terminals)

If you prefer separate terminals for better log visibility:

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

## 🌐 Access Your Application

Once running, visit:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/health
- **Database GUI:** `cd server && npx prisma studio` (opens on http://localhost:5555)

---

## 🛑 How to Stop

- **If using `npm start` or `./start-all.sh`:** Press `Ctrl + C` once (stops both)
- **If using manual terminals:** Press `Ctrl + C` in each terminal

---

## 🔧 Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Kill processes on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Then try starting again
npm start
```

### Services Not Running

Make sure PostgreSQL and Redis are running:

```bash
# Start services
sudo service postgresql start
sudo service redis-server start

# Verify
redis-cli ping  # Should return PONG
pg_isready      # Should say "accepting connections"
```

### Logs Too Cluttered

If you want cleaner logs, use Option 3 (manual terminals) instead.

---

## 📊 What You'll See

When you run `npm start`, you'll see output like:

```
[server] 🚀 Server running on port 5000
[client] ▲ Next.js 14.0.0
[client] - Local: http://localhost:3000
[client] ✓ Ready in 2.2s
```

Both servers will run in the same terminal with prefixes showing which is which.

---

## ✅ Quick Start Checklist

Before running, make sure:

- [ ] PostgreSQL is installed and running
- [ ] Redis is installed and running
- [ ] You've run database migrations (`cd server && npx prisma migrate dev`)
- [ ] Environment files exist (server/.env and client/.env.local)

If any are missing, run:
```bash
./setup-database.sh  # Sets up PostgreSQL
./check-setup.sh     # Verifies everything
```

---

## 🎬 Complete Workflow

```bash
# 1. First time setup (only once)
./setup-database.sh
cd server && npx prisma migrate dev --name init

# 2. Every time you want to code
npm start

# 3. Open browser
# Visit http://localhost:3000

# 4. When done
# Press Ctrl+C
```

That's it! 🎉

---

## 💡 Pro Tips

1. **Auto-reload:** Both servers auto-reload when you save files
2. **Logs:** Frontend shows in blue `[client]`, backend in green `[server]`  
3. **Debugging:** Use separate terminals (Option 3) for clearer stack traces
4. **Database:** Keep Prisma Studio open in a 3rd terminal to watch data changes

---

## 📝 Available Commands

From the root directory:

```bash
npm start           # Start both servers
npm run server      # Start only backend
npm run client      # Start only frontend
npm run install-all # Install all dependencies
./start-all.sh      # Start with service checks
./check-setup.sh    # Verify configuration
```

---

**Choose Option 1 (`npm start`) for the easiest experience! 🚀**
