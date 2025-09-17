// Define endpoints e conecta aos controllers
import { Router } from 'express';
import * as authController from './controllers/auth.controller.js';
import * as studentsController from './controllers/students.controller.js';
import { auth } from './middlewares/auth.js';

const router = Router();

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.me);

// Students (todas protegidas por JWT)
router.get('/students', auth, studentsController.list);
router.get('/students/search', auth, studentsController.search);   // ?q=ana
router.post('/students', auth, studentsController.create);
router.put('/students/:id', auth, studentsController.update);      // extra (editar)
router.delete('/students/:id', auth, studentsController.remove);
router.get('/students/stats/average', auth, studentsController.classAverage);
router.get('/students/stats/top', auth, studentsController.topStudent);
router.get('/students/reports', auth, studentsController.reports); // ?status=aprovados|recuperacao|reprovados

export default router;
