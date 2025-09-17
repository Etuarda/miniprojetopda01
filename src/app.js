// Ponto de entrada do servidor Express
import 'dotenv/config';
import express from 'express';
import router from './routes.js';
import { prisma } from './db/prisma.js';


process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });


const app = express();

// Body parser JSON
app.use(express.json());

// Monta todas as rotas sob /api
app.use('/api', router);

// Healthcheck para debug/monitoramento
app.get('/health', (_req, res) => res.json({ ok: true }));

// Sobe o servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`API rodando em :${port}`);
});
