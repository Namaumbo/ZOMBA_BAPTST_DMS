# ZBC Church Data Management System

A full-stack church member data management system built with **Flask** (REST API) and **Next.js** (frontend).

## Features

- Member registration with face photo (webcam capture or file upload)
- Role-based access: Admin / Data-Entry / Viewer
- Search, filter, and paginate member records
- Department / ministry management
- PDF and Excel report exports
- Mobile-friendly Progressive Web App (PWA)

---


## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

### 1. Database

```bash
createdb church_dms
```

### 2. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
flask --app run db init
flask --app run db migrate -m "initial"
flask --app run db upgrade

# Seed admin user + default departments
python seed.py

# Start API server
python run.py
```

API runs at `http://localhost:5000`

Default admin credentials: **admin / admin123**

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

---

## Project Structure

```
ZBC_DATA_SYSTEM/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routes/       # Flask blueprints
│   │   └── utils/        # Helpers
│   ├── uploads/          # Member photos (auto-created)
│   ├── requirements.txt
│   ├── config.py
│   ├── run.py
│   └── seed.py
└── frontend/
    ├── app/              # Next.js App Router pages
    ├── components/       # Reusable UI components
    ├── context/          # Auth + React Query providers
    └── lib/              # API client, types, utilities
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/auth/me | Current user |
| GET/POST | /api/v1/members | List / create members |
| GET/PUT/DELETE | /api/v1/members/:id | Single member |
| POST | /api/v1/members/:id/photo | Upload photo |
| GET/POST | /api/v1/departments | Departments |
| GET | /api/v1/reports/pdf | PDF export |
| GET | /api/v1/reports/excel | Excel export |
| GET | /api/v1/reports/stats | Dashboard stats |
| GET/POST | /api/v1/users | System users (admin) |
