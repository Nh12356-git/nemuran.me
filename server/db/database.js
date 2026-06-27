const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'nemuran.db');
const musicDir = path.join(__dirname, '..', '..', 'file', 'music');
const pictureDir = path.join(__dirname, '..', '..', 'file', 'picture');

const AUDIO_EXTS = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.wma'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.avif'];

let _db = null;

async function initDB() {
    const SQL = await initSqlJs();

    let data = null;
    if (fs.existsSync(dbPath)) {
        data = fs.readFileSync(dbPath);
    }

    const db = new SQL.Database(data || undefined);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        bio TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    try { db.run(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`); } catch {}

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        folder TEXT NOT NULL,
        filename TEXT NOT NULL,
        lrc_filename TEXT DEFAULT 'lyrics.lrc',
        duration REAL DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS picture (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS dock_tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    if (fs.existsSync(musicDir)) {
        const existingMusic = query(db, 'SELECT folder FROM music');
        const existingFolders = new Set(existingMusic.map(r => r.folder));
        const folders = fs.readdirSync(musicDir).filter(f => {
            try { return fs.statSync(path.join(musicDir, f)).isDirectory(); } catch { return false; }
        });
        let order = query(db, 'SELECT MAX(sort_order) as m FROM music')[0]?.m || 0;
        for (const folder of folders) {
            if (existingFolders.has(folder)) continue;
            const folderPath = path.join(musicDir, folder);
            const mp3File = fs.readdirSync(folderPath).find(f => AUDIO_EXTS.includes(path.extname(f).toLowerCase()));
            if (!mp3File) continue;
            order++;
            run(db, 'INSERT INTO music (title, artist, folder, filename, sort_order) VALUES (?, ?, ?, ?, ?)',
                [path.parse(mp3File).name, '未知歌手', folder, mp3File, order]);
        }
    }

    if (fs.existsSync(pictureDir)) {
        const existingPics = query(db, 'SELECT filename FROM picture');
        const existingFiles = new Set(existingPics.map(r => r.filename));
        const files = fs.readdirSync(pictureDir).filter(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));
        let order = query(db, 'SELECT MAX(sort_order) as m FROM picture')[0]?.m || 0;
        for (const file of files) {
            if (existingFiles.has(file)) continue;
            order++;
            run(db, 'INSERT INTO picture (filename, is_default, sort_order) VALUES (?, ?, ?)',
                [file, 0, order]);
        }
    }

    const adminRows = query(db, 'SELECT id FROM users WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
        const hash = bcrypt.hashSync('123456', 10);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
    }

    const titleRows = query(db, 'SELECT key FROM settings WHERE key = ?', ['siteTitle']);
    if (titleRows.length === 0) {
        const defaults = { siteTitle: 'nemuran.me', nickname: '空气喵', glassEffect: 'true', showDock: 'true' };
        for (const [k, v] of Object.entries(defaults)) {
            db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [k, v]);
        }
    }

    saveDB(db);
    _db = db;
    return db;
}

function query(db, sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
}

function run(db, sql, params = []) {
    db.run(sql, params);
}

function saveDB(db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
}

function getDB() {
    return _db;
}

module.exports = { initDB, query, run, saveDB, getDB };
