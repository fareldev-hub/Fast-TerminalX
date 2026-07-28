#!/usr/bin/env node

const { spawn } = require('child_process');
const path      = require('path');
const os        = require('os');
const chalk     = require('chalk');
const figlet    = require('figlet');
const gradient  = require('gradient-string');
const inquirer  = require('inquirer');

// ─── Palette helpers ──────────────────────────────────────────────────────────
const C = {
  cyan:   (s) => chalk.hex('#00d4ff')(s),
  green:  (s) => chalk.hex('#00ff88')(s),
  purple: (s) => chalk.hex('#a855f7')(s),
  dim:    (s) => chalk.hex('#3d5068')(s),
  mid:    (s) => chalk.hex('#7a8fa6')(s),
  bright: (s) => chalk.hex('#e2eaf5')(s),
  red:    (s) => chalk.hex('#ff3d5a')(s),
  orange: (s) => chalk.hex('#ff8c42')(s),
  bold:   (s) => chalk.bold(s),
};

function boxWidth() {
  const cols = process.stdout.columns || 72;
  return Math.max(36, Math.min(cols - 4, 72));
}
function strip(s)  { return s.replace(/\x1B\[[0-9;]*m/g, ''); }
function line(content = '') {
  const W = boxWidth(); const visible = strip(content).length; const pad = Math.max(0, W - visible);
  process.stdout.write(C.dim('│') + ' ' + content + ' '.repeat(pad) + ' ' + C.dim('│') + '\n');
}
function blank()  { line(); }
function divider(ch = '─') { const W = boxWidth(); process.stdout.write(C.dim('├' + ch.repeat(W + 2) + '┤') + '\n'); }
function top()    { const W = boxWidth(); process.stdout.write(C.dim('╭' + '─'.repeat(W + 2) + '╮') + '\n'); }
function bottom() { const W = boxWidth(); process.stdout.write(C.dim('╰' + '─'.repeat(W + 2) + '╯') + '\n'); }
function kv(label, value, labelColor = C.cyan, valueColor = C.bright) {
  line(labelColor(label.padEnd(14)) + C.dim('·') + '  ' + valueColor(value));
}
function badge(text, color = C.cyan) { return color('▸') + ' ' + C.bright(text); }

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.clear();
  const ascii = figlet.textSync('Ftermx', { font: 'Slant', horizontalLayout: 'default', width: Math.min(process.stdout.columns || 80, 80) });
  const grad  = gradient(['#00d4ff', '#a855f7', '#00ff88']);
  console.log('\n' + grad.multiline(ascii.split('\n').map(l => '  ' + l).join('\n')));
  top(); blank();
  const tag = 'Fast Terminal X';
  const W = boxWidth(); const pad = Math.floor((W - strip(tag).length) / 2);
  line(' '.repeat(Math.max(0, pad)) + C.cyan(tag));
  blank(); divider(); blank();
  kv('  Author',    'Farel Alfareza',               C.mid, C.green);
  kv('  Portfolio', 'farelsite.pages.dev',           C.mid, C.cyan);
  kv('  Version',   'v' + require('../package.json').version, C.mid, C.purple);
  kv('  Node',      process.version,                 C.mid, C.bright);
  kv('  Platform',  os.platform() + ' ' + os.arch(), C.mid, C.bright);
  kv('  Host',      os.hostname(),                   C.mid, C.bright);
  blank(); divider('·'); blank();
  line(badge('ftermx start',    C.cyan)   + C.dim('      →  Launch the web terminal server'));
  line(badge('ftermx add user', C.purple) + C.dim(' →  Add a new user'));
  line(badge('ftermx -i all',   C.purple) + C.dim('   →  Install all dependencies'));
  line(badge('ftermx --help',   C.mid)    + C.dim('    →  Show full command reference'));
  line(badge('ftermx -v',       C.mid)    + C.dim('         →  Print version info'));
  blank(); bottom(); console.log();
}

const REQUIRED_MODULES = [
  'express', 'socket.io', 'xterm', 'xterm-addon-fit', 'xterm-addon-web-links',
  'ssh2', 'figlet', 'gradient-string', 'chalk', 'inquirer',
  '@ngrok/ngrok', 'dotenv', 'express-rate-limit', 'helmet', 'cors', 'compression',
  'express-session', 'node-pty', 'node-pty-prebuilt-multiarch'
];

printBanner();

const args    = process.argv.slice(2);
const command = args[0];

