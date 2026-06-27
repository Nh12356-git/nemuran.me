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
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, bio: user.bio || '' } });
});

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (username.length < 2 || username.length > 16) {
        return res.status(400).json({ error: '用户名长度需在2-16个字符之间' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: '密码长度不能少于6个字符' });
    }
    const db = req.app.locals.db;
    const existing = query(db, 'SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
        return res.status(400).json({ error: '用户名已存在' });
    }
    const hash = bcrypt.hashSync(password, 10);
    run(db, 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, 'user']);
    saveDB(db);
    const user = query(db, 'SELECT id, username, role FROM users WHERE username = ?', [username])[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
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
    const db = req.app.locals.db;
    const users = query(db, 'SELECT id, username, role, bio FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: users[0] || req.user });
});

router.put('/me', authMiddleware, (req, res) => {
    const { username, bio } = req.body;
    const db = req.app.locals.db;
    if (username) {
        const existing = query(db, 'SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: '用户名已存在' });
        }
        run(db, 'UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);
    }
    if (bio !== undefined) {
        run(db, 'UPDATE users SET bio = ? WHERE id = ?', [bio, req.user.id]);
    }
    saveDB(db);
    const users = query(db, 'SELECT id, username, role, bio FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, user: users[0] });
});

module.exports = router;
