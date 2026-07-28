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

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function hashPassword(password) {
    return crypto.createHmac('sha256', 'ftermx-secret-salt')
        .update(password)
        .digest('hex');
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

function loadUsers() {
    try {
        ensureDataDir();
        if (!fs.existsSync(USERS_FILE)) {
            const defaults = [{
                username: 'admin',
                password: hashPassword('admin'),
                role: 'admin'
            }];
            fs.writeFileSync(USERS_FILE, JSON.stringify(defaults, null, 2));
            return defaults;
        }
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [{
            username: 'admin',
            password: hashPassword('admin'),
            role: 'admin'
        }];
    }
}

function saveUsers(users) {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function findUser(username) {
    return loadUsers().find(u => u.username === username) || null;
}

function addUser(username, password, role = 'user') {
    const users = loadUsers();
    if (users.find(u => u.username === username)) {
        throw new Error(`User "${username}" already exists`);
    }
    users.push({
        username,
        password: hashPassword(password),
        role
    });
    saveUsers(users);
}

function deleteUser(username) {
    let users = loadUsers();
    const before = users.length;
    users = users.filter(u => u.username !== username);
    if (users.length === before) throw new Error(`User "${username}" not found`);
    
    if (!users.find(u => u.role === 'admin')) {
        throw new Error('Cannot delete last admin');
    }
    saveUsers(users);
}

function updateUser(username, updates = {}) {
    const users = loadUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) throw new Error(`User "${username}" not found`);

    const user = users[idx];

    
    if (updates.username && updates.username !== username) {
        if (users.find(u => u.username === updates.username)) {
            throw new Error(`Username "${updates.username}" already taken`);
        }
        user.username = updates.username;
    }

    
    if (updates.password) {
        user.password = hashPassword(updates.password);
    }

    
    if ('expireAt' in updates) {
        user.expireAt = updates.expireAt || null;
    }

    users[idx] = user;
    saveUsers(users);
    return user;
}

function purgeExpiredUsers() {
    const users = loadUsers();
    const now = Date.now();
    const active = users.filter(u => {
        if (!u.expireAt) return true;
        return new Date(u.expireAt).getTime() > now;
    });
    if (active.length !== users.length) {
        
        if (!active.find(u => u.role === 'admin')) return;
        saveUsers(active);
    }
}

function requireAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    
    if (req.path.startsWith('/api/') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(401).json({
            error: 'Not authenticated'
        });
    }
    res.redirect('/login');
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') return next();
    if (req.path.startsWith('/api/') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(403).json({
            error: 'Admin access required'
        });
    }
    res.status(403).send('Forbidden');
}

loadUsers();

module.exports = {
    hashPassword,
    loadUsers,
    saveUsers,
    findUser,
    addUser,
    deleteUser,
    updateUser,
    purgeExpiredUsers,
    requireAuth,
    requireAdmin
};
