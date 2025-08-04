# Plink Logistics Parcel Delivery System

A comprehensive parcel delivery management system built with **NestJS** (backend) and **Angular** (frontend).

## Features

### Core Features

- **User Management**: Admin and Customer roles with authentication
- **Parcel Management**: Create, track, and manage parcel deliveries
- **Real-time Tracking**: Live location updates with map integration
- **Email Notifications**: Automated notifications for status changes
- **Admin Dashboard**: Comprehensive management interface
- **Customer Portal**: User-friendly interface for customers

### Technical Features

- **JWT Authentication** with role-based access control
- **Real-time Updates** using events
- **Soft Delete** implementation
- **Pagination** and search functionality
- **Map Integration** with Leaflet and OpenStreetMap
- **State Management** with NgRx
- **Responsive Design** with Tailwind CSS

## Tech Stack

### Backend

- **NestJS** - Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Bull** - Queue management
- **Redis** - Caching and queues

### Frontend

- **Angular 20** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **NgRx** - State management
- **Tailwind CSS** - Styling
- **Angular Material** - UI components
- **Leaflet** - Map integration

## Project Structure

```
plink/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── parcels/        # Parcel management
│   │   ├── admin/          # Admin functionality
│   │   ├── mail/           # Email service
│   │   ├── prisma/         # Database service
│   │   ├── shared/         # Shared utilities
│   │   └── common/         # Common DTOs and types
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/       # Authentication module
│   │   │   ├── user/       # User functionality
│   │   │   ├── admin/      # Admin dashboard
│   │   │   ├── shared/     # Shared components
│   │   │   └── services/   # Core services
│   │   └── styles/         # Global styles
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database and email configuration.

4. **Setup database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed database (optional)
   npm run db:seed
   ```

5. **Start the backend**

   ```bash
   npm run start:dev
   ```

   The backend will be available at `http://localhost:3000/v1`
   API documentation at `http://localhost:3000/api/docs`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the frontend**

   ```bash
   ng serve
   ```

   The frontend will be available at `http://localhost:4200`

### Database Setup

1. **Create PostgreSQL database**

   ```sql
   CREATE DATABASE send_it_db;
   ```

2. **Update connection string in .env**

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/send_it_db"
   ```

3. **Run migrations**
   ```bash
   cd backend
   npm run db:migrate
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

### Parcels

- `GET /api/parcels` - Get parcels
- `POST /api/parcels` - Create parcel
- `GET /api/parcels/:id` - Get parcel by ID
- `PUT /api/parcels/:id` - Update parcel
- `GET /api/parcels/track/:trackingNumber` - Track parcel

### Admin

- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/parcels` - Parcel management
- `PUT /api/admin/parcels/:id/status` - Update parcel status

## Features Overview

### User Roles

#### Admin

- Create parcel delivery orders
- Update parcel status and location
- View all parcels and users
- Generate reports and metrics
- Manage user accounts (activate/deactivate)

#### Customer

- Send parcels to other users
- Receive parcels from other users
- Track parcels using tracking number
- View parcel history
- Leave reviews for received parcels
- Update profile information

### Parcel Flow

1. **Customer registers** or **Admin creates customer account**
2. **Admin creates parcel** on behalf of customer
3. **System creates receiver account** if doesn't exist
4. **Email notifications** sent to sender and receiver
5. **Admin updates parcel status** throughout delivery
6. **Real-time notifications** sent to all parties
7. **Customer can track** using tracking number
8. **Receiver can review** after delivery

### Email Notifications

- **Welcome email** for new registrations
- **Credentials email** for admin-created accounts
- **Status update emails** for parcel changes

### Security Features

- JWT token-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- Soft delete for data integrity

## Development

### Backend Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Prisma Studio

# Testing
npm run test
npm run test:watch
npm run test:cov
```

### Frontend Commands

```bash
# Development
ng serve

# Build
ng build

# Testing
ng test
ng e2e

# Generate components/services
ng generate component component-name
ng generate service service-name
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

