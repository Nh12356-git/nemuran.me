const SettingsManager = {
    defaults: null,
    localStorageKey: 'nemuran_settings',
    serverPlatforms: { netease: '', qq: '', bilibili: '' },

    async init() {
        try {
            const configResp = await fetch('src/configuration/config.json');
            this.defaults = configResp.ok ? await configResp.json() : {};
        } catch {
            this.defaults = {};
        }
        try {
            const sResp = await fetch('/api/settings');
            if (sResp.ok) {
                const s = await sResp.json();
                this.serverPlatforms = {
                    netease: s.platformNetease || '',
                    qq: s.platformQQ || '',
                    bilibili: s.platformBilibili || ''
                };
            }
        } catch {}
    },

    load() {
        const d = this.defaults || {};
        let u = {};
        try {
            u = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
        } catch {}
        return {
            glassEffect: u.glassEffect ?? d.display?.glassEffect ?? true,
            showDock: u.showDock ?? d.display?.showDock ?? true,
            picture: u.picture || 'default',
            platforms: this.serverPlatforms,
            playlist: u.playlist || d.music?.playlist || []
        };
    },

    save(settings) {
        const data = {
            glassEffect: settings.glassEffect,
            showDock: settings.showDock,
            picture: settings.picture,
            playlist: settings.playlist
        };
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    },

    apply(settings) {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.style.backdropFilter = settings.glassEffect ? '' : 'none';
            card.style.webkitBackdropFilter = settings.glassEffect ? '' : 'none';
            card.style.background = settings.glassEffect ? '' : 'rgba(0,0,0,0.6)';
        });

        const dock = document.getElementById('bottomDock');
        if (dock) dock.style.display = settings.showDock ? '' : 'none';

        if (settings.picture && settings.picture !== 'default') {
            document.body.style.backgroundImage = `url("${settings.picture}")`;
        } else {
            document.body.style.backgroundImage = '';
        }

        MusicPlayer.musicConfig.platforms = settings.platforms || MusicPlayer.musicConfig.platforms;
    },

    current() {
        const s = this.load();
        return {
            glassEffect: s.glassEffect,
            showDock: s.showDock,
            picture: s.picture,
            platforms: s.platforms,
            playlist: s.playlist
        };
    },

    applyAndSave(newSettings) {
        this.save(newSettings);
        this.apply(newSettings);
        MusicPlayer.loadConfig();
    }
};

const PictureManager = {
    grid: null,
    selectedPicture: 'default',
    onChange: null,

    async init() {
        this.grid = document.getElementById('pictureGrid');
        const s = SettingsManager.load();
        this.selectedPicture = s.picture || 'default';
        this.renderAll();
        this.bindEvents();
    },

    getBuiltinFiles() {
        return ['5fszgXeOxmL3Wdv.webp'];
    },

    renderAll() {
        const existing = this.grid.querySelectorAll('.picture-item');
        existing.forEach(el => el.remove());

        const defaultItem = document.createElement('div');
        defaultItem.className = 'picture-item' + (this.selectedPicture === 'default' ? ' active' : '');
        defaultItem.dataset.src = 'default';
        defaultItem.innerHTML = `<img src="background.webp" alt="默认"><span class="picture-check">✓</span>`;
        this.grid.appendChild(defaultItem);

        this.getBuiltinFiles().forEach(file => {
            const src = 'file/picture/' + file;
            const item = document.createElement('div');
            item.className = 'picture-item' + (this.selectedPicture === src ? ' active' : '');
            item.dataset.src = src;
            item.innerHTML = `<img src="${src}" alt="${file}" loading="lazy"><span class="picture-check">✓</span>`;
            this.grid.appendChild(item);
        });
    },

    updateActiveState() {
        this.grid.querySelectorAll('.picture-item').forEach(item => {
            item.classList.toggle('active', item.dataset.src === this.selectedPicture);
        });
    },

    bindEvents() {
        this.grid.addEventListener('click', (e) => {
            const item = e.target.closest('.picture-item');
            if (!item) return;
            this.selectedPicture = item.dataset.src;
            this.updateActiveState();
            if (this.onChange) this.onChange(this.selectedPicture);
        });
    },

    getSelected() {
        return this.selectedPicture;
    }
};

async function initSettings() {
    await SettingsManager.init();
    const settingsData = SettingsManager.load();
    SettingsManager.apply(settingsData);
    MusicPlayer.loadConfig();
    PictureManager.init();

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsClose = document.getElementById('settingsClose');
    const toggleGlass = document.getElementById('toggleGlass');
    const toggleDock = document.getElementById('toggleDock');

    function openSettings() {
        const s = SettingsManager.load();
        toggleGlass.classList.toggle('active', s.glassEffect);
        toggleDock.classList.toggle('active', s.showDock);
        PictureManager.selectedPicture = s.picture || 'default';
        PictureManager.updateActiveState();
        settingsOverlay.classList.add('active');
    }

    function closeSettings() { settingsOverlay.classList.remove('active'); }

    settingsBtn.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeSettings(); });

    function saveAndApply() {
        const current = SettingsManager.current();
        current.glassEffect = toggleGlass.classList.contains('active');
        current.showDock = toggleDock.classList.contains('active');
        SettingsManager.applyAndSave(current);
    }

    toggleGlass.addEventListener('click', () => {
        toggleGlass.classList.toggle('active');
        saveAndApply();
    });

    toggleDock.addEventListener('click', () => {
        toggleDock.classList.toggle('active');
        saveAndApply();
    });

    PictureManager.onChange = (picture) => {
        const current = SettingsManager.current();
        current.picture = picture;
        SettingsManager.applyAndSave(current);
    };

    const token = localStorage.getItem('user_token');
    const loginBtn = document.getElementById('loginBtn');

    if (token) {
        fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                if (data.user && loginBtn) {
                    loginBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        ${data.user.username}
                    `;
                    loginBtn.href = data.user.role === 'admin' ? '/admin' : '/user';
                }
            })
            .catch(() => {
                localStorage.removeItem('user_token');
                localStorage.removeItem('user_info');
            });
    } else if (loginBtn) {
        loginBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            登录 / 注册
        `;
        loginBtn.href = '/login';
    }
}
