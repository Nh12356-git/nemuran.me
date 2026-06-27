const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminMiddleware } = require('../middleware');

const musicDir = path.join(__dirname, '..', '..', 'file', 'music');
const pictureDir = path.join(__dirname, '..', '..', 'file', 'picture');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.avif'];
const AUDIO_EXTS = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.wma'];

fs.mkdirSync(musicDir, { recursive: true });
fs.mkdirSync(pictureDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.query.type === 'wallpaper') {
            cb(null, pictureDir);
        } else {
            cb(null, musicDir);
        }
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (req.query.type === 'wallpaper') {
            if (file.mimetype.startsWith('image/') && IMAGE_EXTS.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('只允许上传图片文件（jpg/png/gif/webp等）'));
            }
        } else {
            if (file.mimetype.startsWith('audio/') && AUDIO_EXTS.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('只允许上传音频文件（mp3/flac/wav等）'));
            }
        }
    }
});

router.post('/music', adminMiddleware, upload.array('files', 20), (req, res) => {
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

router.post('/picture', adminMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    res.json({ success: true, filename: req.file.filename });
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过500MB限制' });
        }
        return res.status(400).json({ error: '文件上传失败: ' + err.message });
    }
    if (err.message && (err.message.includes('只允许上传图片') || err.message.includes('只允许上传音频'))) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;
