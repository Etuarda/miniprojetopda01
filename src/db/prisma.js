
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Cria uma nova instância do PrismaClient.
// Isso gerencia a conexão com o banco de dados.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}


