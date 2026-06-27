const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { adminMiddleware } = require('../middleware');
const { query, run, saveDB } = require('../db/database');

const wallpaperDir = path.join(__dirname, '..', '..', 'file', 'picture');

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const wallpapers = query(db, 'SELECT * FROM picture ORDER BY sort_order ASC, id ASC');
    res.json(wallpapers);
});

router.post('/', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { filename, is_default } = req.body;
    const maxOrder = query(db, 'SELECT MAX(sort_order) as m FROM picture');
    const nextOrder = (maxOrder[0]?.m || 0) + 1;
    run(db, 'INSERT INTO picture (filename, is_default, sort_order) VALUES (?, ?, ?)',
        [filename, is_default ? 1 : 0, nextOrder]);
    saveDB(db);
    const inserted = query(db, 'SELECT last_insert_rowid() as id');
    res.json({ id: inserted[0].id, success: true });
});

router.delete('/:id', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const rows = query(db, 'SELECT * FROM picture WHERE id = ?', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: '图片不存在' });
    const wp = rows[0];

    if (req.query.deleteFile === 'true') {
        const filePath = path.join(wallpaperDir, wp.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    run(db, 'DELETE FROM picture WHERE id = ?', [Number(req.params.id)]);
    saveDB(db);
    res.json({ success: true });
});

router.put('/:id', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { sort_order, is_default } = req.body;
    const rows = query(db, 'SELECT * FROM picture WHERE id = ?', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: '图片不存在' });
    const wp = rows[0];

    if (is_default) {
        run(db, 'UPDATE picture SET is_default = 0');
    }
    run(db, 'UPDATE picture SET sort_order = ?, is_default = ? WHERE id = ?',
        [sort_order ?? wp.sort_order, is_default ? 1 : 0, Number(req.params.id)]);
    saveDB(db);
    res.json({ success: true });
});

module.exports = router;
