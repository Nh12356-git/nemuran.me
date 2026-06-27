const DockManager = {
    config: null,
    localStorageKey: 'nemuran_settings',
    defaultTools: [
        { name: '百度', url: 'https://www.baidu.com', icon: 'https://www.baidu.com/favicon.ico' },
        { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
        { name: 'Gitee', url: 'https://gitee.com', icon: 'https://gitee.com/favicon.ico' },
    ],

    async init() {
        await this.loadConfig();
        this.renderDock();
        this.bindEvents();
    },

    async loadConfig() {
        try {
            const configResp = await fetch('src/configuration/config.json');
            this.config = configResp.ok ? await configResp.json() : {};
            if (this.config.dockTools && this.config.dockTools.length > 0) {
                this.defaultTools = this.config.dockTools;
            }
        } catch {
            this.config = { dockTools: this.defaultTools };
        }
    },

    getCustomDockTools() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
            return saved.dockTools || [];
        } catch {
            return [];
        }
    },

    saveCustomDockTools(tools) {
        try {
            const saved = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
            saved.dockTools = tools;
            localStorage.setItem(this.localStorageKey, JSON.stringify(saved));
        } catch {}
    },

    createToolElement(tool, isCustom) {
        const el = document.createElement('div');
        el.className = 'dock-item';
        el.dataset.url = tool.url;
        const iconHtml = this.createIconHtml(tool);
        el.innerHTML = `<span class="dock-icon">${iconHtml}</span><span class="dock-label">${tool.name}</span>`;
        if (isCustom) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'dock-remove';
            removeBtn.textContent = '\u00d7';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tools = this.getCustomDockTools().filter(t => t.url !== tool.url);
                this.saveCustomDockTools(tools);
                el.remove();
                const divider = document.getElementById('bottomDock').querySelector('.dock-divider');
                if (divider && !document.getElementById('bottomDock').querySelector('.dock-item')) {
                    divider.remove();
                }
            });
            el.appendChild(removeBtn);
        }
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('dock-remove')) return;
            window.open(tool.url, '_blank');
        });
        return el;
    },

    createIconHtml(tool) {
        if (tool.icon && tool.icon.startsWith('http')) {
            const fallback = tool.name.charAt(0);
            return `<img src="${tool.icon}" alt="${tool.name}" onerror="this.outerHTML='${fallback}'" referrerpolicy="no-referrer">`;
        }
        return tool.icon || tool.name.charAt(0);
    },

    renderDock() {
        const dock = document.getElementById('bottomDock');
        const addBtn = document.getElementById('dockAddBtn');
        dock.querySelectorAll('.dock-item').forEach(el => el.remove());
        dock.querySelectorAll('.dock-divider').forEach(el => el.remove());

        const customTools = this.getCustomDockTools();
        const hasCustom = customTools.length > 0;

        customTools.forEach(tool => {
            dock.insertBefore(this.createToolElement(tool, true), addBtn);
        });

        if (hasCustom) {
            const d = document.createElement('div');
            d.className = 'dock-divider';
            dock.insertBefore(d, addBtn);
        }

        this.defaultTools.forEach(tool => {
            dock.insertBefore(this.createToolElement(tool, false), addBtn);
        });
    },

    bindEvents() {
        const dock = document.getElementById('bottomDock');
        const addBtn = document.getElementById('dockAddBtn');
        const modal = document.getElementById('dockModal');
        const cancelBtn = document.getElementById('dockCancel');
        const confirmBtn = document.getElementById('dockConfirm');
        const nameInput = document.getElementById('toolName');
        const urlInput = document.getElementById('toolUrl');
        const iconInput = document.getElementById('toolIconUrl');

        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
            nameInput.value = '';
            urlInput.value = '';
            iconInput.value = '';
            setTimeout(() => nameInput.focus(), 300);
        });

        cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        confirmBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            let url = urlInput.value.trim();
            let customIcon = iconInput.value.trim();
            if (!name || !url) return;
            if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
            const tools = this.getCustomDockTools();
            if (tools.some(t => t.url === url)) return;
            let icon;
            if (customIcon) {
                if (!/^https?:\/\//i.test(customIcon)) customIcon = 'https://' + customIcon;
                icon = customIcon;
            } else {
                try {
                    const host = new URL(url).hostname;
                    icon = `https://${host}/favicon.ico`;
                } catch { icon = '\ud83c\udf10'; }
            }
            tools.push({ name, url, icon });
            this.saveCustomDockTools(tools);
            modal.classList.remove('active');
            this.renderDock();
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmBtn.click();
        });
    }
};
