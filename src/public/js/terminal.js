// ─── Auth guard ───────────────────────────────────────────────────────────────
let currentUser = null;

async function loadCurrentUser() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) { window.location.href = '/login'; return null; }
        return await res.json();
    } catch {
        window.location.href = '/login';
        return null;
    }
}

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

// ─── State ────────────────────────────────────────────────────────────────────
const terminals = {};
let dragData = null;
const isMobile = () => window.innerWidth <= 768;

// ─── Socket events ────────────────────────────────────────────────────────────
socket.on('auth-required', () => { window.location.href = '/login'; });
socket.on('connect', () => { setConnectionStatus('connected'); socket.emit('list-sessions'); });
socket.on('disconnect', () => setConnectionStatus('disconnected'));
socket.on('connect_error', () => setConnectionStatus('error'));

socket.on('session-list', (list) => {
    const closed = JSON.parse(sessionStorage.getItem('ftermx_closed') || '[]');
    list.forEach(({ sessionId, type }) => {
        if (closed.includes(String(sessionId))) {
            // User explicitly closed this session — kill it server-side
            socket.emit('shell-close', { sessionId });
            return;
        }
        if (!terminals[sessionId]) reattachTerminal(sessionId, type || 'local');
    });
});

socket.on('shell-created', ({ sessionId, type }) => {
    const t = terminals[sessionId];
    if (!t) return;
    t.ptyReady = true;
    t.type = type || 'local';
    updateTerminalStatus(sessionId, 'connected');
    updateSidebarSession(sessionId, 'connected');
    updateCardLabel(sessionId, type || 'local');
    t.term.focus();
});

socket.on('shell-data', ({ sessionId, data }) => {
    const t = terminals[sessionId];
    if (t) t.term.write(data);
});

socket.on('shell-exit', ({ sessionId, exitCode }) => {
    const t = terminals[sessionId];
    if (!t) return;
    t.ptyReady = false;
    t.term.write(`\r\n\x1b[33m[Process exited — code ${exitCode}]\x1b[0m\r\n`);
    updateTerminalStatus(sessionId, 'disconnected');
    updateSidebarSession(sessionId, 'disconnected');
});

socket.on('shell-error', ({ sessionId, error }) => {
    const t = terminals[sessionId];
    if (!t) return;
    if (error === 'Session no longer exists') {
        t._ro?.disconnect();
        t.term.dispose();
        t.card?.remove();
        delete terminals[sessionId];
        removeSidebarSession(sessionId);
        updateSessionCount();
        if (!document.querySelector('#terminalGrid .terminal-card')) showEmptyState();
        return;
    }
    t.ptyReady = false;
    t.term.write(`\r\n\x1b[31m[Error: ${error}]\x1b[0m\r\n`);
    updateTerminalStatus(sessionId, 'error');
});

// ─── Card label ───────────────────────────────────────────────────────────────
function updateCardLabel(sessionId, type) {
    const t = terminals[sessionId];
    if (!t) return;
    const icon = type === 'ssh' ? 'fa-network-wired' : 'fa-terminal';
    const label = type === 'ssh' ? 'ssh' : 'shell';
    const center = t.card.querySelector('.toolbar-center');
    if (center) center.innerHTML = `<i class="fas ${icon}"></i> ${label} · #${sessionId}`;
}

// ─── Reattach ─────────────────────────────────────────────────────────────────
function reattachTerminal(sessionId, type = 'local') {
    if (terminals[sessionId]) return;
    const card = buildTerminalCard(sessionId);
    card.id = `terminal-${sessionId}`;
    card.setAttribute('data-session-id', sessionId);
    card.querySelector('.toolbar-center').innerHTML = `<i class="fas fa-terminal"></i> shell · #${sessionId}`;
    card.querySelector('.terminal-status').id = `status-${sessionId}`;

    const term = makeTerminal();
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(card.querySelector('.terminal-container'));

    requestAnimationFrame(() => requestAnimationFrame(() => { fitAddon.fit(); }));

    terminals[sessionId] = { term, fitAddon, card, ptyReady: false, sessionId, type };
    updateSessionCount();
    addSidebarSession(sessionId, type);
    updateTerminalStatus(sessionId, 'connecting');
    setupTerminalEvents(sessionId);
    setupCardControls(sessionId, card, term, fitAddon);
    socket.emit('reattach-shell', { sessionId });
}

