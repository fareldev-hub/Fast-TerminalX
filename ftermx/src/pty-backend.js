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

const {
    spawn: cpSpawn
} = require('child_process');

let nativePty = null;
const candidates = ['node-pty-prebuilt-multiarch', 'node-pty'];
for (const pkg of candidates) {
    try {
        nativePty = require(pkg);
        break;
    } catch (_) {
        
    }
}

const hasPty = !!nativePty;

function spawnNative(shell, args, opts) {
    const p = nativePty.spawn(shell, args, {
        name: opts.name || 'xterm-256color',
        cols: opts.cols || 80,
        rows: opts.rows || 24,
        cwd: opts.cwd || process.cwd(),
        env: opts.env || process.env
    });

    return {
        onData: (cb) => p.onData(cb),
        onExit: (cb) => p.onExit(cb),
        write: (data) => p.write(data),
        resize: (cols, rows) => p.resize(cols, rows),
        kill: () => p.kill()
    };
}

function spawnFallback(shell, args, opts) {
    const env = {
        ...(opts.env || process.env),
        
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        FORCE_COLOR: '1',
        CLICOLOR_FORCE: '1'
    };

    const proc = cpSpawn(shell, args, {
        cwd: opts.cwd || process.cwd(),
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        
        detached: false
    });

    const dataCbs = [];
    const exitCbs = [];

    proc.stdout.on('data', (d) => {
        const s = d.toString('utf8');
        dataCbs.forEach(cb => cb(s));
    });

    proc.stderr.on('data', (d) => {
        const s = d.toString('utf8');
        dataCbs.forEach(cb => cb(s));
    });

    proc.on('exit', (code, signal) => {
        exitCbs.forEach(cb => cb({
            exitCode: code ?? 0,
            signal
        }));
    });

    proc.on('error', (err) => {
        dataCbs.forEach(cb => cb(`\r\n[shell error: ${err.message}]\r\n`));
    });

    
    process.nextTick(() => {
        const msg =
            '\r\n\x1b[33m[ftermx] node-pty not available — running in pipe mode.\r\n' +
            'Basic commands work. Full-screen apps (vim/htop/nano) are not supported.\x1b[0m\r\n\r\n';
        dataCbs.forEach(cb => cb(msg));
    });

    return {
        onData: (cb) => {
            dataCbs.push(cb);
        },
        onExit: (cb) => {
            exitCbs.push(cb);
        },
        write: (data) => {
            if (!proc.killed) proc.stdin.write(data);
        },
        resize: () => {
             },
        kill: () => {
            try {
                proc.kill();
            } catch (_) {}
        }
    };
}

module.exports = {
    
    hasPty,

    
    backendName: hasPty ?
        ((() => {
            try {
                require('node-pty-prebuilt-multiarch');
                return 'node-pty-prebuilt-multiarch';
            } catch (_) {
                return 'node-pty';
            }
        })()) :
        'child_process (pipe fallback)',

    

    spawn: hasPty ? spawnNative : spawnFallback
};
