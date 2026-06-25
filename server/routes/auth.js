const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, SECRET } = require('../middleware');
const { query, run, saveDB } = require('../db/database');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = req.app.locals.db;
    const users = query(db, 'SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/change-password', authMiddleware, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const db = req.app.locals.db;
    const users = query(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!bcrypt.compareSync(oldPassword, user.password)) {
        return res.status(400).json({ error: '原密码错误' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    run(db, 'UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    saveDB(db);
    res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
