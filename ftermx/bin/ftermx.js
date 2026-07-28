#!/usr/bin/env node

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

const { spawn, execSync } = require('child_process');
const path      = require('path');
const os        = require('os');
const fs        = require('fs');
const chalk     = require('chalk');
const figlet    = require('figlet');
const gradient  = require('gradient-string');
const inquirer  = require('inquirer');

const C = {
  cyan:   s => chalk.hex('#00d4ff')(s),
  green:  s => chalk.hex('#00ff88')(s),
  purple: s => chalk.hex('#a855f7')(s),
  dim:    s => chalk.hex('#3d5068')(s),
  mid:    s => chalk.hex('#7a8fa6')(s),
  bright: s => chalk.hex('#e2eaf5')(s),
  red:    s => chalk.hex('#ff3d5a')(s),
  orange: s => chalk.hex('#ff8c42')(s),
  yellow: s => chalk.hex('#ffd700')(s),
  bold:   s => chalk.bold(s),
  b:      s => chalk.bold(s),
};

function W()     { return Math.max(40, Math.min((process.stdout.columns || 76) - 4, 76)); }
function strip(s){ return s.replace(/\x1B\[[0-9;]*m/g, ''); }
function line(content = '') {
  const w = W(), vis = strip(content).length, pad = Math.max(0, w - vis);
  process.stdout.write(C.dim('│') + ' ' + content + ' '.repeat(pad) + ' ' + C.dim('│') + '\n');
}
function blank()   { line(); }
function sep(ch = '─') { process.stdout.write(C.dim('├' + ch.repeat(W() + 2) + '┤') + '\n'); }
function top()     { process.stdout.write(C.dim('╭' + '─'.repeat(W() + 2) + '╮') + '\n'); }
function bottom()  { process.stdout.write(C.dim('╰' + '─'.repeat(W() + 2) + '╯') + '\n'); }

function kv(label, value, lc = C.mid, vc = C.bright) {
  line(lc('  ' + label.padEnd(16)) + C.dim('→') + '  ' + vc(value));
}
function center(text) {
  const w = W(), vis = strip(text).length, pad = Math.floor((w - vis) / 2);
  line(' '.repeat(Math.max(0, pad)) + text);
}
function cmdLine(cmd, desc, tag = '') {
  const tagPart = tag ? C.dim(' [') + C.orange(tag) + C.dim(']') : '';
  line('  ' + C.cyan(cmd.padEnd(28)) + C.dim('·  ') + C.mid(desc) + tagPart);
}
function sectionHead(icon, title) {
  blank();
  line('  ' + C.purple(icon) + '  ' + C.bold(C.bright(title)));
  line('  ' + C.dim('─'.repeat(strip(title).length + 4)));
}

function printBanner() {
  console.clear();

  let ascii;
  try {
    ascii = figlet.textSync('Ftermx', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      width: Math.min(process.stdout.columns || 80, 80),
    });
  } catch {
    ascii = figlet.textSync('Ftermx', { font: 'Slant', width: 80 });
  }

  const grd = gradient(['#00d4ff', '#a855f7', '#ff3d5a', '#00ff88']);
  console.log('\n' + grd.multiline(ascii.split('\n').map(l => '  ' + l).join('\n')));

  const ver = 'v' + require('../package.json').version;
  const sub = `  ─── Web Terminal Platform  ${ver}  ─── `;
  console.log(C.dim(sub) + '\n');

  top();
  blank();
  center(C.cyan(C.bold('F T E R M X')) + '  ' + C.dim('|') + '  ' + C.mid('Fast Terminal X'));
  blank();
  sep('·');
  blank();

  kv('Author',    'Farel Alfareza',                         C.dim, C.green);
  kv('Portfolio', 'farelsite.pages.dev',                    C.dim, C.cyan);
  kv('Version',   ver,                                      C.dim, C.purple);
  kv('Node',      process.version,                          C.dim, C.bright);
  kv('Platform',  os.platform() + ' ' + os.arch(),          C.dim, C.bright);
  kv('Host',      os.hostname(),                             C.dim, C.bright);
  kv('Uptime',    fmtUptime(os.uptime()),                   C.dim, C.yellow);
  kv('Memory',    fmtMem(os.freemem()) + ' free / ' + fmtMem(os.totalmem()), C.dim, C.bright);

  blank();
  sep();
  blank();

  line('  ' + C.dim('▸') + ' ' + C.cyan('ftermx start') + C.dim('          →  Launch server'));
  line('  ' + C.dim('▸') + ' ' + C.cyan('ftermx start --port 8080') + C.dim(' →  Custom port'));
  line('  ' + C.dim('▸') + ' ' + C.cyan('ftermx status') + C.dim('         →  Check server status'));
  line('  ' + C.dim('▸') + ' ' + C.cyan('ftermx --help') + C.dim('         →  Full command reference'));

  blank();
  bottom();
  console.log();
}

