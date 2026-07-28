// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║   ███████╗ █████╗ ██████╗ ███████╗██╗     ██████╗ ███████╗██╗   ██╗    ║
// ║   ██╔════╝██╔══██╗██╔══██╗██╔════╝██║     ██╔══██╗██╔════╝██║   ██║    ║
// ║   █████╗  ███████║██████╔╝█████╗  ██║     ██║  ██║█████╗  ██║   ██║    ║
// ║   ██╔══╝  ██╔══██║██╔══██╗██╔══╝  ██║     ██║  ██║██╔══╝  ╚██╗ ██╔╝    ║
// ║   ██║     ██║  ██║██║  ██║███████╗███████╗██████╔╝███████╗  ╚████╔╝     ║
// ║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ╚══════╝   ╚═══╝      ║
// ║                                                                          ║
// ║                      ✦  Source By FarelDev  ✦                           ║
// ║                  ──────────────────────────────────                      ║
// ║               Copyright © 2026 FarelDev. All Rights Reserved.           ║
// ║              Licensed under the Apache License, Version 2.0             ║
// ║                   See LICENSE file for full details.                     ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

'use strict';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const pty = require('./pty-backend');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const multer = require('multer');
const AdmZip = require('adm-zip');
const {
    hashPassword, findUser, loadUsers, saveUsers,
    addUser, deleteUser, updateUser, purgeExpiredUsers,
    requireAuth, requireAdmin
} = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling']
});

console.clear();
console.log(gradient.pastel.multiline(figlet.textSync('Ftermx', {
    font: 'Standard', horizontalLayout: 'default', width: 80, whitespaceBreak: true
})));
console.log(chalk.cyan('\n    ═══════════════════════════════════════'));
console.log(chalk.white('    Author  : ') + chalk.green('Farel Alfareza'));
console.log(chalk.white('    Portfolio: ') + chalk.blue('farelsite.pages.dev'));
console.log(chalk.cyan('    ═══════════════════════════════════════\n'));

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'ftermx-dev-secret-changeme',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
});
app.use(sessionMiddleware);

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.static(path.join(__dirname, 'public')));

const USER_HOMES = path.join(__dirname, '..', 'data', 'users');
fs.mkdirSync(USER_HOMES, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = sanitizeAndResolve(req.session?.user, req.query.path || '/');
            if (!uploadDir) return cb(new Error('Invalid upload path'));
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => cb(null, file.originalname)
    }),
    limits: { fileSize: 500 * 1024 * 1024 } 
});

function getUserRoot(user) {
    if (!user) return null;
    if (user.role === 'admin') return '/';
    return path.join(USER_HOMES, user.username);
}

function sanitizeAndResolve(user, reqPath) {
    if (!user) return null;
    const root = path.resolve(getUserRoot(user));

    if (!reqPath || reqPath === '/') return root;

    const resolved = path.resolve(
        path.isAbsolute(reqPath) ? reqPath : path.join(root, reqPath)
    );

    if (user.role !== 'admin') {
        const rel = path.relative(root, resolved);
        if (rel.startsWith('..') || path.isAbsolute(rel)) return root;
    }
    return resolved;

}

function isWithinRoot(root, p) {
    const resolvedRoot = path.resolve(root);
    const resolvedP = path.resolve(p);
    const rel = path.relative(resolvedRoot, resolvedP);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
}

app.get('/login', (req, res) => {
    if (req.session?.user) {
        return res.redirect(req.session.user.role === 'admin'
            ? '/ftermx'
            : `/ftermx/${req.session.user.username}`);
    }
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUser(username);
    if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.user = { username: user.username, role: user.role };
    res.json({
        username: user.username,
        role: user.role,
        redirect: user.role === 'admin' ? '/ftermx' : `/ftermx/${user.username}`
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(req.session.user);
});

app.get('/api/version', (req, res) => {
    const { version } = require('../package.json');
    res.json({ version });
});

app.use(requireAuth);

app.get('/ftermx', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/ftermx/:username', (req, res) => {
    const sessionUser = req.session.user;
    const paramUser = req.params.username;
    
    if (sessionUser.role !== 'admin' && sessionUser.username !== paramUser) {
        return res.redirect(`/ftermx/${sessionUser.username}`);
    }
    
    if (!findUser(paramUser)) return res.status(404).send('User not found');
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/', (req, res) => {
    const u = req.session.user;
    res.redirect(u.role === 'admin' ? '/ftermx' : `/ftermx/${u.username}`);
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        sessions: sessions.size,
        uptime: process.uptime(),
        author: 'Farel Alfareza',
        tunnelUrl: currentTunnelUrl || null,
        tunnelType: currentTunnelType || null
    });
});

