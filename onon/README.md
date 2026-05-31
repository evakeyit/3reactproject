# PDMS - Parcel Delivery Management System

**TransitPro Rwanda Ltd** — Inter-city parcel transportation management.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, express-session
- **Database:** MySQL (auto-created as `PDMS` on startup)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MySQL](https://dev.mysql.com/downloads/) 8+ running locally

## Quick Start

### 1. Configure MySQL

Edit `backend-project/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=PDMS
```

The database and all tables are **created automatically** when the backend starts.

### 2. Start Backend

```bash
cd backend-project
npm install
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Start Frontend

```bash
cd frontend-project
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Default Login

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

## Database Schema

| Table         | Fields |
|---------------|--------|
| Sender        | SenderID, Name, Phone |
| Receiver      | ReceiverID, Name, Phone |
| Parcel        | ParcelID, Description, Weight, Departure, Destination |
| ParcelRecord  | RecordDate, TransportFee, DeliveryStatus, PaymentStatus |
| Payment       | PaymentDate, ReceivedBy |

## Features

- Session-based authentication with protected routes
- Full CRUD for Senders, Receivers, Parcels, Parcel Records, Payments
- Dashboard with live statistics
- Printable reports per module
- Responsive UI with Tailwind CSS
- Auto payment status sync when payments are recorded

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/login` | Login |
| POST   | `/api/auth/logout` | Logout |
| GET    | `/api/auth/me` | Current user |
| CRUD   | `/api/senders` | Senders |
| CRUD   | `/api/receivers` | Receivers |
| CRUD   | `/api/parcels` | Parcels |
| CRUD   | `/api/parcel-records` | Parcel Records |
| CRUD   | `/api/payments` | Payments |
| GET    | `/api/dashboard/dashboard` | Dashboard stats |
| GET    | `/api/*/report/summary` | Module reports |