function fmtUptime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtMem(bytes) {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? gb.toFixed(1) + ' GB' : (bytes / 1024 ** 2).toFixed(0) + ' MB';
}

const PID_FILE = path.join(os.tmpdir(), 'ftermx.pid');

function readPid() {
  try { return parseInt(fs.readFileSync(PID_FILE, 'utf8').trim()); } catch { return null; }
}
function writePid(pid) { fs.writeFileSync(PID_FILE, String(pid)); }
function clearPid()    { try { fs.unlinkSync(PID_FILE); } catch {} }
function isRunning(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

const REQUIRED_MODULES = [
  'express', 'socket.io', 'xterm', 'xterm-addon-fit', 'xterm-addon-web-links',
  'ssh2', 'figlet', 'gradient-string', 'chalk', 'inquirer',
  '@ngrok/ngrok', 'dotenv', 'express-rate-limit', 'helmet', 'cors',
  'compression', 'express-session', 'multer', 'adm-zip',
  'node-pty', 'node-pty-prebuilt-multiarch',
];

printBanner();

const rawArgs = process.argv.slice(2);
const flags   = rawArgs.filter(a => a.startsWith('-'));
const posArgs = rawArgs.filter(a => !a.startsWith('-'));
const command = posArgs[0];
const sub     = posArgs[1];

async function main() {

  if (flags.includes('--help') || flags.includes('-h')) {
    showHelp(); return;
  }
  if (flags.includes('--version') || flags.includes('-v')) {
    const ver = require('../package.json').version;
    console.log('\n  ' + C.cyan(C.bold('Ftermx')) + '  ' + C.green('v' + ver) + '  ' + C.dim('by Farel Alfareza') + '\n');
    return;
  }
  if (flags.includes('--author')) {
    console.log(C.mid('\n  Author    ') + C.green('Farel Alfareza'));
    console.log(C.mid('  Portfolio ') + C.cyan('farelsite.pages.dev\n'));
    return;
  }

  if (!command) {
    await interactiveMenu();
  } else if (command === 'start') {
    await startServer();
  } else if (command === 'stop') {
    stopServer();
  } else if (command === 'restart') {
    stopServer(false);
    await new Promise(r => setTimeout(r, 1200));
    await startServer();
  } else if (command === 'status') {
    showStatus();
  } else if (command === 'add' && sub === 'user') {
    await addUser();
  } else if (command === 'del' && sub === 'user') {
    await deleteUser(posArgs[2]);
  } else if (command === 'list' && sub === 'users') {
    listUsers();
  } else if (command === 'passwd') {
    await changePassword(posArgs[1]);
  } else if (command === 'env') {
    showEnv();
  } else if (command === 'check') {
    checkDeps();
  } else if (command === '-i' && sub === 'all') {
    await installAllModules();
  } else {
    console.log(C.red('\n  ✗ Unknown command: ') + C.bright(command));
    console.log(C.mid('  Run ') + C.cyan('ftermx --help') + C.mid(' to see available commands.\n'));
  }
}

async function interactiveMenu() {
  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: C.bright('What do you want to do?'),
    choices: [
      new inquirer.Separator(C.dim('  ─── Server ───────────────────────')),
      { name: `  ${C.cyan('▸')} Start server                  ${C.dim('launch Ftermx')}`,         value: 'start'        },
      { name: `  ${C.cyan('▸')} Stop server                   ${C.dim('kill running process')}`,  value: 'stop'         },
      { name: `  ${C.cyan('▸')} Server status                 ${C.dim('check if running')}`,      value: 'status'       },
      new inquirer.Separator(C.dim('  ─── Users ────────────────────────')),
      { name: `  ${C.purple('▸')} Add user                     ${C.dim('create new account')}`,   value: 'add user'     },
      { name: `  ${C.purple('▸')} Delete user                  ${C.dim('remove account')}`,       value: 'del user'     },
      { name: `  ${C.purple('▸')} List users                   ${C.dim('show all accounts')}`,    value: 'list users'   },
      { name: `  ${C.purple('▸')} Change password              ${C.dim('update credentials')}`,   value: 'passwd'       },
      new inquirer.Separator(C.dim('  ─── Setup ────────────────────────')),
      { name: `  ${C.yellow('▸')} Check dependencies           ${C.dim('verify modules')}`,       value: 'check'        },
      { name: `  ${C.yellow('▸')} Install all modules          ${C.dim('npm install')}`,           value: 'install'      },
      { name: `  ${C.yellow('▸')} Show environment             ${C.dim('view .env / vars')}`,     value: 'env'          },
      new inquirer.Separator(C.dim('  ──────────────────────────────────')),
      { name: `  ${C.dim('▸')} Exit`,                                                              value: 'exit'         },
    ],
    pageSize: 18,
  }]);

  switch (choice) {
    case 'start':       await startServer(); break;
    case 'stop':        stopServer(); break;
    case 'status':      showStatus(); break;
    case 'add user':    await addUser(); break;
    case 'del user':    await deleteUser(); break;
    case 'list users':  listUsers(); break;
    case 'passwd':      await changePassword(); break;
    case 'check':       checkDeps(); break;
    case 'install':     await installAllModules(); break;
    case 'env':         showEnv(); break;
    case 'exit':        console.log(C.dim('\n  Bye.\n')); process.exit(0);
  }
}

