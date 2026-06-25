const SettingsManager = {
    defaults: null,
    localStorageKey: 'nemuran_settings',

    async init() {
        try {
            const configResp = await fetch('src/configuration/config.json');
            this.defaults = configResp.ok ? await configResp.json() : {};
        } catch {
            this.defaults = {};
        }
    },

    load() {
        const d = this.defaults || {};
        let u = {};
        try {
            u = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
        } catch {}
        return {
            nickname: u.nickname || '',
            siteTitle: u.siteTitle || d.site?.title || 'nemuran.me',
            glassEffect: u.glassEffect ?? d.display?.glassEffect ?? true,
            showDock: u.showDock ?? d.display?.showDock ?? true,
            wallpaper: u.wallpaper || 'default',
            platforms: {
                netease: u.platforms?.netease || d.music?.platforms?.netease || '',
                qq: u.platforms?.qq || d.music?.platforms?.qq || '',
                bilibili: u.platforms?.bilibili || d.music?.platforms?.bilibili || ''
            },
            playlist: u.playlist || d.music?.playlist || []
        };
    },

    save(settings) {
        const data = {
            nickname: settings.nickname,
            siteTitle: settings.siteTitle,
            glassEffect: settings.glassEffect,
            showDock: settings.showDock,
            wallpaper: settings.wallpaper,
            platforms: settings.platforms,
            playlist: settings.playlist
        };
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    },

    exportConfig() {
        const settings = this.load();
        const name = settings.nickname || '默认用户';
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    importConfig(jsonStr) {
        try {
            const imported = JSON.parse(jsonStr);
            localStorage.setItem(this.localStorageKey, JSON.stringify(imported));
            return true;
        } catch {
            return false;
        }
    },

    resetConfig() {
        localStorage.removeItem(this.localStorageKey);
        localStorage.removeItem('nemuran_wallpapers');
    },

    apply(settings) {
        if (settings.siteTitle) document.title = settings.siteTitle;

        document.querySelectorAll('.glass-card').forEach(card => {
            card.style.backdropFilter = settings.glassEffect ? '' : 'none';
            card.style.webkitBackdropFilter = settings.glassEffect ? '' : 'none';
            card.style.background = settings.glassEffect ? '' : 'rgba(0,0,0,0.6)';
        });

        const dock = document.getElementById('bottomDock');
        if (dock) dock.style.display = settings.showDock ? '' : 'none';

        if (settings.wallpaper && settings.wallpaper !== 'default') {
            document.body.style.backgroundImage = `url("${settings.wallpaper}")`;
        } else {
            document.body.style.backgroundImage = '';
        }

        MusicPlayer.musicConfig.platforms = settings.platforms || MusicPlayer.musicConfig.platforms;
    }
};

const WallpaperManager = {
    grid: null,
    selectedWallpaper: 'default',
    uploadKey: 'nemuran_wallpapers',

    async init() {
        this.grid = document.getElementById('wallpaperGrid');
        this.selectedWallpaper = settingsData.wallpaper || 'default';
        this.renderAll();
        this.bindEvents();
    },

    getBuiltinFiles() {
        return ['5fszgXeOxmL3Wdv.webp'];
    },

    getUploaded() {
        try {
            return JSON.parse(localStorage.getItem(this.uploadKey) || '[]');
        } catch { return []; }
    },

    saveUploaded(list) {
        localStorage.setItem(this.uploadKey, JSON.stringify(list));
    },

    renderAll() {
        const existing = this.grid.querySelectorAll('.wallpaper-item, .wallpaper-upload');
        existing.forEach(el => el.remove());

        const defaultItem = document.createElement('div');
        defaultItem.className = 'wallpaper-item' + (this.selectedWallpaper === 'default' ? ' active' : '');
        defaultItem.dataset.src = 'default';
        defaultItem.innerHTML = `<img src="background.webp" alt="默认"><span class="wallpaper-check">✓</span>`;
        this.grid.appendChild(defaultItem);

        this.getBuiltinFiles().forEach(file => {
            const src = 'file/picture/' + file;
            const item = document.createElement('div');
            item.className = 'wallpaper-item' + (this.selectedWallpaper === src ? ' active' : '');
            item.dataset.src = src;
            item.innerHTML = `<img src="${src}" alt="${file}" loading="lazy"><span class="wallpaper-check">✓</span>`;
            this.grid.appendChild(item);
        });

        const uploaded = this.getUploaded();
        uploaded.forEach((entry, idx) => {
            const item = document.createElement('div');
            item.className = 'wallpaper-item' + (this.selectedWallpaper === entry.data ? ' active' : '');
            item.dataset.src = entry.data;
            item.innerHTML = `<img src="${entry.data}" alt="${entry.name}" loading="lazy"><span class="wallpaper-check">✓</span><button class="wallpaper-delete" data-idx="${idx}">✕</button>`;
            this.grid.appendChild(item);
        });

        const uploadBtn = document.createElement('div');
        uploadBtn.className = 'wallpaper-upload';
        uploadBtn.innerHTML = `<span class="wallpaper-upload-icon">+</span><span class="wallpaper-upload-text">上传壁纸</span>`;
        this.grid.appendChild(uploadBtn);
    },

    updateActiveState() {
        this.grid.querySelectorAll('.wallpaper-item').forEach(item => {
            item.classList.toggle('active', item.dataset.src === this.selectedWallpaper);
        });
    },

    bindEvents() {
        this.grid.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.wallpaper-delete');
            if (deleteBtn) {
                e.stopPropagation();
                const idx = parseInt(deleteBtn.dataset.idx);
                const uploaded = this.getUploaded();
                if (this.selectedWallpaper === uploaded[idx]?.data) {
                    this.selectedWallpaper = 'default';
                }
                uploaded.splice(idx, 1);
                this.saveUploaded(uploaded);
                this.renderAll();
                return;
            }

            const uploadBtn = e.target.closest('.wallpaper-upload');
            if (uploadBtn) {
                document.getElementById('wallpaperUploadInput').click();
                return;
            }

            const item = e.target.closest('.wallpaper-item');
            if (!item) return;
            this.selectedWallpaper = item.dataset.src;
            this.updateActiveState();
        });

        document.getElementById('wallpaperUploadInput').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            const uploaded = this.getUploaded();
            let loaded = 0;
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    alert(`"${file.name}" 超过 5MB 限制，已跳过`);
                    loaded++;
                    if (loaded === files.length) { this.saveUploaded(uploaded); this.renderAll(); }
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    uploaded.push({ name: file.name, data: ev.target.result });
                    loaded++;
                    if (loaded === files.length) {
                        this.saveUploaded(uploaded);
                        this.renderAll();
                    }
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
    },

    getSelected() {
        return this.selectedWallpaper;
    }
};

