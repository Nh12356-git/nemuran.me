const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { adminMiddleware } = require('../middleware');
const { query, run, saveDB } = require('../db/database');

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const songs = query(db, 'SELECT * FROM music ORDER BY sort_order ASC, id ASC');
    res.json(songs);
});

router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const songs = query(db, 'SELECT * FROM music WHERE id = ?', [Number(req.params.id)]);
    if (!songs.length) return res.status(404).json({ error: '歌曲不存在' });
    res.json(songs[0]);
});

router.post('/', adminMiddleware, async (req, res) => {
    const db = req.app.locals.db;
    const { title, artist, folder, filename, lrc_filename } = req.body;

    let meta = {};
    try {
        const mm = require('music-metadata');
        const mp3Path = path.join(__dirname, '..', '..', 'file', 'music', folder, filename);
        const metadata = await mm.parseFile(mp3Path);
        meta = { title: metadata.common.title, artist: metadata.common.artist };
    } catch {}

    const finalTitle = title || meta.title || filename.replace('.mp3', '');
    const finalArtist = artist || meta.artist || '未知歌手';
    const maxOrder = query(db, 'SELECT MAX(sort_order) as m FROM music');
    const nextOrder = (maxOrder[0]?.m || 0) + 1;

    run(db, 'INSERT INTO music (title, artist, folder, filename, lrc_filename, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [finalTitle, finalArtist, folder, filename, lrc_filename || 'lyrics.lrc', nextOrder]);
    saveDB(db);

    const inserted = query(db, 'SELECT last_insert_rowid() as id');
    res.json({ id: inserted[0].id, success: true });
});

router.put('/:id', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { title, artist, sort_order } = req.body;
    const songs = query(db, 'SELECT * FROM music WHERE id = ?', [Number(req.params.id)]);
    if (!songs.length) return res.status(404).json({ error: '歌曲不存在' });
    const song = songs[0];

    run(db, 'UPDATE music SET title = ?, artist = ?, sort_order = ? WHERE id = ?',
        [title || song.title, artist || song.artist, sort_order ?? song.sort_order, Number(req.params.id)]);
    saveDB(db);
    res.json({ success: true });
});

router.delete('/:id', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const songs = query(db, 'SELECT * FROM music WHERE id = ?', [Number(req.params.id)]);
    if (!songs.length) return res.status(404).json({ error: '歌曲不存在' });
    const song = songs[0];

    if (req.query.deleteFile === 'true') {
        const folderPath = path.join(__dirname, '..', '..', 'file', 'music', song.folder);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
    }

    run(db, 'DELETE FROM music WHERE id = ?', [Number(req.params.id)]);
    saveDB(db);
    res.json({ success: true });
});

router.get('/:id/lyrics', (req, res) => {
    const db = req.app.locals.db;
    const songs = query(db, 'SELECT * FROM music WHERE id = ?', [Number(req.params.id)]);
    if (!songs.length) return res.status(404).json({ error: '歌曲不存在' });
    const song = songs[0];

    const lrcPath = path.join(__dirname, '..', '..', 'file', 'music', song.folder, song.lrc_filename);
    if (fs.existsSync(lrcPath)) {
        res.type('text/plain').send(fs.readFileSync(lrcPath, 'utf-8'));
    } else {
        res.status(404).json({ error: '歌词不存在' });
    }
});

router.put('/:id/lyrics', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const songs = query(db, 'SELECT * FROM music WHERE id = ?', [Number(req.params.id)]);
    if (!songs.length) return res.status(404).json({ error: '歌曲不存在' });
    const song = songs[0];

    const lrcPath = path.join(__dirname, '..', '..', 'file', 'music', song.folder, song.lrc_filename);
    fs.writeFileSync(lrcPath, req.body.lyrics || '', 'utf-8');
    res.json({ success: true });
});

router.post('/reorder', adminMiddleware, (req, res) => {
    const db = req.app.locals.db;
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: '无效数据' });
    order.forEach((id, i) => {
        run(db, 'UPDATE music SET sort_order = ? WHERE id = ?', [i, id]);
    });
    saveDB(db);
    res.json({ success: true });
});

module.exports = router;
