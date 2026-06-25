const MusicPlayer = {
    audio: null,
    playBtn: null,
    prevBtn: null,
    nextBtn: null,
    currentTimeEl: null,
    durationEl: null,
    progressBar: null,
    progressFill: null,
    lyricInner: null,
    lyricContainer: null,
    lyrics: [],
    currentLyricIndex: -1,
    playlist: [],
    currentTrack: 0,
    musicConfig: {
        platforms: {}
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
        this.lyricInner = document.getElementById('lyricInner');
        this.lyricContainer = document.getElementById('lyricContainer');

        this.buildPlaylist();
        this.loadTrack(this.currentTrack, false);
        this.bindEvents();
    },

    buildPlaylist() {
        this.playlist = [
            { file: 'file/music/music.mp3', title: '命に嫌われている', artist: 'カンザキイオリ', lrc: 'file/music/lyrics.lrc' },
            { file: 'file/music/カンザキイオリ,25時、ナイトコードで。,初音ミク - 命に嫌われている (feat. 宵崎奏 & 初音ミク).mp3', title: '命に嫌われている (feat. 宵崎奏 & 初音ミク)', artist: 'カンザキイオリ, 25時、ナイトコードで。, 初音ミク', lrc: '' }
        ];
        this.renderPlaylistUI();
    },

    renderPlaylistUI() {
        const list = document.getElementById('playlistList');
        list.innerHTML = this.playlist.map((t, i) => `
            <div class="playlist-item${i === this.currentTrack ? ' active' : ''}" data-index="${i}">
                <span class="playlist-item-index">${i + 1}</span>
                <div class="playlist-item-playing"><svg viewBox="0 0 24 24" fill="rgba(138,180,248,0.9)"><rect x="4" y="3" width="3" height="18" rx="1"><animate attributeName="height" values="18;10;18" dur="0.8s" repeatCount="indefinite"/><animate attributeName="y" values="3;7;3" dur="0.8s" repeatCount="indefinite"/></rect><rect x="10.5" y="3" width="3" height="18" rx="1"><animate attributeName="height" values="10;18;10" dur="0.8s" repeatCount="indefinite"/><animate attributeName="y" values="7;3;7" dur="0.8s" repeatCount="indefinite"/></rect><rect x="17" y="3" width="3" height="18" rx="1"><animate attributeName="height" values="18;8;18" dur="0.6s" repeatCount="indefinite"/><animate attributeName="y" values="3;8;3" dur="0.6s" repeatCount="indefinite"/></rect></svg></div>
                <div class="playlist-item-info">
                    <div class="playlist-item-name">${t.title}</div>
                    <div class="playlist-item-artist">${t.artist}</div>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.index);
                if (idx === this.currentTrack) return;
                this.loadTrack(idx, true);
            });
        });
    },

    updatePlaylistActive() {
        document.querySelectorAll('.playlist-item').forEach((el, i) => {
            el.classList.toggle('active', i === this.currentTrack);
        });
    },

    loadTrack(index, autoPlay) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentTrack = index;
        const track = this.playlist[index];

        this.audio.src = track.file;
        document.getElementById('musicTitle').textContent = track.title;
        document.getElementById('musicArtist').textContent = track.artist;

        this.progressFill.style.width = '0%';
        this.currentTimeEl.textContent = '00:00';
        this.durationEl.textContent = '00:00';
        this.currentLyricIndex = -1;
        this.lyrics = [];

        if (track.lrc) {
            this.loadLyricsFrom(track.lrc);
        } else {
            this.lyricInner.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
        }

        this.loadCoverFrom(track.file);
        this.updatePlaylistActive();

        if (autoPlay) {
            this.audio.play().then(() => {
                this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';
            }).catch(() => {});
        }
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

    loadLyricsFrom(url) {
        fetch(url)
            .then(r => r.ok ? r.text() : '')
            .then(text => {
                if (text) {
                    this.lyrics = this.parseLRC(text);
                    this.renderLyrics();
                }
            })
            .catch(() => {});
    },

    loadCoverFrom(src) {
        jsmediatags.read(src, {
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
            onError: function() {
                document.getElementById('coverImg').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23333" width="64" height="64" rx="32"/><text x="32" y="38" font-size="24" fill="%23888" text-anchor="middle">♫</text></svg>';
            }
        });
    },

    formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    },

    nextTrack() {
        const next = (this.currentTrack + 1) % this.playlist.length;
        this.loadTrack(next, true);
    },

    prevTrack() {
        const prev = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(prev, true);
    },

    bindEvents() {
        const playlistBtn = document.getElementById('playlistBtn');
        const playlistOverlay = document.getElementById('playlistOverlay');
        const playlistClose = document.getElementById('playlistClose');

        playlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playlistOverlay.classList.toggle('active');
        });
        playlistClose.addEventListener('click', () => playlistOverlay.classList.remove('active'));
        playlistOverlay.addEventListener('click', (e) => { if (e.target === playlistOverlay) playlistOverlay.classList.remove('active'); });

        this.playBtn.addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play();
                this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';
            } else {
                this.audio.pause();
                this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
            }
        });

        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.prevBtn.addEventListener('click', () => this.prevTrack());

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
            this.nextTrack();
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