async function main() {
  if (command === 'start') {
    await startServer();
  } else if (command === 'add' && args[1] === 'user') {
    await addUser();
  } else if (command === '-i' && args[1] === 'all') {
    await installAllModules();
  } else if (command === '--help' || command === '-h') {
    showHelp();
  } else if (command === '--version' || command === '-v') {
    console.log(C.cyan('  Ftermx ') + C.green('v' + require('../package.json').version) + C.dim('  by Farel Alfareza'));
  } else if (command === '--author') {
    console.log(C.mid('\n  Author    ') + C.green('Farel Alfareza'));
    console.log(C.mid('  Portfolio ') + C.cyan('farelsite.pages.dev\n'));
  } else {
    console.log(C.red('  ✗ Unknown command??') + C.mid(' Run ') + C.cyan('ftermx --help') + C.mid(' for usage.\n'));
  }
}

// ─── Add user ─────────────────────────────────────────────────────────────────
async function addUser() {
  console.log(C.cyan('\n  ┌─ Add New User ────────────────────────────┐\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input', name: 'username',
      message: '  Username:',
      validate: v => v.trim().length >= 2 || 'Username must be at least 2 characters'
    },
    {
      type: 'password', name: 'password', mask: '•',
      message: '  Password:',
      validate: v => v.length >= 4 || 'Password must be at least 4 characters'
    },
    {
      type: 'password', name: 'confirm', mask: '•',
      message: '  Confirm password:',
      validate: (v, a) => v === a.password || 'Passwords do not match'
    },
    {
      type: 'list', name: 'role',
      message: '  Role:',
      choices: [
        { name: '  User   — terminal & connect access',           value: 'user'  },
        { name: '  Admin  — full access + user management',       value: 'admin' }
      ]
    }
  ]);

  try {
    // Load auth module relative to this file
    const { addUser: doAddUser } = require(path.join(__dirname, '../src/auth'));
    doAddUser(answers.username.trim(), answers.password, answers.role);
    console.log('\n' + C.green('  ✓ User "' + answers.username.trim() + '" created successfully!'));
    console.log(C.dim('  Role: ') + C.purple(answers.role));
    console.log(C.dim('  They can now log in at /login\n'));
  } catch (err) {
    console.log('\n' + C.red('  ✗ ' + err.message + '\n'));
  }
}

// ─── Install ──────────────────────────────────────────────────────────────────
async function installAllModules() {
  const { installType } = await inquirer.prompt([{
    type: 'list', name: 'installType',
    message: 'Installation scope:',
    choices: [
      { name: '  Global  — available system-wide', value: 'global' },
      { name: '  Local   — this project only',     value: 'local'  }
    ]
  }]);
  const isGlobal = installType === 'global';
  const npmFlag  = isGlobal ? '-g' : '';
  const npmCmd   = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const allMods  = [...REQUIRED_MODULES, 'ftermx'];
  const total = allMods.length; let done = 0, failed = 0; const BAR = 36;
  console.log('\n' + C.dim('  Installing ' + total + ' packages…\n'));
  function renderBar() {
    const pct = done / total; const filled = Math.round(pct * BAR); const empty = BAR - filled;
    const bar = C.cyan('█'.repeat(filled)) + C.dim('░'.repeat(empty));
    const pctStr = String(Math.round(pct * 100)).padStart(3) + '%';
    process.stdout.write(`\r  ${bar}  ${C.bright(pctStr)}  ${C.dim(done + '/' + total)}  `);
  }
  for (const mod of allMods) {
    try {
      await new Promise((res, rej) => {
        const p = spawn(npmCmd, ['install', npmFlag, mod].filter(Boolean), { stdio: 'pipe', shell: true });
        const t = setTimeout(() => { p.kill(); rej(new Error('timeout')); }, 30000);
        p.on('close', (code) => { clearTimeout(t); code === 0 ? res() : rej(); });
        p.on('error', rej);
      });
    } catch { failed++; }
    done++; renderBar();
  }
  console.log('\n');
  if (failed === 0) console.log(C.green('  ✓ All ' + total + ' packages installed!\n'));
  else console.log(C.green('  ✓ ' + (total - failed) + ' installed') + '  ' + C.red('✗ ' + failed + ' failed') + '\n');
  console.log(isGlobal
    ? C.mid('  Run ') + C.cyan('ftermx start') + C.mid(' to launch.\n')
    : C.mid('  Run ') + C.cyan('npm start') + C.mid(' or ') + C.cyan('node index.js') + C.mid(' to launch.\n'));
}

