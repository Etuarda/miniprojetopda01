/**
 * Mapeamento de rotas da API
 * - Auth
 * - Students (CRUD + estatísticas)
 */

import { Router } from 'express';
import { auth } from './middlewares/auth.js'; // <- corrigido: import nomeado

import { login, me, register } from './controllers/auth.controller.js';
import {
    list,
    search,
    create,
    update,
    remove,
    classAverage,
    topStudent,
    reports,
} from './controllers/students.controller.js';

const router = Router();

//AUTH

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', auth, me);

//STUDENTS (CRUD) (rotas protegidas)

router.get('/students', auth, list);
router.get('/students/search', auth, search);
router.post('/students', auth, create);
router.put('/students/:id', auth, update);
router.delete('/students/:id', auth, remove);

//  STATS / RELATÓRIOS

router.get('/students/stats/average', auth, classAverage);
router.get('/students/stats/top', auth, topStudent);
router.get('/students/reports', auth, reports);

export default router;
