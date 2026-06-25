const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function start() {
    const db = await initDB();
    app.locals.db = db;

    app.use('/api', require('./routes/auth'));
    app.use('/api/settings', require('./routes/settings'));
    app.use('/api/songs', require('./routes/songs'));
    app.use('/api/wallpapers', require('./routes/wallpapers'));
    app.use('/api/dock', require('./routes/dock'));
    app.use('/api/upload', require('./routes/upload'));

    app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
    app.use(express.static(path.join(__dirname, '..')));

    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`nemuran.me server running at http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
}

start().catch(console.error);
