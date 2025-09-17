// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

/** Remove campos sensíveis antes de responder */
function publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
}

/**
 * @desc Registra um novo usuário
 * @route POST /api/auth/register
 */
export async function register(req, res) {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email e password são obrigatórios' });
    }

    const exists = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { name, email: String(email).toLowerCase(), passwordHash },
    });

    return res.status(201).json(publicUser(user));
}

/**
 * @desc Autentica e retorna um JWT
 * @route POST /api/auth/login
 */
export async function login(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'email e password são obrigatórios' });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: '2h' },
    );

    return res.json({ token, user: publicUser(user) });
}

/**
 * @desc Retorna o usuário autenticado (do token)
 * @route GET /api/auth/me
 */
export async function me(_req, res) {
    return res.json({ user: res.req.user });
}
