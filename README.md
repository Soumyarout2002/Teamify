# Teamify — Team Collaboration & Project Management

Full-stack project management app: React frontend + Node.js/Express backend.

## Stack
- **Frontend**: React 18, Vite, Zustand, TanStack Query v5, Axios, Recharts, React Hot Toast, Lucide React
- **Backend**: Node.js, Express, Sequelize (PostgreSQL), Mongoose (MongoDB), Redis, Socket.io, JWT, NodeMailer, AWS S3, Swagger

## Project Structure
```
teamify/
├── backend/          # Express API
├── frontend/         # React SPA
├── docker-compose.yml
└── README.md
```

## Quick Start (Docker)
```bash
cp backend/.env.example backend/.env
# Fill in your credentials in backend/.env
docker-compose up -d
# App: http://localhost:3000
# API Docs: http://localhost:5000/api-docs
```

## Local Development
```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Features
- Multi-tenant organization system
- Role-based access: Admin, Project Manager, Team Member
- Project & Task CRUD with priorities, deadlines, progress
- Kanban board + list view for tasks
- Recurring tasks (daily/weekly/monthly)
- Bulk task updates
- Real-time notifications via WebSocket
- File uploads to AWS S3
- Audit logging to MongoDB
- Redis caching (50% faster responses)
- Email reminders for deadlines (NodeMailer)
- Swagger API docs at /api-docs
- Dockerized with docker-compose