app.get('/api/users', requireAdmin, (req, res) => {
    const users = loadUsers().map(u => ({
        username: u.username,
        role: u.role,
        expireAt: u.expireAt || null
    }));
    res.json(users);
});

app.post('/api/users', requireAdmin, (req, res) => {
    const { username, password, role, expireAt } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'role must be admin or user' });
    try {
        addUser(username, password, role);
        if (expireAt) updateUser(username, { expireAt });
        const homeDir = path.join(USER_HOMES, username);
        fs.mkdirSync(homeDir, { recursive: true });
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/users/:username', requireAdmin, (req, res) => {
    const { username: newUsername, password, expireAt } = req.body;
    const updates = {};
    if (newUsername) updates.username = newUsername;
    if (password)    updates.password = password;
    if ('expireAt' in req.body) updates.expireAt = expireAt || null;
    try {
        const updated = updateUser(req.params.username, updates);
        
        if (newUsername && newUsername !== req.params.username) {
            const oldDir = path.join(USER_HOMES, req.params.username);
            const newDir = path.join(USER_HOMES, newUsername);
            if (fs.existsSync(oldDir)) {
                try { fs.renameSync(oldDir, newDir); } catch (_) {}
            }
        }
        res.json({ ok: true, username: updated.username });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/users/:username', requireAdmin, (req, res) => {
    if (req.params.username === req.session.user.username) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    try {
        deleteUser(req.params.username);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

setInterval(purgeExpiredUsers, 60 * 1000);
purgeExpiredUsers();

let currentTunnelUrl = null;
let currentTunnelType = null;
let tunnelStartedAt = null;
let ngrokListener = null; 

function stopCurrentTunnel() {
    try { if (ngrokListener) { ngrokListener.close(); ngrokListener = null; } } catch (_) {}
    currentTunnelUrl = null;
    currentTunnelType = null;
    tunnelStartedAt = null;
}

app.post('/api/tunnel/ngrok/start', requireAdmin, async (req, res) => {
    const { authtoken } = req.body;
    if (!authtoken) return res.status(400).json({ error: 'authtoken required' });
    stopCurrentTunnel();
    try {
        const ngrok = require('@ngrok/ngrok');
        ngrokListener = await ngrok.forward({ addr: PORT, authtoken });
        currentTunnelUrl = ngrokListener.url() + '/ftermx';
        currentTunnelType = 'ngrok';
        tunnelStartedAt = Date.now();
        console.log(chalk.hex('#00ff88')('  Ngrok URL: ') + chalk.bold.hex('#00d4ff')(currentTunnelUrl));
        res.json({ url: currentTunnelUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tunnel/ngrok/stop', requireAdmin, async (req, res) => {
    try {
        if (ngrokListener) { await ngrokListener.close(); ngrokListener = null; }
        const ngrok = require('@ngrok/ngrok');
        await ngrok.disconnect();
    } catch (_) {}
    if (currentTunnelType === 'ngrok') {
        currentTunnelUrl = null; currentTunnelType = null; tunnelStartedAt = null;
    }
    res.json({ ok: true });
});

app.get('/api/tunnel/stats', requireAdmin, (req, res) => {
    res.json({
        url: currentTunnelUrl,
        type: currentTunnelType,
        uptime: tunnelStartedAt ? Math.floor((Date.now() - tunnelStartedAt) / 1000) : 0,
        active: !!currentTunnelUrl,
        sessions: sessions.size
    });
});

function fmCheckAccess(req, res) {
    const user = req.session?.user;
    if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
    return user;
}

app.get('/api/fm/list', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const p = sanitizeAndResolve(user, req.query.path || '/');
    if (!p) return res.status(400).json({ error: 'Invalid path' });
    try {
        const entries = fs.readdirSync(p, { withFileTypes: true }).map(e => {
            const fullPath = path.join(p, e.name);
            let size = 0, mtime = 0;
            try { const st = fs.statSync(fullPath); size = st.size; mtime = st.mtimeMs; } catch (_) {}
            return {
                name: e.name,
                type: e.isDirectory() ? 'dir' : 'file',
                size,
                mtime,
                ext: e.isFile() ? path.extname(e.name).toLowerCase() : ''
            };
        }).sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        const root = getUserRoot(user);
        res.json({ path: p, root, entries });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/fm/mkdir', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const p = sanitizeAndResolve(user, req.body.path);
    if (!p) return res.status(400).json({ error: 'Invalid path' });
    try {
        fs.mkdirSync(p, { recursive: true });
        res.json({ ok: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/fm/touch', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const p = sanitizeAndResolve(user, req.body.path);
    if (!p) return res.status(400).json({ error: 'Invalid path' });
    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        if (!fs.existsSync(p)) fs.writeFileSync(p, req.body.content || '');
        res.json({ ok: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/fm/delete', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const paths = req.body.paths;
    if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ error: 'paths array required' });
    }
    const errors = [];
    for (const rp of paths) {
        const p = sanitizeAndResolve(user, rp);
        if (!p) { errors.push(`invalid: ${rp}`); continue; }
        
        if (p === getUserRoot(user)) { errors.push('Cannot delete root'); continue; }
        try {
            fs.rmSync(p, { recursive: true, force: true });
        } catch (err) { errors.push(err.message); }
    }
    if (errors.length) return res.status(207).json({ ok: false, errors });
    res.json({ ok: true });
});

app.post('/api/fm/rename', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const from = sanitizeAndResolve(user, req.body.from);
    const to = sanitizeAndResolve(user, req.body.to);
    if (!from || !to) return res.status(400).json({ error: 'Invalid path' });
    try {
        fs.renameSync(from, to);
        res.json({ ok: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/fm/upload', (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const destPath = sanitizeAndResolve(user, req.query.path || '/');
    if (!destPath) return res.status(400).json({ error: 'Invalid upload path' });
    upload.array('files')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ ok: true, count: req.files?.length || 0, dest: destPath });
    });
});

app.get('/api/fm/download', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const p = sanitizeAndResolve(user, req.query.path);
    if (!p || !fs.existsSync(p)) return res.status(404).json({ error: 'File not found' });
    const stat = fs.statSync(p);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Cannot download directory directly' });
    res.download(p);
});

app.post('/api/fm/unzip', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const src = sanitizeAndResolve(user, req.body.path);
    const dest = sanitizeAndResolve(user, req.body.dest || path.dirname(req.body.path));
    if (!src || !dest) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(src)) return res.status(404).json({ error: 'File not found' });
    try {
        const ext = path.extname(src).toLowerCase();
        if (ext === '.zip') {
            const zip = new AdmZip(src);
            zip.extractAllTo(dest, true);
        } else if (['.tar', '.gz', '.tgz', '.bz2', '.xz'].includes(ext) ||
                    src.endsWith('.tar.gz') || src.endsWith('.tar.bz2')) {
            
            const { execFileSync } = require('child_process');
            fs.mkdirSync(dest, { recursive: true });
            
            execFileSync('tar', ['-xf', src, '-C', dest], { timeout: 60000 });
        } else {
            return res.status(400).json({ error: 'Unsupported archive format (use .zip or .tar*)' });
        }
        res.json({ ok: true, dest });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/fm/zip', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const paths = req.body.paths;
    const destRel = req.body.dest;
    if (!Array.isArray(paths) || !destRel) return res.status(400).json({ error: 'paths and dest required' });
    const dest = sanitizeAndResolve(user, destRel);
    if (!dest) return res.status(400).json({ error: 'Invalid destination' });
    try {
        const zip = new AdmZip();
        for (const rp of paths) {
            const p = sanitizeAndResolve(user, rp);
            if (!p || !fs.existsSync(p)) continue;
            const st = fs.statSync(p);
            if (st.isDirectory()) zip.addLocalFolder(p, path.basename(p));
            else zip.addLocalFile(p);
        }
        zip.writeZip(dest);
        res.json({ ok: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/fm/read', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const p = sanitizeAndResolve(user, req.query.path);
    if (!p || !fs.existsSync(p)) return res.status(404).json({ error: 'File not found' });
    const stat = fs.statSync(p);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Is a directory' });
    if (stat.size > 5 * 1024 * 1024) return res.status(413).json({ error: 'File too large to preview (max 5 MB)' });
    try {
        const content = fs.readFileSync(p, 'utf8');
        res.json({ ok: true, content });
    } catch { res.json({ ok: true, content: '[binary file — not previewable]' }); }
});

app.put('/api/fm/write', (req, res) => {
    const user = fmCheckAccess(req, res);
    if (!user) return;
    const p = sanitizeAndResolve(user, req.body.path);
    if (!p) return res.status(400).json({ error: 'Invalid path' });
    
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        return res.status(400).json({ error: 'Cannot write to a directory' });
    }
    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, req.body.content ?? '', 'utf8');
        res.json({ ok: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.use((err, req, res, next) => {
    console.error(chalk.red(err.stack));
    res.status(500).json({ error: 'Something went wrong!' });
});

const sessions = new Map();
let sessionCounter = 0;
const SCROLLBACK_LIMIT = 102400;

function routePtyData(sessionId, data) {
    const sess = sessions.get(sessionId);
    if (!sess) return;
    sess.scrollback += data;
    if (sess.scrollback.length > SCROLLBACK_LIMIT)
        sess.scrollback = sess.scrollback.slice(sess.scrollback.length - SCROLLBACK_LIMIT);
    if (sess.socketId) {
        const sock = io.sockets.sockets.get(sess.socketId);
        if (sock && !sock.disconnected) sock.emit('shell-data', { sessionId, data });
    }
}

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

io.on('connection', (socket) => {
    const user = socket.request.session?.user;
    if (!user) {
        socket.emit('auth-required');
        socket.disconnect(true);
        return;
    }

    console.log(chalk.green('✓ Client connected: ') + chalk.gray(socket.id) +
        chalk.dim(` [${user.username}/${user.role}]`));

    socket.on('list-sessions', () => {
        const list = [];
        for (const [sid, sess] of sessions) {
            
            if (user.role === 'admin' || sess.owner === user.username) {
                list.push({ sessionId: sid, type: sess.type || 'local' });
            }
        }
        socket.emit('session-list', list);
    });

    socket.on('reattach-shell', ({ sessionId }) => {
        const sess = sessions.get(sessionId);
        if (!sess) {
            socket.emit('shell-error', { sessionId, error: 'Session no longer exists' });
            return;
        }
        
        if (user.role !== 'admin' && sess.owner !== user.username) {
            socket.emit('shell-error', { sessionId, error: 'Access denied' });
            return;
        }
        sess.socketId = socket.id;
        socket.emit('shell-created', { sessionId, type: sess.type || 'local' });
        if (sess.scrollback) socket.emit('shell-data', { sessionId, data: sess.scrollback });
    });

    
    socket.on('spawn-shell', (opts = {}) => {
        const sessionId = ++sessionCounter;
        const cols = opts.cols || 80;
        const rows = opts.rows || 24;
        const shell = process.env.SHELL || '/bin/bash';

        
        let cwd, shellEnv;
        if (user.role === 'admin') {
            cwd = process.env.HOME || process.cwd();
            shellEnv = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };
        } else {
            cwd = path.join(USER_HOMES, user.username);
            fs.mkdirSync(cwd, { recursive: true });
            shellEnv = {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor',
                USER: user.username,
                LOGNAME: user.username,
                HOME: cwd,
                PS1: `\\u@ftermx:\\w\\$ `
            };
        }

        console.log(chalk.blue(`  Spawning shell [session ${sessionId}] for ${user.username}: ${shell}`));
        let ptyProcess;
        try {
            ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-256color', cols, rows, cwd, env: shellEnv
            });
        } catch (err) {
            console.error(chalk.red(`  ✗ Failed to spawn shell: ${err.message}`));
            socket.emit('shell-error', { sessionId, error: err.message });
            return;
        }

        const sess = { ptyProcess, socketId: socket.id, scrollback: '', type: 'local', owner: user.username };
        sessions.set(sessionId, sess);
        socket.emit('shell-created', { sessionId, type: 'local' });

        ptyProcess.onData((data) => routePtyData(sessionId, data));
        ptyProcess.onExit(({ exitCode }) => {
            const s = sessions.get(sessionId);
            if (s?.socketId) {
                const sock = io.sockets.sockets.get(s.socketId);
                if (sock && !sock.disconnected) sock.emit('shell-exit', { sessionId, exitCode });
            }
            sessions.delete(sessionId);
        });
    });

    
    socket.on('spawn-ssh', (opts = {}) => {
        const sessionId = ++sessionCounter;
        const { host, port = 22, username, password, cols = 80, rows = 24 } = opts;
        if (!host || !username) {
            socket.emit('shell-error', { sessionId, error: 'host and username required' });
            return;
        }
        const conn = new SSHClient();
        const dataCbs = [], exitCbs = [];
        let sshStream = null;

        const sshPty = {
            onData: (cb) => dataCbs.push(cb),
            onExit: (cb) => exitCbs.push(cb),
            write: (data) => { if (sshStream) sshStream.write(data); },
            resize: (c, r) => { if (sshStream) sshStream.setWindow(r, c, 0, 0); },
            kill: () => { try { conn.end(); } catch (_) {} }
        };

        const sess = { ptyProcess: sshPty, socketId: socket.id, scrollback: '', type: 'ssh', owner: user.username };
        sessions.set(sessionId, sess);

        conn.on('ready', () => {
            conn.shell({ term: 'xterm-256color', rows, cols }, (err, stream) => {
                if (err) {
                    socket.emit('shell-error', { sessionId, error: err.message });
                    sessions.delete(sessionId);
                    return;
                }
                sshStream = stream;
                socket.emit('shell-created', { sessionId, type: 'ssh' });
                stream.on('data', (data) => {
                    const s = data.toString('utf8');
                    dataCbs.forEach(cb => cb(s));
                    routePtyData(sessionId, s);
                });
                stream.stderr.on('data', (data) => {
                    const s = data.toString('utf8');
                    dataCbs.forEach(cb => cb(s));
                    routePtyData(sessionId, s);
                });
                stream.on('close', () => {
                    exitCbs.forEach(cb => cb({ exitCode: 0 }));
                    const s = sessions.get(sessionId);
                    if (s?.socketId) {
                        const sock = io.sockets.sockets.get(s.socketId);
                        if (sock && !sock.disconnected) sock.emit('shell-exit', { sessionId, exitCode: 0 });
                    }
                    sessions.delete(sessionId);
                    conn.end();
                });
            });
        });

        conn.on('error', (err) => {
            socket.emit('shell-error', { sessionId, error: 'SSH: ' + err.message });
            sessions.delete(sessionId);
        });

        conn.connect({ host, port: Number(port), username, password, readyTimeout: 10000 });
    });

    socket.on('shell-input', ({ sessionId, data }) => {
        const sess = sessions.get(sessionId);
        if (!sess) return;
        if (user.role !== 'admin' && sess.owner !== user.username) return; 
        sess.ptyProcess.write(data);
    });

    socket.on('shell-resize', ({ sessionId, cols, rows }) => {
        const sess = sessions.get(sessionId);
        if (!sess) return;
        if (user.role !== 'admin' && sess.owner !== user.username) return; 
        sess.ptyProcess.resize(cols, rows);
    });

    socket.on('shell-close', ({ sessionId }) => {
        const sess = sessions.get(sessionId);
        if (!sess) return;
        if (user.role !== 'admin' && sess.owner !== user.username) return; 
        sess.ptyProcess.kill();
        sessions.delete(sessionId);
    });

    
    let pkgProc = null; 

    socket.on('pkg-install', ({ packages }) => {
        const input = (packages || '').trim();
        if (!input) {
            socket.emit('pkg-output', { text: '\x1b[33mNo packages specified.\x1b[0m\n', done: true, code: 1 });
            return;
        }
        if (pkgProc) {
            socket.emit('pkg-output', { text: '\x1b[33mAn installation is already running. Cancel it first.\x1b[0m\n', done: true, code: 1 });
            return;
        }

        const pkgList = input.split(/\s+/).filter(Boolean);
        const { spawn } = require('child_process');

        socket.emit('pkg-output', {
            text: `\x1b[36m$ apt-get install ${pkgList.join(' ')}\x1b[0m\n\n`,
            done: false
        });

        try {
            pkgProc = spawn('apt-get', ['install', ...pkgList], {
                env: { ...process.env, DEBIAN_FRONTEND: 'readline' },
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } catch (err) {
            socket.emit('pkg-output', { text: `\x1b[31mFailed to start process: ${err.message}\x1b[0m\n`, done: true, code: 1 });
            pkgProc = null;
            return;
        }

        
        const PROMPT_RE = /(\[([Yy])\/([Nn])\]|\[([Nn])\/([Yy])\]|\(([Yy])\/([Nn])\)|\(([Nn])\/([Yy])\)|yes\/no|Do you want to continue|Proceed\?|press enter to continue)/i;
        function detectPrompt(text) {
            const match = text.match(PROMPT_RE);
            if (!match) return;
            
            const lower = match[0].toLowerCase();
            let defaultAnswer = '';
            if (lower.includes('[y/n]') || lower.includes('(y/n)') || lower.includes('yes/no')) defaultAnswer = 'y';
            else if (lower.includes('[n/y]') || lower.includes('(n/y)')) defaultAnswer = 'n';
            else if (/press enter|proceed/i.test(match[0])) defaultAnswer = '';
            socket.emit('pkg-prompt', { line: text.trim(), defaultAnswer });
        }

        pkgProc.stdout.on('data', d => {
            const text = d.toString();
            socket.emit('pkg-output', { text, done: false });
            detectPrompt(text);
        });
        pkgProc.stderr.on('data', d => {
            const text = d.toString();
            socket.emit('pkg-output', { text, done: false });
            detectPrompt(text);
        });

        pkgProc.on('close', code => {
            const col = code === 0 ? '\x1b[32m' : '\x1b[31m';
            const msg = code === 0 ? '✓ Installation complete' : `✗ Process exited with code ${code}`;
            socket.emit('pkg-output', { text: `\n${col}─── ${msg} ───\x1b[0m\n`, done: true, code });
            pkgProc = null;
        });

        pkgProc.on('error', err => {
            socket.emit('pkg-output', { text: `\x1b[31mError: ${err.message}\x1b[0m\n`, done: true, code: 1 });
            pkgProc = null;
        });
    });

    socket.on('pkg-stdin', ({ text }) => {
        if (!pkgProc) return;
        try { pkgProc.stdin.write((text ?? '') + '\n'); } catch (_) {}
    });

    socket.on('pkg-cancel', () => {
        if (pkgProc) {
            try { pkgProc.kill('SIGTERM'); } catch (_) {}
            pkgProc = null;
            socket.emit('pkg-output', { text: '\x1b[33m\n── Installation cancelled ──\x1b[0m\n', done: true, code: -1 });
        }
    });

    socket.on('disconnect', () => {
        for (const [sid, sess] of sessions) {
            if (sess.socketId === socket.id) sess.socketId = null;
        }
        if (pkgProc) { try { pkgProc.kill(); } catch (_) {} pkgProc = null; }
    });
});

function sep(ch = '─') {
    const w = Math.min(process.stdout.columns || 50, 60);
    return chalk.hex('#3d5068')(ch.repeat(w));
}

const PORT = process.env.PORT || 5000;

fs.mkdirSync(USER_HOMES, { recursive: true });

async function startServer() {
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + sep());
        console.log(chalk.hex('#00d4ff')('  Ftermx') + chalk.hex('#7a8fa6')(' · server running on port ' + PORT));
        console.log(sep('·'));
        console.log(chalk.hex('#3d5068')('  Press Ctrl+C to stop\n'));
    });
}

process.on('SIGINT', async () => {
    for (const [, sess] of sessions) {
        try { sess.ptyProcess.kill(); } catch (_) {}
    }
    sessions.clear();
    stopCurrentTunnel();
    server.close(() => process.exit(0));
});

startServer().catch(err => {
    console.error(chalk.red('Fatal:'), err);
    process.exit(1);
});
