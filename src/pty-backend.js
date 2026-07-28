/**
 * pty-backend.js
 *
 * Thin abstraction over PTY spawning.
 *
 * Priority:
 *   1. node-pty-prebuilt-multiarch  — real PTY (full terminal support)
 *   2. node-pty                     — real PTY (fallback name)
 *   3. child_process.spawn          — pipe-based fallback (Termux / no native build)
 *
 * All three expose the same interface so callers never need to branch:
 *   const proc = pty.spawn(shell, args, opts)
 *   proc.onData(cb)        — receive output
 *   proc.onExit(cb)        — { exitCode }
 *   proc.write(data)       — send input
 *   proc.resize(cols,rows) — resize (no-op on fallback)
 *   proc.kill()            — terminate
 */

'use strict';

const {
    spawn: cpSpawn
} = require('child_process');

// ── Try to load a native PTY library ─────────────────────────────────────────
let nativePty = null;
const candidates = ['node-pty-prebuilt-multiarch', 'node-pty'];
for (const pkg of candidates) {
    try {
        nativePty = require(pkg);
        break;
    } catch (_) {
        // try next
    }
}

const hasPty = !!nativePty;

// ── Native PTY wrapper ────────────────────────────────────────────────────────
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

// ── child_process fallback (pipe-based, no real PTY) ─────────────────────────
// Works on Termux and any environment without native build tools.
// Limitations vs real PTY:
//   - No raw/cbreak mode → readline-based prompts work, full-screen apps (vim,
//     htop, nano) won't render correctly.
//   - No terminal size signalling (SIGWINCH).
//   - ANSI colour still works if the shell emits it unconditionally.
function spawnFallback(shell, args, opts) {
    const env = {
        ...(opts.env || process.env),
        // Hint the shell to emit colour even without a real TTY
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        FORCE_COLOR: '1',
        CLICOLOR_FORCE: '1'
    };

    const proc = cpSpawn(shell, args, {
        cwd: opts.cwd || process.cwd(),
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        // Keep the shell alive even when stdin closes
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

    // Emit a notice so the user knows they are in fallback mode
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
            /* no-op — child_process has no TTY to resize */ },
        kill: () => {
            try {
                proc.kill();
            } catch (_) {}
        }
    };
}

// ── Public API ────────────────────────────────────────────────────────────────
module.exports = {
    /** true = real PTY, false = pipe fallback */
    hasPty,

    /** Name of the backend actually loaded */
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

    /**
     * spawn(shell, args, opts) → ptyLike
     *
     * opts: { name, cols, rows, cwd, env }
     */
    spawn: hasPty ? spawnNative : spawnFallback
};