function showStatus() {
  const pid  = readPid();
  const live = isRunning(pid);
  const port = process.env.PORT || '5000';

  console.log();
  top();
  blank();
  line('  ' + C.bold(C.bright('Server Status')));
  blank();
  sep('·');
  blank();

  if (live) {
    line('  ' + C.green('●') + '  ' + C.bold(C.green('RUNNING')));
    kv('PID',       String(pid),           C.mid, C.bright);
    kv('Port',      port,                  C.mid, C.cyan);
    kv('URL',       `http://localhost:${port}`, C.mid, C.cyan);
  } else {
    line('  ' + C.red('●') + '  ' + C.bold(C.red('STOPPED')));
    if (pid) {
      clearPid();
      line('  ' + C.dim('(stale PID cleared)'));
    }
  }

  blank();
  sep('·');
  blank();

  kv('Node',      process.version,                          C.mid, C.bright);
  kv('Platform',  os.platform() + ' / ' + os.arch(),        C.mid, C.bright);
  kv('Memory',    fmtMem(os.freemem()) + ' free / ' + fmtMem(os.totalmem()), C.mid, C.bright);
  kv('OS Uptime', fmtUptime(os.uptime()),                   C.mid, C.yellow);
  kv('CPUs',      os.cpus().length + 'x ' + (os.cpus()[0]?.model?.split(' ')[0] || ''), C.mid, C.bright);

  blank();
  bottom();
  console.log();
}

function stopServer(log = true) {
  const pid = readPid();
  if (!pid || !isRunning(pid)) {
    if (log) console.log(C.orange('\n  ⚠  No running Ftermx server found.\n'));
    clearPid();
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
    clearPid();
    if (log) console.log(C.green(`\n  ✓ Server (PID ${pid}) stopped.\n`));
  } catch (e) {
    if (log) console.log(C.red('\n  ✗ ' + e.message + '\n'));
  }
}

