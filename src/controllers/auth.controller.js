// Controller de autenticação (dados 100% em memória)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

// "Banco" em memória para usuários
// Reiniciou o servidor → zera tudo (projeto didático)
const users = []; // { id, name, email, passwordHash, createdAt }
let nextUserId = 1;

/**
 * Busca usuário por e-mail (case-insensitive).
 */
function findUserByEmail(email) {
    const needle = String(email || '').toLowerCase();
    return users.find((u) => u.email.toLowerCase() === needle);
}

/**
 * Retorna versão pública do usuário (sem passwordHash).
 */
function publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
}

/**
 * POST /api/auth/register
 * body: { name, email, password }
 */
export async function register(req, res) {
    const { name, email, password } = req.body || {};

    // Validações mínimas (boas práticas)
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email e password são obrigatórios' });
    }
    if (findUserByEmail(email)) {
        return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    // Hash de senha e criação do usuário
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: String(nextUserId++),        // ID incremental didático
        name,
        email,
        passwordHash,
        createdAt: new Date().toISOString()
    };
    users.push(user);

    return res.status(201).json(publicUser(user));
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login(req, res) {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'email e password são obrigatórios' });
    }

    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera token com expiração de 2h
    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: '2h' }
    );

    return res.json({ token, user: publicUser(user) });
}

/**
 * GET /api/auth/me
 * header: Authorization: Bearer <token>
 */
export async function me(req, res) {
    // req.user é setado pelo middleware auth
    return res.json({ user: req.user });
}
