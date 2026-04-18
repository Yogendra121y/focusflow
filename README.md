# FocusFlow — Personal Productivity Dashboard

> Full-stack productivity app: React + Node.js + MySQL + JWT Auth


## Project Structure

focusflow/
├── backend/
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── goalController.js
│   │   ├── journalController.js
│   │   ├── analyticsController.js
│   │   └── timePlannerController.js
│   ├── routes/               # Express route definitions
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   ├── goals.js
│   │   ├── journal.js
│   │   ├── analytics.js
│   │   └── timePlanner.js
│   ├── models/               # Sequelize ORM models
│   │   ├── index.js          # Associations + DB connection
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Goal.js
│   │   ├── Milestone.js
│   │   ├── Journal.js
│   │   ├── ProductivityLog.js
│   │   └── TimeBlock.js
│   ├── middleware/
│   │   ├── auth.js           # JWT protect/authorize
│   │   ├── errorHandler.js   # Global error handler
│   │   └── validation.js     # express-validator rules
│   ├── config/
│   │   └── database.js       # Sequelize config (dev/test/prod)
│   ├── .env.example
│   ├── package.json
│   └── server.js             # Entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       └── AppLayout.jsx   # Sidebar + routing shell
    │   ├── context/
    │   │   ├── authStore.js        # Zustand auth store
    │   │   └── themeStore.js       # Dark/light theme store
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── TasksPage.jsx
    │   │   ├── GoalsPage.jsx
    │   │   ├── JournalPage.jsx
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── TimePlannerPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── services/
    │   │   └── api.js              # Axios instance + all API calls
    │   ├── App.js                  # Router + protected routes
    │   └── index.js
    ├── package.json
    └── tailwind.config.js


## Database Schema (MySQL)

sql
-- Run this to create your database
CREATE DATABASE focusflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sequelize handles table creation via sync({ alter: true }) in development
-- For production, use migrations: npx sequelize-cli db:migrate

-- Schema overview (Sequelize auto-creates these):
-- users          (id UUID PK, name, email UNIQUE, password, role, streak, totalXp, preferences JSON, ...)
-- tasks          (id UUID PK, userId FK→users, goalId FK→goals, title, priority ENUM, status ENUM, category ENUM, dueDate, ...)
-- goals          (id UUID PK, userId FK→users, title, category ENUM, status ENUM, deadline, progress FLOAT, ...)
-- milestones     (id UUID PK, goalId FK→goals, title, status ENUM, dueDate, order INT, ...)
-- journals       (id UUID PK, userId FK→users, title, content TEXT, mood ENUM, date DATE, wordCount, ...)
-- productivity_logs (id UUID PK, userId FK→users, date DATE UNIQUE per user, completedTasks, score, ...)
-- time_blocks    (id UUID PK, userId FK→users, taskId FK→tasks, title, date DATE, startTime, endTime, color, ...)



## API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET  | `/api/auth/me` | Get current user profile |
| PUT  | `/api/auth/profile` | Update name, timezone, preferences |
| PUT  | `/api/auth/password` | Change password |
| DELETE | `/api/auth/account` | Deactivate account |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks` | Get all tasks (filter: status, priority, category, search, sortBy) |
| GET | `/api/tasks/today` | Get today's tasks + overdue |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/bulk` | Bulk update (status, order) |

### Goals & Milestones
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/goals` | Get all goals |
| POST | `/api/goals` | Create goal (with optional milestones) |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| POST | `/api/goals/:id/milestones` | Add milestone |
| PUT | `/api/goals/:goalId/milestones/:milestoneId` | Update milestone (auto-recalculates progress) |
| DELETE | `/api/goals/:goalId/milestones/:milestoneId` | Delete milestone |

### Journal
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/journal` | Get entries (filter: search, mood, date range) |
| GET | `/api/journal/date/:date` | Get entry by date (e.g. 2025-01-15) |
| POST | `/api/journal` | Create entry |
| PUT | `/api/journal/:id` | Update entry |
| DELETE | `/api/journal/:id` | Delete entry |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/dashboard` | Today stats + streaks |
| GET | `/api/analytics/weekly` | Last 7 days with daily breakdown |
| GET | `/api/analytics/monthly` | Monthly report (params: year, month) |
| GET | `/api/analytics/categories` | Task breakdown by category (param: period) |
| GET | `/api/analytics/trends` | Score trends (param: days) |

### Time Planner
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/time-planner/:date` | Get blocks for date |
| POST | `/api/time-planner` | Create block (validates no overlap) |
| PUT | `/api/time-planner/:id` | Update block |
| DELETE | `/api/time-planner/:id` | Delete block |



## Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone & Install

```-bash
git clone <your-repo>
cd focusflow
```
```# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials and a secure JWT_SECRET
```
```# Frontend
cd ../frontend
npm install
```
### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE focusflow_db;
EXIT;

# Tables are auto-created on first start (sync: alter)
# For production, generate migrations instead:
# cd backend && npx sequelize-cli migration:generate --name create-users
```

### 3. Configure .env

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=focusflow_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_minimum_32_char_secret_here_change_this
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 4. Run Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev
# → API running on http://localhost:5000

# Terminal 2 - Frontend
cd frontend && npm start
# → App running on http://localhost:3000
```

---

## Production Deployment

### Option A: Railway (Backend) + Vercel (Frontend) + PlanetScale (MySQL)

#### Backend → Railway
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

cd backend
railway init
railway add mysql   # provisions MySQL automatically

# Set env vars in Railway dashboard:
# JWT_SECRET, NODE_ENV=production, CLIENT_URL=https://your-app.vercel.app

railway up
```

#### Frontend → Vercel
```bash
cd frontend

# Add to package.json build script if needed:
# "build": "REACT_APP_API_URL=https://your-railway-app.up.railway.app/api react-scripts build"

# Or set in Vercel env vars: REACT_APP_API_URL

vercel --prod
```

#### PlanetScale (free MySQL in cloud)
```bash
# 1. Create account at planetscale.com
# 2. Create database 'focusflow-db'
# 3. Get connection string from dashboard
# 4. Update backend .env with PlanetScale credentials
# 5. Add dialectOptions.ssl config (already in production config)
```

### Option B: Render (Backend) + Netlify (Frontend)

```bash
# Backend → Render
# 1. Connect GitHub repo on render.com
# 2. Build Command: cd backend && npm install
# 3. Start Command: cd backend && node server.js
# 4. Add MySQL addon or connect PlanetScale

# Frontend → Netlify
# 1. Build Command: cd frontend && npm run build
# 2. Publish Directory: frontend/build
# 3. Set REACT_APP_API_URL env var
```

### Option C: VPS (DigitalOcean / AWS EC2)

```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs npm mysql-server nginx

# Clone & setup
git clone <repo> /var/www/focusflow
cd /var/www/focusflow/backend && npm install --production
cd /var/www/focusflow/frontend && npm install && npm run build

# PM2 for Node process management
npm install -g pm2
pm2 start backend/server.js --name focusflow-api
pm2 save && pm2 startup

# Nginx reverse proxy config
# /etc/nginx/sites-available/focusflow
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        root /var/www/focusflow/frontend/build;
        index index.html;
        try_files $uri /index.html;
    }
}
```

---

## Security Checklist

- [x] Passwords hashed with bcrypt (12 salt rounds)
- [x] JWT with expiration (7d default)
- [x] Rate limiting on all routes (100 req/15min, 10 req/15min for auth)
- [x] Helmet.js security headers
- [x] CORS with whitelist
- [x] Input validation & sanitization (express-validator)
- [x] SQL injection protection (Sequelize parameterized queries)
- [x] User data isolation (userId checks on every query)
- [x] XSS protection via Content-Security-Policy header
- [ ] HTTPS (configure SSL cert via Let's Encrypt)
- [ ] Refresh token rotation (enhancement)
- [ ] 2FA (enhancement)

---

## Optional Enhancements (Next Steps)

1. **AI Suggestions** — Call OpenAI API to analyze productivity patterns and suggest improvements
2. **Notifications** — Use node-cron + nodemailer for daily digest emails
3. **Calendar Sync** — Google Calendar OAuth integration
4. **Mobile App** — React Native with shared API
5. **Real-time** — Socket.io for live collaboration
6. **Export** — CSV/PDF export for analytics reports
7. **Gamification** — Achievements, badges, leaderboards
8. **Webhooks** — Integration with Slack, Notion, etc.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Recharts |
| State Management | Zustand |
| HTTP Client | Axios (interceptors for auth + errors) |
| Routing | React Router v6 |
| Backend | Node.js, Express.js |
| ORM | Sequelize v6 |
| Database | MySQL 8.0 |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Security | Helmet, CORS, rate-limit |
| Deployment | Railway/Render + Vercel/Netlify |

---

Built with ❤️ by YOGENDRA MEENA
#   f o c u s f l o w 
 
 
