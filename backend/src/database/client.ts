import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  try {
    prismaInstance = globalForPrisma.prisma ||
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }

    // Test connection
    prismaInstance.$connect().catch((error) => {
      logger.error('Failed to connect to database:', error);
    });

    return prismaInstance;
  } catch (error) {
    logger.error('Failed to initialize Prisma Client:', error);
    throw error;
  }
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    logger.info('Database connection closed');
  }
});

export default prisma;
export { prisma };

