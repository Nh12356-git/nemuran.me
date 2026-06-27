const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware');
const { query, run, saveDB } = require('../db/database');

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const tools = query(db, 'SELECT * FROM dock_tools ORDER BY sort_order ASC, id ASC');
    res.json(tools);
});

router.post('/', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { name, url, icon } = req.body;
    if (!name || !url) return res.status(400).json({ error: '名称和URL必填' });
    const maxOrder = query(db, 'SELECT MAX(sort_order) as m FROM dock_tools');
    const nextOrder = (maxOrder[0]?.m || 0) + 1;
    run(db, 'INSERT INTO dock_tools (name, url, icon, sort_order) VALUES (?, ?, ?, ?)',
        [name, url, icon || '', nextOrder]);
    saveDB(db);
    const inserted = query(db, 'SELECT last_insert_rowid() as id');
    res.json({ id: inserted[0].id, success: true });
});

router.put('/:id', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { name, url, icon, sort_order } = req.body;
    const rows = query(db, 'SELECT * FROM dock_tools WHERE id = ?', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: '工具不存在' });
    const tool = rows[0];

    run(db, 'UPDATE dock_tools SET name = ?, url = ?, icon = ?, sort_order = ? WHERE id = ?',
        [name || tool.name, url || tool.url, icon ?? tool.icon, sort_order ?? tool.sort_order, Number(req.params.id)]);
    saveDB(db);
    res.json({ success: true });
});

router.delete('/:id', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    run(db, 'DELETE FROM dock_tools WHERE id = ?', [Number(req.params.id)]);
    saveDB(db);
    res.json({ success: true });
});

router.post('/reorder', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: '无效数据' });
    order.forEach((id, i) => {
        run(db, 'UPDATE dock_tools SET sort_order = ? WHERE id = ?', [i, id]);
    });
    saveDB(db);
    res.json({ success: true });
});

module.exports = router;