// ─── Spawn terminal ───────────────────────────────────────────────────────────
function spawnTerminal() {
    const tempId = 'tmp-' + Date.now();
    const card = buildTerminalCard(tempId);

    const term = makeTerminal();
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(card.querySelector('.terminal-container'));

    terminals[tempId] = { term, fitAddon, card, ptyReady: false };
    updateSessionCount();

    socket.once('shell-created', ({ sessionId, type }) => {
        const entry = terminals[tempId];
        if (!entry) return;
        delete terminals[tempId];
        entry.sessionId = sessionId;
        entry.type = type || 'local';
        terminals[sessionId] = entry;

        card.id = `terminal-${sessionId}`;
        card.setAttribute('data-session-id', sessionId);
        updateCardLabel(sessionId, entry.type);
        card.querySelector('.terminal-status').id = `status-${sessionId}`;

        entry.ptyReady = true;
        updateTerminalStatus(sessionId, 'connected');
        addSidebarSession(sessionId, entry.type);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            fitAddon.fit();
            socket.emit('shell-resize', { sessionId, cols: term.cols, rows: term.rows });
        }));
        term.focus();
        setupTerminalEvents(sessionId);
    });

    requestAnimationFrame(() => requestAnimationFrame(() => {
        fitAddon.fit();
        socket.emit('spawn-shell', { cols: term.cols, rows: term.rows });
    }));
    setupCardControls(tempId, card, term, fitAddon);
}

// ─── Spawn SSH ────────────────────────────────────────────────────────────────
function spawnSSH(opts) {
    const tempId = 'tmp-' + Date.now();
    const card = buildTerminalCard(tempId);
    card.querySelector('.toolbar-center').innerHTML = `<i class="fas fa-network-wired"></i> connecting…`;

    const term = makeTerminal();
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(card.querySelector('.terminal-container'));

    terminals[tempId] = { term, fitAddon, card, ptyReady: false };
    updateSessionCount();
    navigateTo('terminal');

    const onCreated = ({ sessionId, type }) => {
        const entry = terminals[tempId];
        if (!entry) return;
        socket.off('shell-created', onCreated);
        delete terminals[tempId];
        entry.sessionId = sessionId;
        entry.type = type || 'ssh';
        terminals[sessionId] = entry;

        card.id = `terminal-${sessionId}`;
        card.setAttribute('data-session-id', sessionId);
        updateCardLabel(sessionId, 'ssh');
        card.querySelector('.terminal-status').id = `status-${sessionId}`;

        entry.ptyReady = true;
        updateTerminalStatus(sessionId, 'connected');
        addSidebarSession(sessionId, 'ssh');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            fitAddon.fit();
            socket.emit('shell-resize', { sessionId, cols: term.cols, rows: term.rows });
        }));
        term.focus();
        setupTerminalEvents(sessionId);
    };
    socket.on('shell-created', onCreated);

    socket.on('shell-error', (data) => {
        if (terminals[tempId]) {
            term.write(`\r\n\x1b[31m[SSH Error: ${data.error}]\x1b[0m\r\n`);
            updateTerminalStatus(tempId, 'error');
        }
    });

    requestAnimationFrame(() => requestAnimationFrame(() => {
        fitAddon.fit();
        socket.emit('spawn-ssh', { ...opts, cols: term.cols, rows: term.rows });
    }));
    setupCardControls(tempId, card, term, fitAddon);
}

// ─── Terminal factory ─────────────────────────────────────────────────────────
function makeTerminal() {
    return new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        theme: {
            background: '#060a14', foreground: '#c9d1d9', cursor: '#00d4ff',
            cursorAccent: '#060a14', selectionBackground: 'rgba(0,212,255,0.22)',
            black: '#0d1117', red: '#ff3d5a', green: '#00ff88', yellow: '#ffd166',
            blue: '#00d4ff', magenta: '#a855f7', cyan: '#06d6d6', white: '#c9d1d9',
            brightBlack: '#3d5068', brightRed: '#ff6b7a', brightGreen: '#39ffa0',
            brightYellow: '#ffe066', brightBlue: '#47dfff', brightMagenta: '#c084fc',
            brightCyan: '#22e9e9', brightWhite: '#e2eaf5'
        },
        fontFamily: '"JetBrains Mono","Cascadia Code","Fira Code",monospace',
        fontSize: 13,
        lineHeight: 1.25,
        letterSpacing: 0.3,
        allowTransparency: true,
        scrollback: 5000
    });
}

