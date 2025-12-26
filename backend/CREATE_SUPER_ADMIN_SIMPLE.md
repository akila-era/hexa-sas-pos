# Super Admin Registration Guide

## Super Admin Create කරන්න (Without Tenant ID)

Super admin create කරද්දී **Tenant ID ඕනි නෑ**. System automatically System tenant create කරනවා.

## Method 1: API Endpoint (Recommended)

### Using cURL:
```bash
curl -X POST http://localhost:5557/api/v1/auth/register-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123456",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Using PowerShell:
```powershell
$body = @{
    email = "admin@example.com"
    password = "Admin123456"
    firstName = "Admin"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5557/api/v1/auth/register-super-admin" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

## Method 2: Using Script

```bash
cd backend
node create-super-admin-auto.js
```

## What Happens Automatically:

1. ✅ System Tenant create කරනවා (if not exists)
2. ✅ System Branch create කරනවා (if not exists)  
3. ✅ Super Admin Role create කරනවා (if not exists)
4. ✅ Super Admin User create කරනවා
5. ✅ All are set to **Active** by default

## Required Fields:

- `email` - Email address (required)
- `password` - Password (min 8 characters, required)
- `firstName` - First name (required)
- `lastName` - Last name (required)
- `phone` - Phone number (optional)

## No Need For:

- ❌ `companyId` / `tenantId` - NOT needed!
- ❌ `branchId` - Auto-created
- ❌ `roleId` - Auto-created

## After Registration:

Super admin can:
- ✅ Login to Super Admin Panel
- ✅ Manage all tenants/companies
- ✅ Manage all users
- ✅ Access all system features

## Example Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "tenantId": "...",
      "role": {
        "name": "Super Admin"
      }
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```



