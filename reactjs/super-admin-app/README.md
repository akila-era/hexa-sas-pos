# Super Admin App

This is a separate React application for Super Admin functionality. It has been separated from the main application to provide a dedicated interface for super admin users.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3006`

## Features

- Super Admin Login
- Dashboard
- Companies Management
- Subscription Management
- Packages Management
- Domain Management
- Purchase Transaction Management

## Routes

- `/login` - Super Admin Login
- `/dashboard` - Super Admin Dashboard
- `/companies` - Companies Management
- `/subscription` - Subscription Management
- `/packages` - Packages Management
- `/domain` - Domain Management
- `/purchase-transaction` - Purchase Transaction Management

## API Configuration

The app is configured to connect to the backend API at `http://localhost:5557/api/v1` by default.

You can override this by setting the `VITE_API_URL` environment variable.

## Note

This is a standalone application. Make sure the backend server is running before starting this app.