// ─── Build card DOM ───────────────────────────────────────────────────────────
function buildTerminalCard(id) {
    const grid = document.getElementById('terminalGrid');
    const es = grid.querySelector('.empty-state');
    if (es) {
        es.remove();
        grid.classList.remove('is-empty');
    }

    const card = document.createElement('div');
    card.className = 'terminal-card';
    card.id = `terminal-${id}`;
    card.setAttribute('data-session-id', id);
    card.draggable = !isMobile();

    card.innerHTML = `
    <div class="terminal-toolbar">
      <div class="toolbar-left">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="toolbar-center">
        <i class="fas fa-terminal"></i> spawning…
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" data-action="files" title="File Manager">
          <i class="fas fa-folder-open"></i>
        </button>
        <button class="toolbar-btn" data-action="clear" title="Clear">
          <i class="fas fa-eraser"></i>
        </button>
        <button class="toolbar-btn danger" data-action="close" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    <div class="terminal-container"></div>
    <div class="terminal-status connecting" id="status-${id}">
      <span class="status-dot"></span> Spawning…
    </div>
  `;

    grid.prepend(card);
    const page = grid.closest('.page');
    if (page) { page.scrollTop = 0; page.scrollLeft = 0; }
    return card;
}

function showEmptyState() {
    const grid = document.getElementById('terminalGrid');
    grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-terminal"></i></div>
      <h3>Ftermx Ready</h3>
      <p>Click <strong>New Terminal</strong> to spawn a shell on this server</p>
      <p class="author">by Farel Alfareza</p>
    </div>`;
    grid.classList.add('is-empty');
}

// ─── Input, resize, keyboard ──────────────────────────────────────────────────
function setupTerminalEvents(sessionId) {
    const { term, fitAddon, card } = terminals[sessionId];

    term.onData((data) => {
        if (terminals[sessionId]?.ptyReady)
            socket.emit('shell-input', { sessionId, data });
    });

    const ro = new ResizeObserver(() => {
        clearTimeout(terminals[sessionId]?._rt);
        if (terminals[sessionId]) {
            terminals[sessionId]._rt = setTimeout(() => {
                fitAddon.fit();
                if (terminals[sessionId]?.ptyReady)
                    socket.emit('shell-resize', { sessionId, cols: term.cols, rows: term.rows });
            }, 80);
        }
    });
    ro.observe(card);
    terminals[sessionId]._ro = ro;

    term.attachCustomKeyEventHandler((e) => {
        if (e.ctrlKey && e.key === 'c' && term.hasSelection()) {
            document.execCommand('copy');
            return false;
        }
        if (e.ctrlKey && e.key === 'v') {
            navigator.clipboard.readText().then((text) => {
                if (terminals[sessionId]?.ptyReady)
                    socket.emit('shell-input', { sessionId, data: text });
            }).catch(() => {});
            return false;
        }
        return true;
    });
}

// ─── Card toolbar + drag ──────────────────────────────────────────────────────
function setupCardControls(id, card, term, fitAddon) {
    card.querySelector('[data-action="clear"]').addEventListener('click', () => term.clear());
    card.querySelector('[data-action="close"]').addEventListener('click', () =>
        closeTerminal(card.getAttribute('data-session-id'))
    );
    card.querySelector('[data-action="files"]').addEventListener('click', () => {
        navigateTo('files');
        // Optionally trigger file manager refresh
        if (window.fmRefresh) window.fmRefresh();
    });
    card.addEventListener('click', () => term.focus());

    if (!isMobile()) {
        card.addEventListener('dragstart', (e) => {
            dragData = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            document.querySelectorAll('.terminal-card.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (dragData && dragData !== card) card.classList.add('drag-over');
        });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            if (dragData && dragData !== card) {
                const grid = document.getElementById('terminalGrid');
                const cards = [...grid.querySelectorAll('.terminal-card')];
                const fi = cards.indexOf(dragData), ti = cards.indexOf(card);
                grid.insertBefore(dragData, fi < ti ? card.nextSibling : card);
                dragData = null;
            }
        });
    }
}

// ─── Close terminal ───────────────────────────────────────────────────────────
function closeTerminal(sessionId) {
    const t = terminals[sessionId];
    if (!t) return;
    // Remember this was explicitly closed so it won't reattach on page refresh
    const closed = JSON.parse(sessionStorage.getItem('ftermx_closed') || '[]');
    const sid = String(sessionId);
    if (!closed.includes(sid)) closed.push(sid);
    sessionStorage.setItem('ftermx_closed', JSON.stringify(closed));
    socket.emit('shell-close', { sessionId });
    t._ro?.disconnect();
    t.term.dispose();
    t.card?.remove();
    delete terminals[sessionId];
    removeSidebarSession(sessionId);
    updateSessionCount();
    if (!document.querySelector('#terminalGrid .terminal-card')) showEmptyState();
}

function killAll() {
    Object.keys(terminals).forEach(closeTerminal);
    socket.disconnect();
    setTimeout(() => socket.connect(), 300);
}

// ─── Sidebar sessions ─────────────────────────────────────────────────────────
function addSidebarSession(sessionId, type = 'local') {
    const list = document.getElementById('sessionList');
    const np = list.querySelector('.no-sessions');
    if (np) np.remove();
    const icon = type === 'ssh' ? 'fa-network-wired' : 'fa-terminal';
    const item = document.createElement('div');
    item.className = 'session-item';
    item.id = `sidebar-session-${sessionId}`;
    item.innerHTML = `
    <span class="session-dot"></span>
    <i class="fas ${icon}" style="font-size:10px;color:var(--text-dim);flex-shrink:0"></i>
    <span class="session-label">${type === 'ssh' ? 'SSH' : 'Shell'} #${sessionId}</span>
    <button class="session-kill" title="Kill session"><i class="fas fa-times"></i></button>
  `;
    item.querySelector('.session-kill').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTerminal(sessionId);
    });
    item.addEventListener('click', () => {
        const card = document.getElementById(`terminal-${sessionId}`);
        if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); terminals[sessionId]?.term.focus(); }
        if (isMobile()) closeSidebar();
    });
    list.prepend(item);
}

function removeSidebarSession(sessionId) {
    const el = document.getElementById(`sidebar-session-${sessionId}`);
    if (el) el.remove();
    const list = document.getElementById('sessionList');
    if (!list.querySelector('.session-item')) list.innerHTML = '<p class="no-sessions">No active sessions</p>';
}

function updateSidebarSession(sessionId, status) {
    const el = document.getElementById(`sidebar-session-${sessionId}`);
    const dot = el?.querySelector('.session-dot');
    if (!dot) return;
    if (status === 'connected') {
        dot.style.background = 'var(--neon-green)';
        dot.style.boxShadow = '0 0 5px var(--neon-green)';
    } else {
        dot.style.background = 'var(--text-dim)';
        dot.style.boxShadow = 'none';
    }
}

// ─── Terminal status ──────────────────────────────────────────────────────────
function updateTerminalStatus(sessionId, status) {
    const el = document.getElementById(`status-${sessionId}`);
    if (!el) return;
    const map = { connected: 'Connected', disconnected: 'Disconnected', connecting: 'Connecting…', error: 'Error' };
    el.className = `terminal-status ${status}`;
    el.innerHTML = `<span class="status-dot"></span> ${map[status] ?? status}`;
}

function updateSessionCount() {
    const n = Object.keys(terminals).length;
    document.getElementById('sessionCountNum').textContent = n;
    document.getElementById('sessionCount').style.display = n > 0 ? 'flex' : 'none';
    document.getElementById('killAllBtn').style.display = n > 0 ? 'flex' : 'none';
}

function setConnectionStatus(state) {
    const el = document.getElementById('connectionStatus');
    const dot = el.querySelector('.dot-live');
    const text = document.getElementById('connectionText');
    const map = {
        connected: { label: 'Connected', color: '#00ff88', glow: '0 0 7px #00ff88' },
        disconnected: { label: 'Disconnected', color: '#ff3d5a', glow: 'none' },
        error: { label: 'Error', color: '#ff3d5a', glow: 'none' }
    };
    const info = map[state] || map.disconnected;
    text.textContent = info.label;
    text.style.color = info.color;
    dot.style.background = info.color;
    dot.style.boxShadow = info.glow;
}

// ─── Page navigation ──────────────────────────────────────────────────────────
const pageMap = {
    terminal: { page: 'pagTerminal', title: 'Terminal',  newBtn: true,  adminOnly: false },
    files:    { page: 'pagFiles',    title: 'Files',     newBtn: false, adminOnly: false },
    connect:  { page: 'pagConnect',  title: 'Connect',   newBtn: false, adminOnly: false },
    admin:    { page: 'pagAdmin',    title: 'Admin',     newBtn: false, adminOnly: true  },
    packages: { page: 'pagPackages', title: 'Packages',  newBtn: false, adminOnly: false },
    about:    { page: 'pagAbout',    title: 'About',     newBtn: false, adminOnly: false },
    donate:   { page: 'pagDonate',   title: 'Donate',    newBtn: false, adminOnly: false }
};

function navigateTo(key) {
    const cfg = pageMap[key];
    if (!cfg) return;
    if (cfg.adminOnly && currentUser?.role !== 'admin') return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(cfg.page)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === key);
    });
    document.getElementById('headerTitle').textContent = cfg.title;
    document.getElementById('newTerminalBtn').style.display = cfg.newBtn ? 'flex' : 'none';
    if (key === 'admin') window.loadTunnelStats?.();
    if (key === 'files') window.fmRefresh?.();
    if (isMobile()) closeSidebar();
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarBackdrop').classList.add('visible');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('visible');
}
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (isMobile()) {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    } else {
        document.querySelector('.app-layout').classList.toggle('sidebar-collapsed');
    }
}

// ─── Tunnel helpers ───────────────────────────────────────────────────────────
function showTunnelStatus(url, type) {
    const card = document.getElementById('tunnelStatusCard');
    const urlEl = document.getElementById('tunnelStatusUrl');
    const typeEl = document.getElementById('tunnelStatusType');
    if (card && urlEl) {
        card.style.display = 'flex';
        urlEl.textContent = url;
        if (typeEl) typeEl.textContent = type ? `[${type}]` : '';
    }
}

function hideTunnelStatus() {
    const card = document.getElementById('tunnelStatusCard');
    if (card) card.style.display = 'none';
}

async function stopActiveTunnel() {
    try {
        const stats = await (await fetch('/api/tunnel/stats')).json();
        if (!stats.active) { hideTunnelStatus(); return; }
        const type = stats.type;
        const ep = type === 'ngrok' ? '/api/tunnel/ngrok/stop' : null;
        if (ep) await fetch(ep, { method: 'POST' });
        hideTunnelStatus();
    } catch (_) {}
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await loadCurrentUser();
    if (!currentUser) return;

    document.getElementById('userChipName').textContent = currentUser.username;
    document.getElementById('userChipRole').textContent = currentUser.role.toUpperCase();

    fetch('/api/version').then(r => r.json()).then(d => {
        const v = 'v' + d.version;
        const sidebarVer = document.getElementById('appVersion');
        const aboutVer   = document.getElementById('aboutVersion');
        if (sidebarVer) sidebarVer.textContent = v;
        if (aboutVer)   aboutVer.textContent   = 'Version ' + d.version;
    }).catch(() => {});

    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    });

    document.getElementById('newTerminalBtn').addEventListener('click', () => {
        navigateTo('terminal');
        spawnTerminal();
    });
    document.getElementById('sidebarNewTermBtn').addEventListener('click', () => {
        navigateTo('terminal');
        spawnTerminal();
    });

    document.getElementById('killAllBtn').addEventListener('click', killAll);
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarCloseBtn').addEventListener('click', closeSidebar);
    document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    window.addEventListener('resize', () => {
        Object.keys(terminals).forEach(sid => {
            const t = terminals[sid];
            if (t?.fitAddon) t.fitAddon.fit();
        });
    });

    // ── SSH dialog ──────────────────────────────────────────────────────────
    const sshOverlay = document.getElementById('sshModalOverlay');
    const openSsh = () => { sshOverlay.classList.remove('hidden'); document.getElementById('sshHost').focus(); };
    const closeSsh = () => { sshOverlay.classList.add('hidden'); document.getElementById('sshError').classList.add('hidden'); };

    document.getElementById('openSshDialog').addEventListener('click', openSsh);
    document.getElementById('closeSshModal').addEventListener('click', closeSsh);
    document.getElementById('cancelSshBtn').addEventListener('click', closeSsh);
    sshOverlay.addEventListener('click', (e) => { if (e.target === sshOverlay) closeSsh(); });

    document.getElementById('confirmSshBtn').addEventListener('click', () => {
        const host = document.getElementById('sshHost').value.trim();
        const port = document.getElementById('sshPort').value || '22';
        const user = document.getElementById('sshUser').value.trim();
        const pass = document.getElementById('sshPass').value;
        const errEl = document.getElementById('sshError');
        if (!host || !user) {
            errEl.textContent = 'Host and username are required';
            errEl.classList.remove('hidden');
            return;
        }
        closeSsh();
        spawnSSH({ host, port: Number(port), username: user, password: pass });
    });

    // ── Ngrok dialog ────────────────────────────────────────────────────────
    const ngrokOverlay = document.getElementById('ngrokModalOverlay');
    const openNgrok = () => { ngrokOverlay.classList.remove('hidden'); document.getElementById('ngrokToken').focus(); };
    const closeNgrok = () => {
        ngrokOverlay.classList.add('hidden');
        document.getElementById('ngrokError').classList.add('hidden');
        document.getElementById('ngrokSuccess').classList.add('hidden');
    };

    document.getElementById('openNgrokDialog')?.addEventListener('click', openNgrok);
    document.getElementById('closeNgrokModal').addEventListener('click', closeNgrok);
    document.getElementById('cancelNgrokBtn').addEventListener('click', closeNgrok);
    ngrokOverlay.addEventListener('click', (e) => { if (e.target === ngrokOverlay) closeNgrok(); });

    document.getElementById('confirmNgrokBtn').addEventListener('click', async () => {
        const token = document.getElementById('ngrokToken').value.trim();
        const errEl = document.getElementById('ngrokError');
        const sucEl = document.getElementById('ngrokSuccess');
        const btn = document.getElementById('confirmNgrokBtn');
        errEl.classList.add('hidden');
        sucEl.classList.add('hidden');
        if (!token) { errEl.textContent = 'Auth token is required'; errEl.classList.remove('hidden'); return; }
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting…';
        try {
            const res = await fetch('/api/tunnel/ngrok/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authtoken: token })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                document.getElementById('ngrokUrl').href = data.url;
                document.getElementById('ngrokUrl').textContent = data.url;
                sucEl.classList.remove('hidden');
                showTunnelStatus(data.url, 'ngrok');
            } else {
                errEl.textContent = data.error || 'Failed to start ngrok';
                errEl.classList.remove('hidden');
            }
        } catch {
            errEl.textContent = 'Network error';
            errEl.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-play"></i> Start Tunnel';
    });

    // ── Stop tunnel ─────────────────────────────────────────────────────────
    document.getElementById('stopTunnelBtn')?.addEventListener('click', stopActiveTunnel);

    // ── Copy tunnel URL ─────────────────────────────────────────────────────
    document.getElementById('copyTunnelUrl')?.addEventListener('click', () => {
        const url = document.getElementById('tunnelStatusUrl')?.textContent;
        if (url) navigator.clipboard.writeText(url).catch(() => {});
    });

    // Load tunnel status for connect page
    loadTunnelStatus();
});

async function loadTunnelStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.tunnelUrl) showTunnelStatus(data.tunnelUrl, data.tunnelType);
    } catch (_) {}
}

// Make available globally
window.spawnSSH = spawnSSH;
window.navigateTo = navigateTo;

// ─── Package Installer ────────────────────────────────────────────────────────
(function () {
    'use strict';

    // ── Simple ANSI-to-HTML converter ─────────────────────────────────────────
    const ANSI_COLORS = {
        30:'#3d5068', 31:'#ff3d5a', 32:'#00ff88', 33:'#ffd166',
        34:'#3b82f6', 35:'#a855f7', 36:'#06d6d6', 37:'#e2eaf5',
        90:'#3d5068', 91:'#ff6b7a', 92:'#39ffa0', 93:'#ffe066',
        94:'#47dfff', 95:'#c084fc', 96:'#22e9e9', 97:'#e2eaf5',
    };

    function ansiToHtml(raw) {
        // Escape HTML first
        let s = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        let depth = 0;
        s = s.replace(/\x1b\[([0-9;]*)m/g, (_, codes) => {
            let out = depth > 0 ? '</span>'.repeat(depth) : '';
            depth = 0;
            if (!codes || codes === '0') return out;
            let style = '';
            for (const n of codes.split(';').map(Number)) {
                if (n === 1) style += 'font-weight:700;';
                else if (n === 3) style += 'font-style:italic;';
                else if (ANSI_COLORS[n]) style += `color:${ANSI_COLORS[n]};`;
            }
            if (style) { out += `<span style="${style}">`; depth++; }
            return out;
        });
        if (depth > 0) s += '</span>'.repeat(depth);
        // Handle carriage-return overwrite (progress lines)
        s = s.replace(/[^\n]*\r(?!\n)/g, '');
        return s;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    let pkgRunning = false;

    // ── DOM helpers ───────────────────────────────────────────────────────────
    function pkgAppend(html) {
        const out = document.getElementById('pkgOutput');
        if (!out) return;
        // Remove placeholder on first real output
        const ph = out.querySelector('.pkg-placeholder');
        if (ph) ph.remove();
        const span = document.createElement('span');
        span.innerHTML = html;
        out.appendChild(span);
        out.scrollTop = out.scrollHeight;
    }

    function pkgSetStatus(state) {
        // state: '' | 'running' | 'done' | 'error' | 'cancelled'
        const badge  = document.getElementById('pkgStatusBadge');
        const cancel = document.getElementById('pkgCancelBtn');
        const btn    = document.getElementById('pkgInstallBtn');
        const title  = document.getElementById('pkgTermTitle');
        if (!badge) return;

        const map = {
            '':          { label: '',                    cls: '',                    icon: 'fa-square-terminal' },
            running:     { label: '⬤ Installing…',       cls: 'pkg-badge-running',   icon: 'fa-spinner fa-spin' },
            done:        { label: '✓ Done',               cls: 'pkg-badge-done',      icon: 'fa-square-terminal' },
            error:       { label: '✗ Error',              cls: 'pkg-badge-error',     icon: 'fa-square-terminal' },
            cancelled:   { label: '⊘ Cancelled',         cls: 'pkg-badge-cancelled', icon: 'fa-square-terminal' },
        };
        const m = map[state] || map[''];
        badge.textContent = m.label;
        badge.className = 'pkg-status-badge ' + m.cls;
        if (title) title.innerHTML = `<i class="fas ${m.icon}"></i> output`;
        if (cancel) cancel.classList.toggle('hidden', state !== 'running');
        if (btn) {
            btn.disabled = state === 'running';
            btn.querySelector('i').className = state === 'running'
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-download';
        }
        pkgRunning = state === 'running';
    }

    // ── Stdin bar helpers ─────────────────────────────────────────────────────
    function pkgShowStdin(defaultAnswer) {
        const row   = document.getElementById('pkgStdinRow');
        const input = document.getElementById('pkgStdinInput');
        const btnY  = document.getElementById('pkgStdinY');
        const btnN  = document.getElementById('pkgStdinN');
        if (!row) return;
        row.classList.remove('hidden');
        if (input) {
            input.value = defaultAnswer || '';
            input.focus();
            input.select();
        }
        // Highlight the default button
        if (btnY) btnY.classList.toggle('default', defaultAnswer === 'y' || defaultAnswer === 'Y');
        if (btnN) btnN.classList.toggle('default', defaultAnswer === 'n' || defaultAnswer === 'N');
        // Scroll terminal to bottom so the bar is visible
        const out = document.getElementById('pkgOutput');
        if (out) out.scrollTop = out.scrollHeight;
    }

    function pkgHideStdin() {
        const row = document.getElementById('pkgStdinRow');
        if (row) row.classList.add('hidden');
        const input = document.getElementById('pkgStdinInput');
        if (input) input.value = '';
        document.getElementById('pkgStdinY')?.classList.remove('default');
        document.getElementById('pkgStdinN')?.classList.remove('default');
    }

    function pkgSendStdin(text) {
        if (!pkgRunning) return;
        // Echo what the user typed into the output
        pkgAppend(ansiToHtml(`\x1b[36m${text || '(enter)'}\x1b[0m\n`));
        socket.emit('pkg-stdin', { text: text ?? '' });
        pkgHideStdin();
    }

    // ── Socket events ─────────────────────────────────────────────────────────
    socket.on('pkg-output', ({ text, done, code }) => {
        pkgAppend(ansiToHtml(text));
        if (done) {
            pkgSetStatus(code === 0 ? 'done' : code === -1 ? 'cancelled' : 'error');
            pkgHideStdin();
        }
    });

    socket.on('pkg-prompt', ({ line, defaultAnswer }) => {
        pkgShowStdin(defaultAnswer);
    });

    // ── Boot ──────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const input     = document.getElementById('pkgInput');
        const installBtn = document.getElementById('pkgInstallBtn');
        const cancelBtn = document.getElementById('pkgCancelBtn');
        const clearBtn  = document.getElementById('pkgClearBtn');
        const output    = document.getElementById('pkgOutput');

        if (!input) return; // page not present (non-admin build)

        // Install
        function doInstall() {
            const packages = input.value.trim();
            if (!packages || pkgRunning) return;
            pkgSetStatus('running');
            const title = document.getElementById('pkgTermTitle');
            if (title) title.innerHTML = `<i class="fas fa-spinner fa-spin"></i> installing <strong>${packages}</strong>`;
            // Clear previous output
            if (output) output.innerHTML = '';
            socket.emit('pkg-install', { packages });
        }

        installBtn?.addEventListener('click', doInstall);
        input?.addEventListener('keydown', e => { if (e.key === 'Enter') doInstall(); });

        // Cancel
        cancelBtn?.addEventListener('click', () => {
            if (!pkgRunning) return;
            socket.emit('pkg-cancel');
        });

        // Clear
        clearBtn?.addEventListener('click', () => {
            if (output) output.innerHTML = '<span class="pkg-placeholder">Ready — enter package name(s) above and click Install.</span>';
            pkgSetStatus('');
        });

        // Stdin bar wiring
        document.getElementById('pkgStdinInput')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                pkgSendStdin(document.getElementById('pkgStdinInput').value.trim());
            }
        });
        document.getElementById('pkgStdinY')?.addEventListener('click', () => pkgSendStdin('y'));
        document.getElementById('pkgStdinN')?.addEventListener('click', () => pkgSendStdin('n'));
        document.getElementById('pkgStdinEnter')?.addEventListener('click', () => pkgSendStdin(''));

        // Quick-chip clicks
        document.querySelectorAll('.pkg-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const cur = input.value.trim();
                const pkg = chip.dataset.pkg;
                // Toggle: add if not present, remove if already there
                const parts = cur ? cur.split(/\s+/) : [];
                const idx = parts.indexOf(pkg);
                if (idx === -1) parts.push(pkg); else parts.splice(idx, 1);
                input.value = parts.join(' ');
                input.focus();
                // Update chip active state
                chip.classList.toggle('active', parts.includes(pkg));
            });
        });

        // Sync chip active state when input changes manually
        input?.addEventListener('input', () => {
            const parts = input.value.trim().split(/\s+/);
            document.querySelectorAll('.pkg-chip').forEach(chip => {
                chip.classList.toggle('active', parts.includes(chip.dataset.pkg));
            });
        });
    });
})();
