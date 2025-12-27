# Order Management System (OMS) Implementation Guide

## Overview
This document describes the implementation of the Order Management System (OMS) as an optional feature in the multi-tenant SaaS POS system.

## Architecture

### Feature Toggle System
- **Table**: `tenant_features`
- **Purpose**: Enable/disable features per tenant
- **Middleware**: `featureGuard(featureKey)` - blocks routes if feature is disabled

### OMS Database Models
1. **Order**: Main order entity with status lifecycle
2. **OrderItem**: Order line items
3. **OrderStatus**: Status change history

### Backend Structure
```
backend/src/
├── middlewares/
│   └── feature.middleware.ts      # Feature guard middleware
├── services/
│   ├── oms.service.ts             # OMS business logic
│   └── superadmin/
│       └── feature-toggle.service.ts  # Feature toggle management
├── controllers/
│   ├── oms.controller.ts          # OMS REST endpoints
│   └── superadmin/
│       └── feature-toggle.controller.ts  # Super admin feature APIs
└── routes/
    ├── oms.routes.ts              # OMS routes (/api/v1/oms/*)
    └── superadmin/
        └── feature-toggle.routes.ts  # Feature toggle routes
```

## Database Migration

### Step 1: Generate Migration
```bash
cd backend
npx prisma migrate dev --name add_oms_and_feature_toggle
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Seed Default Feature States (Optional)
After migration, you can initialize OMS as disabled for all existing tenants:

```typescript
// Run this script once after migration
import { prisma } from './src/database/client';

async function seedFeatureToggles() {
  const tenants = await prisma.tenant.findMany();
  
  for (const tenant of tenants) {
    await prisma.tenantFeature.upsert({
      where: {
        tenantId_featureKey: {
          tenantId: tenant.id,
          featureKey: 'OMS',
        },
      },
      create: {
        tenantId: tenant.id,
        featureKey: 'OMS',
        isEnabled: false,
      },
      update: {},
    });
  }
  
  console.log(`Initialized OMS feature toggle for ${tenants.length} tenants`);
}

seedFeatureToggles();
```

## API Endpoints

### OMS Endpoints (Requires OMS feature enabled)
All endpoints are under `/api/v1/oms/*` and require:
- Authentication
- Tenant isolation
- OMS feature enabled

#### Orders
- `GET /api/v1/oms/orders` - List orders (paginated, filterable)
- `GET /api/v1/oms/orders/:id` - Get single order
- `POST /api/v1/oms/orders` - Create new order
- `PUT /api/v1/oms/orders/:id` - Update order
- `DELETE /api/v1/oms/orders/:id` - Cancel order
- `POST /api/v1/oms/orders/:id/payment` - Add payment to order

#### Statistics
- `GET /api/v1/oms/stats` - Get order statistics

### Super Admin Feature Toggle Endpoints
All endpoints are under `/api/v1/super-admin/features/*` and require:
- Authentication
- Super Admin role

- `GET /api/v1/super-admin/features/tenants` - List all tenants with features
- `GET /api/v1/super-admin/features/tenants/:tenantId` - Get tenant features
- `POST /api/v1/super-admin/features/enable` - Enable feature for tenant
- `POST /api/v1/super-admin/features/disable` - Disable feature for tenant
- `POST /api/v1/super-admin/features/toggle` - Toggle feature for tenant
- `GET /api/v1/super-admin/features/available` - List available features

## Usage Examples

### Enable OMS for a Tenant (Super Admin)
```bash
POST /api/v1/super-admin/features/enable
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "tenantId": "uuid-here",
  "featureKey": "OMS"
}
```

### Create an Order (Tenant User)
```bash
POST /api/v1/oms/orders
Authorization: Bearer <tenant-user-token>
Content-Type: application/json

{
  "branchId": "uuid-optional",
  "customerId": "uuid-optional",
  "items": [
    {
      "productId": "uuid",
      "qty": 2,
      "price": 100.00,
      "discount": 0,
      "tax": 10.00
    }
  ],
  "subtotal": 200.00,
  "taxAmount": 20.00,
  "discount": 0,
  "shippingCost": 10.00,
  "deliveryAddress": "123 Main St",
  "deliveryPhone": "+1234567890",
  "status": "PENDING"
}
```

## Frontend Integration

### Feature Flag Check
Before rendering OMS pages, check if feature is enabled:

```typescript
// Check feature status
const checkOMSEnabled = async () => {
  try {
    const response = await api.get('/api/v1/super-admin/features/tenants/:tenantId');
    return response.data.features.some(f => f.featureKey === 'OMS' && f.isEnabled);
  } catch (error) {
    return false;
  }
};
```

### Conditional Route Rendering
```typescript
// Only show OMS routes if feature is enabled
{omsEnabled && (
  <Route path="/oms/orders" element={<OrdersPage />} />
)}
```

## Security Considerations

1. **Feature Guard**: All OMS routes are protected by `featureGuard('OMS')` middleware
2. **Tenant Isolation**: All queries include `tenantId` filter
3. **Super Admin Only**: Feature toggle endpoints require super admin role
4. **Audit Trail**: All feature enable/disable actions are logged with `enabledBy`/`disabledBy`

## Testing

### Test Feature Guard
1. Try accessing OMS routes without feature enabled → Should return 403
2. Enable feature via super admin API
3. Try accessing OMS routes again → Should work

### Test Order Lifecycle
1. Create order with status PENDING
2. Update to CONFIRMED
3. Update to PROCESSING
4. Update to READY (sets isDeliveryReady = true)
5. Update to DELIVERED
6. Verify status history is tracked

## Notes

- OMS is completely separate from POS sales flow
- Disabling OMS does not affect existing POS functionality
- Orders can be linked to customers for future analytics
- Delivery readiness flag is future-proofed for delivery management
- Status history provides full audit trail

