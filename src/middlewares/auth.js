// Middleware simples de autenticação via JWT
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

export function auth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Token ausente' });
    }

    try {
        // Payload do token fica disponível em req.user
        req.user = jwt.verify(token, jwtSecret); // { id, email, name, iat, exp }
        return next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}
