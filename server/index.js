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

    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/settings', require('./routes/settings'));
    app.use('/api/music', require('./routes/music'));
    app.use('/api/picture', require('./routes/picture'));
    app.use('/api/dock', require('./routes/dock'));
    app.use('/api/upload', require('./routes/upload'));

    app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
    app.use('/user', express.static(path.join(__dirname, '..', 'user')));
    app.use('/login', express.static(path.join(__dirname, '..', 'login')));
    app.use(express.static(path.join(__dirname, '..')));

    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
    });

    app.get('/user', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'user', 'index.html'));
    });

    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'login', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`nemuran.me server running at http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
        console.log(`User panel: http://localhost:${PORT}/user`);
    });
}

start().catch(console.error);
