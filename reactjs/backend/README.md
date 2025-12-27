# HEXA POS Backend - Products & Inventory Module

Node.js/Express backend for the HEXA SAS POS system's Products & Inventory module.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/hexa_pos_db?schema=public"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Start development server:
```bash
npm run dev
```

## API Endpoints

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get single category |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Brands
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | Get all brands |
| GET | `/api/brands/:id` | Get single brand |
| POST | `/api/brands` | Create brand |
| PUT | `/api/brands/:id` | Update brand |
| DELETE | `/api/brands/:id` | Delete brand |

### Units
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/units` | Get all units |
| GET | `/api/units/:id` | Get single unit |
| POST | `/api/units` | Create unit |
| PUT | `/api/units/:id` | Update unit |
| DELETE | `/api/units/:id` | Delete unit |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product (soft delete) |
| GET | `/api/products/low-stock` | Get low stock products |
| GET | `/api/products/expired` | Get expired products |
| POST | `/api/products/barcode` | Generate barcode |
| POST | `/api/products/qrcode` | Generate QR code |

### Variants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/variants` | Get all variants |
| GET | `/api/variants/:id` | Get single variant |
| POST | `/api/variants` | Create variant |
| PUT | `/api/variants/:id` | Update variant |
| DELETE | `/api/variants/:id` | Delete variant |

## Query Parameters

### Pagination (all list endpoints)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Products Filters
- `search` - Search by name, SKU, barcode, description
- `categoryId` - Filter by category
- `brandId` - Filter by brand
- `unitId` - Filter by unit
- `isActive` - Filter by active status (true/false)
- `isFeatured` - Filter by featured status
- `minPrice` - Minimum selling price
- `maxPrice` - Maximum selling price
- `sortBy` - Sort field (name, sellingPrice, createdAt, currentStock)
- `sortOrder` - Sort order (asc, desc)

### Low Stock Products
- `threshold` - Custom stock threshold (default: uses product's minStockLevel)

### Expired Products
- `includeSoonExpiring` - Include products expiring soon (true/false)
- `daysUntilExpiry` - Days to consider "soon expiring" (default: 30)

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation message",
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── validators/        # Zod schemas
│   └── index.ts           # Entry point
├── package.json
└── tsconfig.json
```