function checkDeps() {
  console.log();
  top();
  blank();
  line('  ' + C.bold(C.bright('Dependency Check')));
  blank();
  sep('·');
  blank();

  let ok = 0, fail = 0;
  for (const mod of REQUIRED_MODULES) {
    const optional = mod.includes('pty');
    try {
      require.resolve(mod);
      line('  ' + C.green('✓') + '  ' + C.bright(mod.padEnd(36)) + C.dim('ok'));
      ok++;
    } catch {
      const label = optional ? C.orange('○') : C.red('✗');
      const note  = optional ? C.dim(' (optional)') : C.red(' MISSING');
      line('  ' + label + '  ' + C.mid(mod.padEnd(36)) + note);
      fail++;
    }
  }

  blank();
  sep('·');
  blank();
  const icon = fail === 0 ? C.green('✓') : C.red('✗');
  line('  ' + icon + '  ' + C.bright(`${ok} ok`) + C.dim('  ·  ') + (fail ? C.red(`${fail} missing`) : C.dim('0 missing')));
  if (fail > 0)
    line('  ' + C.dim('Run ') + C.cyan('ftermx -i all') + C.dim(' to install missing packages.'));
  blank();
  bottom();
  console.log();
}

function showEnv() {
  const envFile = path.join(__dirname, '../.env');
  const envVars = [
    ['PORT',             process.env.PORT || '5000 (default)'],
    ['SESSION_SECRET',   process.env.SESSION_SECRET ? C.green('set ✓') : C.orange('not set (using fallback)')],
    ['DEPLOY_TYPE',      process.env.DEPLOY_TYPE || C.dim('not set')],
    ['NGROK_AUTHTOKEN',  process.env.NGROK_AUTHTOKEN ? C.green('set ✓') : C.dim('not set')],
    ['NODE_ENV',         process.env.NODE_ENV || C.dim('not set')],
  ];

  console.log();
  top();
  blank();
  line('  ' + C.bold(C.bright('Environment')));
  if (fs.existsSync(envFile)) line('  ' + C.dim('.env file found: ') + C.green('✓'));
  blank();
  sep('·');
  blank();

  for (const [k, v] of envVars) {
    const valStr = typeof v === 'string' ? v : v;
    line('  ' + C.cyan(k.padEnd(20)) + C.dim('→') + '  ' + (typeof v === 'string' ? C.bright(v) : v));
  }

  blank();
  sep('·');
  blank();
  line('  ' + C.dim('Create a ') + C.bright('.env') + C.dim(' file in the project root to set these.'));
  blank();
  bottom();
  console.log();
}

function listUsers() {
  let users;
  try {
    const { loadUsers } = require(path.join(__dirname, '../src/auth'));
    users = loadUsers();
  } catch (e) {
    console.log(C.red('\n  ✗ Could not load users: ') + e.message + '\n');
    return;
  }

  console.log();
  top();
  blank();
  line('  ' + C.bold(C.bright('User List')) + '  ' + C.dim('(' + users.length + ' total)'));
  blank();
  sep('·');
  blank();

  if (users.length === 0) {
    line('  ' + C.dim('No users found.'));
  } else {
    line('  ' + C.dim('Username'.padEnd(20)) + C.dim('Role'.padEnd(10)) + C.dim('Expires'));
    line('  ' + C.dim('─'.repeat(W() - 4)));
    for (const u of users) {
      const roleColor = u.role === 'admin' ? C.purple : C.cyan;
      const exp = u.expireAt ? C.orange(new Date(u.expireAt).toLocaleDateString()) : C.dim('never');
      line('  ' + C.bright(u.username.padEnd(20)) + roleColor(u.role.padEnd(10)) + exp);
    }
  }

  blank();
  bottom();
  console.log();
}

