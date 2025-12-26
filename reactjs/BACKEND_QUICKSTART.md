# HEXA SAS POS - Backend Quick Start Guide

## 🚀 Quick Setup (Node.js/Express/TypeScript)

### Step 1: Create Backend Directory
```bash
cd C:\Users\Akila\OneDrive\Desktop\reactjs
mkdir backend
cd backend
```

### Step 2: Initialize Project
```bash
npm init -y
npm install express cors helmet morgan dotenv
npm install -D typescript @types/node @types/express @types/cors nodemon ts-node
```

### Step 3: Setup TypeScript
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 4: Create Basic Structure
```bash
mkdir src
mkdir src\config
mkdir src\controllers
mkdir src\services
mkdir src\routes
mkdir src\middlewares
mkdir src\utils
mkdir src\types
```

### Step 5: Create Entry Files

**src/server.ts**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 6: Create .env file
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/hexa_pos
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Step 7: Run Server
```bash
npm run dev
```

Visit: `http://localhost:3000/api/health`

---

## 📦 Complete Package.json Example

```json
{
  "name": "hexa-sas-pos-backend",
  "version": "1.0.0",
  "description": "Backend API for HEXA SAS POS System",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node src/database/seeds/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "@prisma/client": "^5.7.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "ioredis": "^5.3.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "prisma": "^5.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

---

## 🔧 Next Steps

### 1. Setup Database (PostgreSQL)
```bash
# Install PostgreSQL if not installed
# Download from: https://www.postgresql.org/download/

# Create database
createdb hexa_pos

# Or using psql:
psql -U postgres
CREATE DATABASE hexa_pos;
```

### 2. Setup Prisma ORM
```bash
npm install prisma @prisma/client
npx prisma init
```

### 3. Configure Prisma Schema
Edit `prisma/schema.prisma` (see DATABASE_SCHEMA.md for full schema)

### 4. Run Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Create First API Route

**src/routes/auth.routes.ts**
```typescript
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
```

**src/controllers/auth.controller.ts**
```typescript
import { Request, Response } from 'express';

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      // TODO: Implement registration logic
      res.json({ 
        success: true, 
        message: 'Registration endpoint - TODO' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Registration failed' 
      });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      // TODO: Implement login logic
      res.json({ 
        success: true, 
        message: 'Login endpoint - TODO' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Login failed' 
      });
    }
  }
};
```

**Update src/server.ts:**
```typescript
import authRoutes from './routes/auth.routes';

app.use('/api/auth', authRoutes);
```

---

## 📚 Recommended Reading Order

1. **BACKEND_DEVELOPMENT_PLAN.md** - Complete development roadmap
2. **DATABASE_SCHEMA.md** - Database structure
3. This file - Quick setup guide

---

## 🛠️ Development Tools

### Recommended VS Code Extensions:
- ESLint
- Prettier
- Prisma
- REST Client (for testing APIs)

### API Testing:
- Postman
- Insomnia
- VS Code REST Client

---

## 🔐 Security Checklist

- [ ] Change default JWT secrets
- [ ] Setup environment variables properly
- [ ] Enable CORS only for frontend domain
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Use HTTPS in production
- [ ] Setup database backups

---

## 📝 Environment Variables Template

Create `.env` file:
```env
# Server
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hexa_pos

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Create `.env.example` (commit this, not .env):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/hexa_pos
JWT_SECRET=change-this-secret-key
```

---

## ✅ Verification Steps

1. ✅ Server starts without errors
2. ✅ Health endpoint responds: `http://localhost:3000/api/health`
3. ✅ Database connection works
4. ✅ TypeScript compiles without errors
5. ✅ Hot reload works in development

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database credentials

### TypeScript Errors
```bash
npm run type-check
# Fix any type errors
```

---

## 📞 Need Help?

1. Check BACKEND_DEVELOPMENT_PLAN.md for detailed phases
2. Review DATABASE_SCHEMA.md for database structure
3. Check official documentation:
   - Express.js: https://expressjs.com/
   - Prisma: https://www.prisma.io/docs
   - TypeScript: https://www.typescriptlang.org/docs/

---

**Ready to start development!** 🎉

Follow the development phases in BACKEND_DEVELOPMENT_PLAN.md to build features incrementally.







