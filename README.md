# FabLab Admin Portal

A full-stack admin portal for managing FabLab inventory, student registration, and class data.

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL
- JWT Authentication

**Frontend:**
- React + TypeScript (Vite)
- TanStack Query
- Tailwind CSS
- React Router v6

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (for PostgreSQL)

### Setup

1. **Clone and install dependencies:**
```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

2. **Start PostgreSQL:**
```bash
docker-compose up -d
```

3. **Run database migrations:**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

4. **Start development servers:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

5. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Project Structure

```
fablabadminportal/
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, validation, etc.
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── types/     # TypeScript types
│   └── prisma/        # Database schema & migrations
├── frontend/          # React application
│   └── src/
│       ├── api/       # API client
│       ├── components/ # React components
│       ├── pages/     # Page components
│       ├── hooks/     # Custom hooks
│       └── context/   # React context
└── docker-compose.yml # PostgreSQL setup
```

## Features

- ✅ User authentication (JWT)
- ✅ Inventory management (CRUD)
- ✅ Search and filtering
- ✅ Stock tracking and alerts
- ✅ Audit logging
- 🔄 Student registration (coming soon)
- 🔄 Class management (coming soon)

## Development

### Database Schema Changes

Prisma makes schema changes easy:

1. Edit `backend/prisma/schema.prisma`
2. Run migration:
```bash
cd backend
npx prisma migrate dev --name your_change_description
```

### Environment Variables

**Backend (.env):**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed frontend origin

**Frontend (.env):**
- `VITE_API_URL` - Backend API URL

## License

MIT
