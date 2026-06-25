const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware');

const musicDir = path.join(__dirname, '..', '..', 'file', 'music');
const pictureDir = path.join(__dirname, '..', '..', 'file', 'picture');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.query.type === 'wallpaper') {
            fs.mkdirSync(pictureDir, { recursive: true });
            cb(null, pictureDir);
        } else {
            cb(null, musicDir);
        }
    },
    filename: (req, file, cb) => {
        cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8'));
    }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/music', authMiddleware, upload.array('files', 20), (req, res) => {
    const results = [];
    for (const file of req.files) {
        const name = path.parse(file.originalname).name;
        const folderPath = path.join(musicDir, name);
        const destPath = path.join(folderPath, file.originalname);

        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
        fs.renameSync(file.path, destPath);

        const lrcSrc = path.join(musicDir, file.originalname.replace('.mp3', '.lrc'));
        if (fs.existsSync(lrcSrc)) {
            fs.renameSync(lrcSrc, path.join(folderPath, 'lyrics.lrc'));
        }

        results.push({ filename: file.originalname, folder: name });
    }
    res.json({ success: true, files: results });
});

router.post('/wallpaper', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    res.json({ success: true, filename: req.file.filename });
});

module.exports = router;