async function addUser() {
  console.log(C.cyan('\n  ┌─ Add New User ────────────────────────────────┐\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input', name: 'username',
      message: '  Username:',
      validate: v => v.trim().length >= 2 || 'At least 2 characters',
    },
    {
      type: 'password', name: 'password', mask: '•',
      message: '  Password:',
      validate: v => v.length >= 4 || 'At least 4 characters',
    },
    {
      type: 'password', name: 'confirm', mask: '•',
      message: '  Confirm password:',
      validate: (v, a) => v === a.password || 'Passwords do not match',
    },
    {
      type: 'list', name: 'role',
      message: '  Role:',
      choices: [
        { name: '  user   — terminal & files access',       value: 'user'  },
        { name: '  admin  — full access + user management', value: 'admin' },
      ],
    },
    {
      type: 'input', name: 'expireAt',
      message: '  Expiry date (YYYY-MM-DD, leave blank = never):',
      validate: v => {
        if (!v.trim()) return true;
        const d = new Date(v);
        return !isNaN(d) || 'Enter a valid date like 2025-12-31';
      },
    },
  ]);

  try {
    const { addUser: doAdd, updateUser } = require(path.join(__dirname, '../src/auth'));
    doAdd(answers.username.trim(), answers.password, answers.role);
    if (answers.expireAt.trim()) updateUser(answers.username.trim(), { expireAt: answers.expireAt.trim() });

    console.log('\n  ' + C.green('✓ User created: ') + C.bright(answers.username.trim()));
    console.log('  ' + C.dim('Role:    ') + C.purple(answers.role));
    console.log('  ' + C.dim('Expires: ') + (answers.expireAt.trim() ? C.orange(answers.expireAt.trim()) : C.dim('never')));
    console.log('  ' + C.dim('Login at ') + C.cyan('/login') + '\n');
  } catch (e) {
    console.log('\n  ' + C.red('✗ ' + e.message) + '\n');
  }
}

async function deleteUser(presetName) {
  let users;
  try {
    const { loadUsers } = require(path.join(__dirname, '../src/auth'));
    users = loadUsers();
  } catch (e) {
    console.log(C.red('\n  ✗ Could not load users: ') + e.message + '\n'); return;
  }

  let username = presetName;
  if (!username) {
    const { u } = await inquirer.prompt([{
      type: 'list', name: 'u',
      message: '  Select user to delete:',
      choices: users.map(u => ({
        name: `  ${u.username.padEnd(20)} ${u.role === 'admin' ? C.purple('admin') : C.cyan('user')}`,
        value: u.username,
      })),
    }]);
    username = u;
  }

  const { sure } = await inquirer.prompt([{
    type: 'confirm', name: 'sure',
    message: `  Delete user "${username}"? This cannot be undone.`,
    default: false,
  }]);
  if (!sure) { console.log(C.dim('\n  Cancelled.\n')); return; }

  try {
    const { deleteUser: doDelete } = require(path.join(__dirname, '../src/auth'));
    doDelete(username);
    console.log('\n  ' + C.green('✓ User "' + username + '" deleted.\n'));
  } catch (e) {
    console.log('\n  ' + C.red('✗ ' + e.message) + '\n');
  }
}

async function changePassword(presetName) {
  let users;
  try {
    const { loadUsers } = require(path.join(__dirname, '../src/auth'));
    users = loadUsers();
  } catch (e) {
    console.log(C.red('\n  ✗ ' + e.message) + '\n'); return;
  }

  let username = presetName;
  if (!username) {
    const { u } = await inquirer.prompt([{
      type: 'list', name: 'u',
      message: '  Select user:',
      choices: users.map(u => ({ name: '  ' + u.username, value: u.username })),
    }]);
    username = u;
  }

  const answers = await inquirer.prompt([
    { type: 'password', name: 'password', mask: '•', message: '  New password:', validate: v => v.length >= 4 || 'Min 4 chars' },
    { type: 'password', name: 'confirm',  mask: '•', message: '  Confirm:', validate: (v, a) => v === a.password || 'No match' },
  ]);

  try {
    const { updateUser } = require(path.join(__dirname, '../src/auth'));
    updateUser(username, { password: answers.password });
    console.log('\n  ' + C.green('✓ Password updated for "' + username + '".\n'));
  } catch (e) {
    console.log('\n  ' + C.red('✗ ' + e.message) + '\n');
  }
}