function initSettings() {
    const settingsData = SettingsManager.load();
    SettingsManager.apply(settingsData);
    MusicPlayer.loadConfig();
    WallpaperManager.init();

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsClose = document.getElementById('settingsClose');
    const advancedOverlay = document.getElementById('advancedOverlay');
    const advancedClose = document.getElementById('advancedClose');
    const goAdvanced = document.getElementById('goAdvanced');
    const settingNickname = document.getElementById('settingNickname');
    const settingSiteTitle = document.getElementById('settingSiteTitle');
    const settingNetease = document.getElementById('settingNetease');
    const settingQQ = document.getElementById('settingQQ');
    const settingBilibili = document.getElementById('settingBilibili');
    const toggleGlass = document.getElementById('toggleGlass');
    const toggleDock = document.getElementById('toggleDock');
    const settingsSave = document.getElementById('settingsSave');
    const settingsReset = document.getElementById('settingsReset');
    const settingsExport = document.getElementById('settingsExport');
    const settingsImport = document.getElementById('settingsImport');
    const importFileInput = document.getElementById('importFileInput');

    function openSettings() {
        const s = SettingsManager.load();
        settingNickname.value = s.nickname || '';
        settingSiteTitle.value = s.siteTitle;
        toggleGlass.classList.toggle('active', s.glassEffect);
        toggleDock.classList.toggle('active', s.showDock);
        WallpaperManager.selectedWallpaper = s.wallpaper || 'default';
        WallpaperManager.updateActiveState();
        settingsOverlay.classList.add('active');
    }

    function closeSettings() { settingsOverlay.classList.remove('active'); }

    function openAdvanced() {
        const s = SettingsManager.load();
        settingNetease.value = s.platforms.netease || '';
        settingQQ.value = s.platforms.qq || '';
        settingBilibili.value = s.platforms.bilibili || '';
        advancedOverlay.classList.add('active');
    }

    function closeAdvanced() { advancedOverlay.classList.remove('active'); }

    settingsBtn.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeSettings(); });
    goAdvanced.addEventListener('click', openAdvanced);
    advancedClose.addEventListener('click', closeAdvanced);
    advancedOverlay.addEventListener('click', (e) => { if (e.target === advancedOverlay) closeAdvanced(); });

    toggleGlass.addEventListener('click', () => toggleGlass.classList.toggle('active'));
    toggleDock.addEventListener('click', () => toggleDock.classList.toggle('active'));

    settingsSave.addEventListener('click', () => {
        const nickname = settingNickname.value.trim() || '默认用户';
        const current = SettingsManager.load();
        const newSettings = {
            nickname: nickname,
            siteTitle: settingSiteTitle.value.trim() || current.siteTitle,
            glassEffect: toggleGlass.classList.contains('active'),
            showDock: toggleDock.classList.contains('active'),
            wallpaper: WallpaperManager.getSelected(),
            platforms: {
                netease: settingNetease.value.trim(),
                qq: settingQQ.value.trim(),
                bilibili: settingBilibili.value.trim()
            },
            playlist: current.playlist
        };
        SettingsManager.save(newSettings);
        SettingsManager.apply(newSettings);
        MusicPlayer.loadConfig();
        closeSettings();
    });

    settingsExport.addEventListener('click', () => {
        SettingsManager.exportConfig();
    });

    settingsImport.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (SettingsManager.importConfig(ev.target.result)) {
                closeAdvanced();
                location.reload();
            } else {
                alert('配置文件格式错误');
            }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });

    settingsReset.addEventListener('click', () => {
        SettingsManager.resetConfig();
        SettingsManager.apply(SettingsManager.load());
        closeAdvanced();
        closeSettings();
        location.reload();
    });
}
