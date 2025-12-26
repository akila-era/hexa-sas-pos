# Super Admin Registration Guide

## Endpoint

**POST** `/api/v1/auth/register-super-admin`

**Base URL:** `http://localhost:5557/api/v1/auth/register-super-admin`

---

## Request JSON Format

```json
{
  "email": "admin@example.com",
  "password": "SuperAdmin123",
  "firstName": "Super",
  "lastName": "Admin",
  "phone": "+1234567890"
}
```

### Required Fields:
- `email` (string, valid email format)
- `password` (string, minimum 8 characters, maximum 100 characters)
- `firstName` (string, minimum 1 character, maximum 100 characters)
- `lastName` (string, minimum 1 character, maximum 100 characters)

### Optional Fields:
- `phone` (string, maximum 20 characters)

---

## Example Request

### Using cURL:
```bash
curl -X POST http://localhost:5557/api/v1/auth/register-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperAdmin@123",
    "firstName": "Super",
    "lastName": "Admin",
    "phone": "+1234567890"
  }'
```

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:5557/api/v1/auth/register-super-admin`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "superadmin@example.com",
  "password": "SuperAdmin@123",
  "firstName": "Super",
  "lastName": "Admin",
  "phone": "+1234567890"
}
```

### Using JavaScript/Fetch:
```javascript
fetch('http://localhost:5557/api/v1/auth/register-super-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'superadmin@example.com',
    password: 'SuperAdmin@123',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+1234567890'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

## Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "superadmin@example.com",
      "firstName": "Super",
      "lastName": "Admin",
      "phone": "+1234567890",
      "tenantId": "system-company-uuid",
      "branchId": "main-branch-uuid",
      "roleId": "super-admin-role-uuid",
      "role": {
        "id": "super-admin-role-uuid",
        "name": "Super Admin",
        "permissions": []
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["password"],
        "message": "String must contain at least 8 character(s)"
      }
    ]
  }
}
```

### 409 Conflict - Email Already Exists
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already exists"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

---

## Notes

1. **No Company UUID Required**: Unlike regular user registration, super admin registration does NOT require a `companyId`. The system automatically:
   - Creates a "System" company if it doesn't exist
   - Creates a "Main Branch" for the System company
   - Creates a "Super Admin" role if it doesn't exist
   - Associates the user with these automatically created entities

2. **Password Requirements**: 
   - Minimum 8 characters
   - Maximum 100 characters
   - Use a strong password for security

3. **Auto-Login**: After successful registration, the response includes `accessToken` and `refreshToken` for immediate authentication.

4. **First Super Admin**: The first super admin registration will create the System company and Super Admin role. Subsequent registrations will use the existing ones.

---

## Testing

You can use the provided `SUPER_ADMIN_REGISTER.json` file with tools like:
- Postman (Import JSON)
- Insomnia
- REST Client (VS Code extension)
- Any HTTP client





