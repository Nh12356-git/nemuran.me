const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'nemuran_secret_key_2024';

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未登录' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ error: '登录已过期' });
    }
}

module.exports = { authMiddleware, SECRET };
