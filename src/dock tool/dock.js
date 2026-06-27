const DockManager = {
    tools: [],

    async init() {
        await this.loadTools();
        this.renderDock();
        this.bindEvents();
    },

    async loadTools() {
        try {
            const res = await fetch('/api/dock');
            if (res.ok) this.tools = await res.json();
        } catch {}
    },

    getIconUrl(url) {
        try {
            const host = new URL(url).hostname;
            return `https://${host}/favicon.ico`;
        } catch {
            return '';
        }
    },

    createToolElement(tool) {
        const el = document.createElement('div');
        el.className = 'dock-item';
        el.dataset.url = tool.url;
        el.dataset.label = tool.name;
        const iconUrl = tool.icon || this.getIconUrl(tool.url);
        const iconHtml = iconUrl
            ? `<img src="${iconUrl}" alt="${tool.name}" onerror="this.outerHTML='${tool.name.charAt(0)}'" referrerpolicy="no-referrer">`
            : tool.name.charAt(0);
        el.innerHTML = `<span class="dock-icon">${iconHtml}</span><span class="dock-label">${tool.name}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'dock-remove';
        removeBtn.textContent = '\u00d7';
        removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try { await fetch('/api/dock/' + tool.id, { method: 'DELETE' }); } catch {}
            this.tools = this.tools.filter(t => t.id !== tool.id);
            el.remove();
        });
        el.appendChild(removeBtn);
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('dock-remove')) return;
            window.open(tool.url, '_blank');
        });
        return el;
    },

    renderDock() {
        const dock = document.getElementById('bottomDock');
        const addBtn = document.getElementById('dockAddBtn');
        dock.querySelectorAll('.dock-item').forEach(el => el.remove());
        this.tools.forEach(tool => {
            dock.insertBefore(this.createToolElement(tool), addBtn);
        });
    },

    bindEvents() {
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

        confirmBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            let url = urlInput.value.trim();
            let customIcon = iconInput.value.trim();
            if (!name || !url) return;
            if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
            if (this.tools.some(t => t.url === url)) return;
            const icon = customIcon ? customIcon : '';
            try {
                const res = await fetch('/api/dock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, url, icon })
                });
                if (res.ok) {
                    const data = await res.json();
                    this.tools.push({ id: data.id, name, url, icon });
                }
            } catch {}
            modal.classList.remove('active');
            this.renderDock();
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmBtn.click();
        });
    }
};