// ─── Start server ─────────────────────────────────────────────────────────────
async function startServer() {
  console.log(C.dim('  Checking dependencies…'));
  const missing = REQUIRED_MODULES.filter(m => { try { require.resolve(m); return false; } catch { return true; } });
  if (missing.length > 0) {
    console.log(C.orange(`\n  ⚠  ${missing.length} module(s) missing: `) + C.mid(missing.join(', ')));
    const { go } = await inquirer.prompt([{ type: 'confirm', name: 'go', message: 'Install missing modules now?', default: true }]);
    if (!go) { console.log(C.red('\n  ✗ Cannot start. Run ') + C.cyan('ftermx -i all') + C.red(' first.\n')); return; }
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    for (const mod of missing) {
      process.stdout.write(C.dim('  Installing ' + mod + '… '));
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

  // ── Deployment mode ────────────────────────────────────────────────────
  const { deployType } = await inquirer.prompt([{
    type: 'list', name: 'deployType',
    message: 'Deployment mode:',
    choices: [
      { name: '  Local      — http://localhost (development)', value: 'local'  },
      { name: '  Ngrok      — Public HTTPS tunnel',           value: 'ngrok'  }
    ]
  }]);

  const env = { ...process.env, DEPLOY_TYPE: deployType };

  // ── Port ────────────────────────────────────────────────────────────────
  const { port } = await inquirer.prompt([{
    type: 'input', name: 'port',
    message: 'Port for the web server:',
    default: env.PORT || '5000',
    validate: v => { const n = parseInt(v); return (n > 0 && n <= 65535) || 'Enter a valid port (1–65535)'; }
  }]);
  env.PORT = port.toString();

  if (deployType === 'ngrok') {
    const { tok } = await inquirer.prompt([{
      type: 'input', name: 'tok',
      message: 'Ngrok auth token (dashboard.ngrok.com):',
      validate: v => v.trim().length > 0 || 'Token required'
    }]);
    env.NGROK_AUTHTOKEN = tok.trim();
    console.log('\n' + C.green('  ✓ Config complete — starting server with ngrok…'));
  } else {
    console.log('\n' + C.green(`  ✓ Config complete — starting server on port ${port}…\n`));
  }

  const srv = spawn('node', [path.join(__dirname, '../src/server.js')], { stdio: 'inherit', env });
  srv.on('error', err => console.error(C.red('  Server error: ') + err.message));
  srv.on('close', code => { console.log(C.dim(`\n  Server exited (code ${code})`)); process.exit(code ?? 0); });
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(C.bold(C.bright('\n  USAGE\n')));
  const cmds = [
    ['ftermx start',         'Launch the web terminal server'],
    ['ftermx add user',      'Add a new user (interactive)'],
    ['ftermx -i all',        'Install all dependencies'],
    ['ftermx --help (-h)',   'Show this help'],
    ['ftermx --version (-v)','Print version'],
    ['ftermx --author',      'Show author info'],
  ];
  cmds.forEach(([cmd, desc]) => console.log('  ' + C.cyan(cmd.padEnd(26)) + C.mid(desc)));

  console.log(C.bold(C.bright('\n  TUNNEL MODES\n')));
  console.log('  ' + C.dim('local  ') + '  No tunnel — dev mode');
  console.log('  ' + C.dim('ngrok  ') + '  Set NGROK_AUTHTOKEN for public HTTPS URL\n');

  console.log(C.bold(C.bright('  ENV VARS\n')));
  [['DEPLOY_TYPE', 'local | ngrok'], ['NGROK_AUTHTOKEN', 'Token from dashboard.ngrok.com'], ['PORT', 'Web server port (default 5000)'], ['SESSION_SECRET', 'Secret key for auth sessions']].forEach(([k, v]) => {
    console.log('  ' + C.cyan(k.padEnd(20)) + C.mid(v));
  });
  console.log(C.bold(C.bright('\n  DEFAULT LOGIN\n')));
  console.log('  ' + C.green('Username: ') + C.bright('admin'));
  console.log('  ' + C.green('Password: ') + C.bright('admin') + '\n');

  console.log(C.bold(C.bright('  AUTHOR\n')));
  console.log('  ' + C.green('Farel Alfareza') + '  ' + C.dim('·') + '  ' + C.cyan('farelsite.pages.dev') + '\n');
}

main().catch(err => { console.error(C.red('\n  Fatal: ') + err.message); process.exit(1); });
