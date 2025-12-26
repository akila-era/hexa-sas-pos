# Create Super Admin User

This guide explains how to create a super admin user for the system.

## Method 1: Using the Script (Recommended)

### Interactive Mode
Run the script and it will prompt you for the required information:

```bash
cd backend
npm run create-super-admin
```

The script will ask you for:
- Email address
- Password (minimum 8 characters)
- First name (optional)
- Last name (optional)

### Command Line Arguments
You can also provide all information via command line arguments:

```bash
cd backend
npm run create-super-admin -- --email=admin@example.com --password=SecurePass123
```

Or with all fields:

```bash
npm run create-super-admin -- --email=admin@example.com --password=SecurePass123 --firstName=John --lastName=Doe
```

## Method 2: Using the API Endpoint

You can also create a super admin user by calling the API endpoint directly:

```bash
curl -X POST http://localhost:5557/api/v1/auth/register-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Or using PowerShell:

```powershell
$body = @{
    email = "admin@example.com"
    password = "SecurePass123"
    firstName = "John"
    lastName = "Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5557/api/v1/auth/register-super-admin" -Method Post -Body $body -ContentType "application/json"
```

## What the Script Does

1. **Checks if user exists** - Prevents duplicate super admin accounts
2. **Creates System Tenant** - Creates a "System" tenant if it doesn't exist
3. **Creates System Branch** - Creates a "System Branch" if it doesn't exist
4. **Creates Super Admin Role** - Creates a "Super Admin" role if it doesn't exist
5. **Creates User** - Creates the super admin user with the provided credentials
6. **Returns Details** - Shows all created information

## Requirements

- Database must be running and accessible
- Prisma must be set up (run `npm run db:generate` if needed)
- Environment variables must be configured (DATABASE_URL in `.env`)

## Login

After creating the super admin user, you can login at:
- Frontend: http://localhost:3002
- API: POST http://localhost:5557/api/v1/auth/login

Use the email and password you provided during creation.

## Troubleshooting

### Error: "Super admin with this email already exists"
- The email is already registered. Use a different email or check existing users.

### Error: "Database connection failed"
- Make sure your database is running
- Check your DATABASE_URL in `.env` file
- Verify Docker containers are running: `docker ps`

### Error: "Prisma Client not generated"
- Run: `npm run db:generate`
- Then try again

## Notes

- The super admin user is created in the "System" tenant
- The super admin role is automatically assigned
- Password is hashed using bcrypt before storage
- The user is automatically set as active





