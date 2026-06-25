const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { query, run, saveDB } = require('../db/database');

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const rows = query(db, 'SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
});

router.put('/', authMiddleware, (req, res) => {
    const db = req.app.locals.db;
    for (const [k, v] of Object.entries(req.body)) {
        run(db, 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, String(v)]);
    }
    saveDB(db);
    res.json({ success: true });
});

module.exports = router;