async function installAllModules() {
  const { installType } = await inquirer.prompt([{
    type: 'list', name: 'installType',
    message: 'Installation scope:',
    choices: [
      { name: '  Local   — this project only (recommended)', value: 'local'  },
      { name: '  Global  — available system-wide',           value: 'global' },
    ],
  }]);
  const isGlobal = installType === 'global';
  const npmCmd   = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const allMods  = [...REQUIRED_MODULES, 'ftermx'];
  const total = allMods.length; let done = 0, failed = 0; const BAR = 38;

  console.log('\n  ' + C.dim('Installing ' + total + ' packages…\n'));

  function renderBar() {
    const pct = done / total;
    const filled = Math.round(pct * BAR);
    const bar = C.cyan('█'.repeat(filled)) + C.dim('░'.repeat(BAR - filled));
    const pct3 = String(Math.round(pct * 100)).padStart(3) + '%';
    process.stdout.write(`\r  ${bar}  ${C.bright(pct3)}  ${C.dim(done + '/' + total)}   `);
  }

  for (const mod of allMods) {
    try {
      await new Promise((res, rej) => {
        const args = isGlobal ? ['install', '-g', mod] : ['install', mod];
        const p = spawn(npmCmd, args, { stdio: 'pipe', shell: true });
        const t = setTimeout(() => { p.kill(); rej(new Error('timeout')); }, 30000);
        p.on('close', code => { clearTimeout(t); code === 0 ? res() : rej(); });
        p.on('error', rej);
      });
    } catch { failed++; }
    done++; renderBar();
  }

  console.log('\n');
  if (failed === 0) console.log('  ' + C.green('✓ All ' + total + ' packages installed!\n'));
  else console.log('  ' + C.green('✓ ' + (total - failed) + ' installed') + '  ' + C.red('✗ ' + failed + ' failed') + '\n');

  console.log('  ' + C.dim('Run ') + C.cyan('ftermx start') + C.dim(' to launch.\n'));
}

async function startServer() {

  console.log('  ' + C.dim('Checking dependencies…'));
  const missing = REQUIRED_MODULES.filter(m => {
    try { require.resolve(m); return false; } catch { return true; }
  }).filter(m => !m.includes('pty'));

  if (missing.length > 0) {
    console.log(C.orange(`\n  ⚠  ${missing.length} module(s) missing: `) + C.mid(missing.join(', ')));
    const { go } = await inquirer.prompt([{ type: 'confirm', name: 'go', message: '  Install missing modules now?', default: true }]);
    if (!go) { console.log(C.red('\n  ✗ Cannot start. Run ') + C.cyan('ftermx -i all') + C.red(' first.\n')); return; }
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    for (const mod of missing) {
      process.stdout.write('  ' + C.dim('Installing ' + mod + '… '));
      try {
        await new Promise((res, rej) => {
          const p = spawn(npmCmd, ['install', mod], { stdio: 'pipe', shell: true });
          p.on('close', code => code === 0 ? res() : rej());
          p.on('error', rej);
        });
        process.stdout.write(C.green('✓\n'));
      } catch { process.stdout.write(C.red('✗\n')); }
    }
  }

  console.log();

  let deployType = flags.includes('--ngrok') ? 'ngrok' : null;
  if (!deployType) {
    const { dt } = await inquirer.prompt([{
      type: 'list', name: 'dt',
      message: '  Deployment mode:',
      choices: [
        { name: `  ${C.cyan('Local')}       — http://localhost  ${C.dim('(development)')}`,            value: 'local'  },
        { name: `  ${C.orange('Ngrok')}       — Public HTTPS tunnel  ${C.dim('(needs auth token)')}`,  value: 'ngrok'  },
      ],
    }]);
    deployType = dt;
  }

  const env = { ...process.env, DEPLOY_TYPE: deployType };

  let port = flags.find(f => f.startsWith('--port='))?.split('=')[1]
          || rawArgs[rawArgs.indexOf('--port') + 1];

  if (!port || isNaN(parseInt(port))) {
    const { p } = await inquirer.prompt([{
      type: 'input', name: 'p',
      message: '  Port:',
      default: process.env.PORT || '5000',
      validate: v => (!isNaN(parseInt(v)) && parseInt(v) > 0 && parseInt(v) <= 65535) || 'Valid port 1–65535',
    }]);
    port = p;
  }
  env.PORT = String(port);

  if (deployType === 'ngrok') {
    const presetToken = process.env.NGROK_AUTHTOKEN;
    if (presetToken) {
      console.log('  ' + C.green('✓ Ngrok token loaded from environment.'));
      env.NGROK_AUTHTOKEN = presetToken;
    } else {
      const { tok } = await inquirer.prompt([{
        type: 'input', name: 'tok',
        message: '  Ngrok auth token (dashboard.ngrok.com):',
        validate: v => v.trim().length > 0 || 'Token is required',
      }]);
      env.NGROK_AUTHTOKEN = tok.trim();
    }
    console.log('\n  ' + C.green('✓ Config complete — starting with ngrok tunnel…'));
  } else {
    console.log('\n  ' + C.green(`✓ Config complete — starting on port ${port}…`));
    console.log('  ' + C.dim('Local URL: ') + C.cyan(`http://localhost:${port}`));
    console.log('  ' + C.dim('Login:     ') + C.bright('admin / admin') + C.dim(' (change after first login)'));
  }

  console.log('  ' + C.dim('Press Ctrl+C to stop.\n'));

  const srv = spawn('node', [path.join(__dirname, '../src/server.js')], { stdio: 'inherit', env });
  writePid(srv.pid);
  srv.on('error', err => { clearPid(); console.error(C.red('\n  Server error: ') + err.message); });
  srv.on('close', code => {
    clearPid();
    console.log(C.dim(`\n  Server exited (code ${code ?? 0})`));
    process.exit(code ?? 0);
  });
}

