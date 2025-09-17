// Ponto de entrada do servidor Express
import 'dotenv/config';
import express from 'express';
import router from './routes.js';

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
