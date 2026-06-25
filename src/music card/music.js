const MusicPlayer = {
    audio: null,
    playBtn: null,
    prevBtn: null,
    nextBtn: null,
    currentTimeEl: null,
    durationEl: null,
    progressBar: null,
    progressFill: null,
    platformBtn: null,
    platformMenu: null,
    lyricInner: null,
    lyricContainer: null,
    lyrics: [],
    currentLyricIndex: -1,
    musicConfig: {
        title: '命に嫌われている',
        artist: 'カンザキイオリ',
        platforms: {
            netease: 'https://music.163.com/#/song?id=1974443814',
            qq: 'https://y.qq.com/n/ryqq/songDetail/001R1a2x3z6WYa',
            bilibili: 'https://www.bilibili.com/video/BV1Mh411s7ZD'
        }
    },

    init() {
        this.audio = document.getElementById('audio');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.platformBtn = document.getElementById('platformBtn');
        this.platformMenu = document.getElementById('platformMenu');
        this.lyricInner = document.getElementById('lyricInner');
        this.lyricContainer = document.getElementById('lyricContainer');

        document.getElementById('musicTitle').textContent = this.musicConfig.title;
        document.getElementById('musicArtist').textContent = this.musicConfig.artist;

        this.loadLyrics();
        this.loadCover();
        this.bindEvents();
    },

    parseLRC(text) {
        const lines = text.split('\n');
        const result = [];
        const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                const min = parseInt(match[1]);
                const sec = parseInt(match[2]);
                const ms = parseInt(match[3].padEnd(3, '0'));
                const time = min * 60 + sec + ms / 1000;
                const text = match[4].trim();
                if (text) result.push({ time, text });
            }
        }
        return result.sort((a, b) => a.time - b.time);
    },

    renderLyrics() {
        if (this.lyrics.length === 0) {
            this.lyricInner.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
            return;
        }
        this.lyricInner.innerHTML = this.lyrics.map((l, i) =>
            `<div class="lyric-line" data-index="${i}">${l.text}</div>`
        ).join('');
    },

    updateLyric() {
        if (this.lyrics.length === 0) return;
        const ct = this.audio.currentTime;
        let idx = -1;
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (ct >= this.lyrics[i].time) { idx = i; break; }
        }
        if (idx !== this.currentLyricIndex) {
            this.currentLyricIndex = idx;
            document.querySelectorAll('.lyric-line').forEach((el, i) => {
                el.classList.toggle('active', i === idx);
            });
            if (idx >= 0) {
                const lineH = 28;
                const offset = -idx * lineH + this.lyricContainer.clientHeight / 2 - lineH / 2;
                this.lyricInner.style.transform = `translateY(${offset}px)`;
            }
        }
    },

    loadLyrics() {
        fetch('file/music/lyrics.lrc')
            .then(r => r.ok ? r.text() : '')
            .then(text => {
                if (text) {
                    this.lyrics = this.parseLRC(text);
                    this.renderLyrics();
                }
            })
            .catch(() => {});
    },

    loadCover() {
        jsmediatags.read(this.audio.querySelector('source').src, {
            onSuccess: (tag) => {
                var tags = tag.tags;
                if (tags.picture) {
                    var image = tags.picture;
                    var base64 = '';
                    for (var i = 0; i < image.data.length; i++) {
                        base64 += String.fromCharCode(image.data[i]);
                    }
                    var cover = 'data:' + image.format + ';base64,' + window.btoa(base64);
                    document.getElementById('coverImg').src = cover;
                }
            },
            onError: function(error) {
                document.getElementById('coverImg').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23333" width="64" height="64" rx="32"/><text x="32" y="38" font-size="24" fill="%23888" text-anchor="middle">♫</text></svg>';
            }
        });
    },

    formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    },

    bindEvents() {
        this.platformBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.platformMenu.classList.toggle('active');
        });

        document.addEventListener('click', () => this.platformMenu.classList.remove('active'));

        document.querySelectorAll('.platform-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const p = item.dataset.platform;
                if (p === 'local') {
                    this.audio.play().catch(() => {});
                    this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';
                } else if (this.musicConfig.platforms[p]) {
                    window.open(this.musicConfig.platforms[p], '_blank');
                }
                this.platformMenu.classList.remove('active');
            });
        });

        this.playBtn.addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play();
                this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';
            } else {
                this.audio.pause();
                this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
            if (this.audio.duration) {
                this.progressFill.style.width = (this.audio.currentTime / this.audio.duration * 100) + '%';
            }
            this.updateLyric();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.durationEl.textContent = this.formatTime(this.audio.duration);
        });

        this.audio.addEventListener('ended', () => {
            this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
            this.progressFill.style.width = '0%';
            this.currentLyricIndex = -1;
        });

        this.progressBar.addEventListener('click', (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = x * this.audio.duration;
        });
    },

    async loadConfig() {
        try {
            const resp = await fetch('src/configuration/config.json');
            if (resp.ok) {
                const cfg = await resp.json();
                if (cfg.music && cfg.music.platforms) {
                    this.musicConfig.platforms = cfg.music.platforms;
                }
            }
        } catch {}
        if (typeof SettingsManager !== 'undefined') {
            const s = SettingsManager.load();
            if (s.platforms) this.musicConfig.platforms = s.platforms;
        }
    }
};
