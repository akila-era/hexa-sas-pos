# HEXA SAS POS Backend

A comprehensive SaaS POS system backend built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- ✅ Multi-tenant architecture (Company-based isolation)
- ✅ Branch-based data management
- ✅ POS checkout system
- ✅ Inventory management with stock movements (no direct stock updates)
- ✅ Sales management
- ✅ Basic reports and analytics
- ✅ RBAC (Roles & Permissions)
- ✅ All queries are tenant-safe

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (Access & Refresh tokens)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example.txt .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hexa_pos_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

Generate Prisma Client:

```bash
npm run db:generate
```

Run database migrations:

```bash
npm run db:migrate
```

### 4. Run the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:5557`

## API Endpoints

**Base URL**: `http://localhost:5557/api/v1`

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info

### Companies
- `POST /api/v1/companies` - Create company
- `GET /api/v1/companies` - List companies
- `GET /api/v1/companies/:id` - Get company details
- `PUT /api/v1/companies/:id` - Update company

### Branches
- `POST /api/v1/companies/branches` - Create branch
- `GET /api/v1/companies/branches` - List branches
- `GET /api/v1/companies/branches/:id` - Get branch details
- `PUT /api/v1/companies/branches/:id` - Update branch

### Products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products` - List products (with pagination, search, filters)
- `GET /api/v1/products/:id` - Get product details
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product (soft delete)

### POS Orders
- `POST /api/v1/pos/orders` - Create POS order
- `GET /api/v1/pos/orders` - List POS orders
- `GET /api/v1/pos/orders/:id` - Get POS order details

### Sales
- `POST /api/v1/sales` - Create sale
- `GET /api/v1/sales` - List sales
- `GET /api/v1/sales/:id` - Get sale details

### Stock Management
- `POST /api/v1/stock/movements` - Create stock movement
- `GET /api/v1/stock/movements` - List stock movements
- `GET /api/v1/stock/:productId/:warehouseId` - Get stock for product/warehouse
- `POST /api/v1/stock/check-availability` - Check stock availability

### Reports
- `GET /api/v1/reports/sales/summary` - Sales summary report
- `GET /api/v1/reports/sales/top-products` - Top selling products
- `GET /api/v1/reports/sales/daily` - Daily sales report
- `GET /api/v1/reports/inventory/summary` - Inventory summary

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Multi-Tenant Architecture

All data is automatically scoped by `companyId`. The backend middleware ensures:
- Users can only access data from their company
- All queries automatically filter by company
- Branch-level access control for users assigned to branches

## Stock Management

Stock can **only** be updated through stock movements:
- No direct stock updates allowed
- All stock changes must go through `POST /api/stock/movements`
- Movement types: `IN`, `OUT`, `TRANSFER`, `ADJUSTMENT`, `RETURN`

## RBAC

Roles and permissions are managed per company:
- Each company has its own roles and permissions
- Permissions are checked using middleware: `requirePermission('permission:slug')`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── database/        # Database client
│   ├── middlewares/     # Express middlewares
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## Development

### Run Prisma Studio (Database GUI)

```bash
npm run db:studio
```

### Type Checking

```bash
npm run type-check
```

## Notes

- All timestamps are in UTC
- Soft deletes are used where applicable (deletedAt field)
- API responses follow a consistent format with `success`, `data`, and `error` fields
- Pagination is supported on list endpoints with `page` and `limit` query params

## License

ISC
