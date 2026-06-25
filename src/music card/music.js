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

    async init() {
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

        await this.buildPlaylist();
        this.loadTrack(this.currentTrack, false);
        this.bindEvents();
        this.initMarquee();
    },

    initMarquee() {
        const meta = document.querySelector('.music-meta');
        const titleEl = document.getElementById('musicTitle');
        const artistEl = document.getElementById('musicArtist');

        const startMarquee = (el) => {
            const parent = el.parentElement;
            const overflow = el.scrollWidth - parent.clientWidth;
            if (overflow <= 4) { el.classList.remove('marquee'); return; }
            const speed = 50;
            const duration = (el.scrollWidth / speed);
            el.style.setProperty('--scroll-offset', `-${overflow}px`);
            el.style.setProperty('--scroll-duration', `${duration}s`);
            el.classList.add('marquee');
        };

        const stopMarquee = (el) => {
            el.classList.remove('marquee');
            el.style.transform = '';
        };

        meta.addEventListener('mouseenter', () => {
            startMarquee(titleEl);
            startMarquee(artistEl);
        });
        meta.addEventListener('mouseleave', () => {
            stopMarquee(titleEl);
            stopMarquee(artistEl);
        });
    },

    async buildPlaylist() {
        try {
            const resp = await fetch('file/music/list.json');
            const list = await resp.json();
            this.playlist = list.map(item => ({
                id: '#' + item.id,
                file: `file/music/${item.folder}/${item.file}`,
                title: item.title,
                artist: item.artist,
                lrc: `file/music/${item.folder}/lyrics.lrc`
            }));
        } catch {
            this.playlist = [];
        }
        await this.readAllMetadata();
        this.renderPlaylistUI();
    },

    readMP3Tags(src) {
        return new Promise((resolve) => {
            const url = new URL(src, window.location.href).href;
            jsmediatags.read(url, {
                onSuccess: (tag) => {
                    const t = tag.tags;
                    resolve({
                        title: t.title || '',
                        artist: t.artist || '',
                        picture: t.picture || null
                    });
                },
                onError: () => resolve({ title: '', artist: '', picture: null })
            });
        });
    },

    async readAllMetadata() {
        const tasks = this.playlist.map(async (track) => {
            const tags = await this.readMP3Tags(track.file);
            if (tags.title) track.title = tags.title;
            if (tags.artist) track.artist = tags.artist;
            track._picture = tags.picture;
        });
        await Promise.all(tasks);
    },

    renderPlaylistUI() {
        const list = document.getElementById('playlistList');
        list.innerHTML = this.playlist.map((t, i) => `
            <div class="playlist-item${i === this.currentTrack ? ' active' : ''}" data-index="${i}">
                <span class="playlist-item-index">${t.id}</span>
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
                document.getElementById('playlistOverlay').classList.remove('active');
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

        if (track._picture) {
            var image = track._picture;
            var base64 = '';
            for (var i = 0; i < image.data.length; i++) {
                base64 += String.fromCharCode(image.data[i]);
            }
            document.getElementById('coverImg').src = 'data:' + image.format + ';base64,' + window.btoa(base64);
        } else {
            document.getElementById('coverImg').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23333" width="64" height="64" rx="32"/><text x="32" y="38" font-size="24" fill="%23888" text-anchor="middle">♫</text></svg>';
        }

        this.progressFill.style.width = '0%';
        this.currentTimeEl.textContent = '00:00';
        this.durationEl.textContent = '00:00';
        this.currentLyricIndex = -1;
        this.lyrics = [];

        if (track.lrc) {
            this.loadLyricsFrom(track.lrc);
        } else {
            this.loadLyricsFromMP3(track.file);
        }

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
                } else {
                    this.lyricInner.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
                }
            })
            .catch(() => {
                this.lyricInner.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
            });
    },

    loadLyricsFromMP3(src) {
        const url = new URL(src, window.location.href).href;
        jsmediatags.read(url, {
            onSuccess: (tag) => {
                const lyrics = tag.tags.lyrics || tag.tags.USLT || '';
                if (lyrics && typeof lyrics === 'string' && lyrics.trim()) {
                    const lines = lyrics.trim().split('\n');
                    const total = lines.length;
                    const duration = this.audio.duration || 180;
                    const interval = duration / total;
                    this.lyrics = lines.map((text, i) => ({
                        time: i * interval,
                        text: text.trim()
                    })).filter(l => l.text);
                    this.renderLyrics();
                } else {
                    this.lyricInner.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
                }
            },
            onError: () => {
                this.lyricInner.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
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
                this.audio.play().then(() => {
                    this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';
                }).catch(() => {});
            } else {
                this.audio.pause();
                this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
            }
        });

        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.prevBtn.addEventListener('click', () => this.prevTrack());

        this.audio.addEventListener('timeupdate', () => {
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
            if (this.audio.duration && !this._dragging) {
                this.progressFill.style.width = (this.audio.currentTime / this.audio.duration * 100) + '%';
            }
            this.updateLyric();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.durationEl.textContent = this.formatTime(this.audio.duration);
        });

        this.audio.addEventListener('ended', () => {
            this.playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
            this.nextTrack();
        });

        const seekFromEvent = (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            this.progressFill.style.width = (x * 100) + '%';
            if (this.audio.duration) {
                this.audio.currentTime = x * this.audio.duration;
            }
        };

        this.progressBar.addEventListener('click', seekFromEvent);

        this.progressBar.addEventListener('mousedown', (e) => {
            this._dragging = true;
            seekFromEvent(e);
            const onMove = (ev) => seekFromEvent(ev);
            const onUp = () => {
                this._dragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') {
                e.preventDefault();
                this.playBtn.click();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (this.audio.duration) this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
            }
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