function showHelp() {
  console.log();
  top();
  blank();
  center(C.bold(C.bright('Command Reference')));
  blank();

  sectionHead('⚡', 'Server');
  blank();
  cmdLine('ftermx start',               'Launch the web server (interactive)');
  cmdLine('ftermx start --port 8080',   'Launch on a custom port');
  cmdLine('ftermx start --ngrok',       'Launch with ngrok public tunnel');
  cmdLine('ftermx stop',                'Stop the running server');
  cmdLine('ftermx restart',             'Restart the server');
  cmdLine('ftermx status',              'Check if server is running');

  sectionHead('👤', 'User Management');
  blank();
  cmdLine('ftermx add user',            'Create a new user (interactive)');
  cmdLine('ftermx del user [name]',     'Delete a user');
  cmdLine('ftermx list users',          'List all users with roles');
  cmdLine('ftermx passwd [username]',   'Change a user\'s password');

  sectionHead('🔧', 'Setup & Config');
  blank();
  cmdLine('ftermx check',               'Verify all dependencies are installed');
  cmdLine('ftermx -i all',              'Install all required npm packages');
  cmdLine('ftermx env',                 'Show environment variables & .env status');

  sectionHead('ℹ', 'Info');
  blank();
  cmdLine('ftermx --help  (-h)',        'Show this reference');
  cmdLine('ftermx --version  (-v)',     'Print version');
  cmdLine('ftermx --author',            'Show author info');

  blank();
  sep('·');
  blank();

  line('  ' + C.bold(C.bright('Environment Variables')));
  blank();
  line('  ' + C.cyan('PORT'.padEnd(22))           + C.mid('Web server port          ') + C.dim('default: 5000'));
  line('  ' + C.cyan('SESSION_SECRET'.padEnd(22)) + C.mid('Session signing key      ') + C.orange('required in production'));
  line('  ' + C.cyan('NGROK_AUTHTOKEN'.padEnd(22))+ C.mid('Token for ngrok tunnel   ') + C.dim('dashboard.ngrok.com'));
  line('  ' + C.cyan('DEPLOY_TYPE'.padEnd(22))     + C.mid('local | ngrok            ') + C.dim('set by ftermx start'));
  line('  ' + C.cyan('NODE_ENV'.padEnd(22))        + C.mid('development | production'));

  blank();
  sep('·');
  blank();

  line('  ' + C.bold(C.bright('Default Login')));
  blank();
  line('  ' + C.mid('Username  ') + C.green('admin'));
  line('  ' + C.mid('Password  ') + C.green('admin') + C.orange('  ← change after first login!'));

  blank();
  sep('·');
  blank();

  line('  ' + C.bold(C.bright('Author')));
  blank();
  line('  ' + C.green('Farel Alfareza') + '  ' + C.dim('·') + '  ' + C.cyan('farelsite.pages.dev'));

  blank();
  bottom();
  console.log();
}

main().catch(err => {
  console.error(C.red('\n  Fatal: ') + err.message);
  process.exit(1);
});
