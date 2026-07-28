// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║   ███████╗ █████╗ ██████╗ ███████╗██╗     ██████╗ ███████╗██╗   ██╗    ║
// ║   ██╔════╝██╔══██╗██╔══██╗██╔════╝██║     ██╔══██╗██╔════╝██║   ██║    ║
// ║   █████╗  ███████║██████╔╝█████╗  ██║     ██║  ██║█████╗  ██║   ██║    ║
// ║   ██╔══╝  ██╔══██║██╔══██╗██╔══╝  ██║     ██║  ██║██╔══╝  ╚██╗ ██╔╝    ║
// ║   ██║     ██║  ██║██║  ██║███████╗███████╗██████╔╝███████╗  ╚████╔╝     ║
// ║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ╚══════╝   ╚═══╝      ║
// ║                                                                         ║
// ║                      ✦  Source By FarelDev  ✦                           ║
// ║                  ──────────────────────────────────                      ║
// ║               Copyright © 2026 FarelDev. All Rights Reserved.           ║
// ║              Licensed under the Apache License, Version 2.0             ║
// ║                   See LICENSE file for full details.                     ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const {
    Client
} = require('ssh2');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const chalk = require('chalk');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'src/public')));

const connections = new Map();

io.on('connection', (socket) => {
    console.log(chalk.green('✓ Client connected'));

    let sshClient = null;
    let sshStream = null;

    socket.on('connect-ssh', async (config) => {
        try {
            sshClient = new Client();

            sshClient.on('ready', () => {
                console.log(chalk.green('  SSH connection established'));
                socket.emit('ssh-ready', 'SSH connection established');

                sshClient.shell((err, stream) => {
                    if (err) {
                        socket.emit('ssh-error', 'Shell session failed: ' + err.message);
                        return;
                    }
                    sshStream = stream;

                    stream.on('data', (data) => socket.emit('ssh-data', data.toString('utf8')));
                    stream.on('close', () => socket.emit('ssh-close', 'SSH session closed'));
                    stream.on('error', (err) => socket.emit('ssh-error', 'SSH stream error: ' + err.message));
                });
            });

            sshClient.on('error', (err) => {
                socket.emit('ssh-error', 'SSH connection failed: ' + err.message);
            });

            sshClient.connect({
                host: config.host || process.env.SSH_HOST || 'localhost',
                port: config.port || parseInt(process.env.SSH_PORT) || 22,
                username: config.username || process.env.SSH_USERNAME || 'root',
                password: config.password || process.env.SSH_PASSWORD || ''
            });

            connections.set(socket.id, {
                client: sshClient,
                stream: sshStream
            });
        } catch (error) {
            socket.emit('ssh-error', 'Connection error: ' + error.message);
        }
    });

    socket.on('ssh-input', (data) => {
        if (sshStream && sshStream.writable) sshStream.write(data);
    });

    socket.on('disconnect', () => {
        console.log(chalk.yellow('⚠ Client disconnected'));
        if (sshClient) sshClient.end();
        connections.delete(socket.id);
    });

    socket.on('resize', (dimensions) => {
        if (sshStream && sshStream.setWindow)
            sshStream.setWindow(dimensions.rows, dimensions.cols);
    });
});

app.get('/ftermx', (req, res) => res.sendFile(path.join(__dirname, 'src/public/index.html')));
app.get('/', (req, res) => res.redirect('/ftermx'));

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        connections: connections.size,
        uptime: process.uptime()
    });
});

app.use((err, req, res, next) => {
    console.error(chalk.red(err.stack));
    res.status(500).json({
        error: 'Something went wrong!'
    });
});

function sep(ch = '─') {
    const w = Math.min(process.stdout.columns || 50, 60);
    return chalk.gray(ch.repeat(w));
}

const PORT = process.env.PORT || 1010;

async function startServer() {
    try {
        server.listen(PORT, '0.0.0.0', async () => {
            console.log(chalk.cyan('\n  Ftermx Server Running'));
            console.log(sep());

            const deployType = process.env.DEPLOY_TYPE || 'local';

            if (deployType === 'ngrok' && process.env.NGROK_AUTHTOKEN) {
                try {
                    const ngrok = require('@ngrok/ngrok');
                    const listener = await ngrok.forward({
                        addr: PORT,
                        authtoken: process.env.NGROK_AUTHTOKEN
                    });
                    const ngrokUrl = listener.url();
                    console.log(chalk.green('  Public URL (ngrok):'));
                    console.log(chalk.bold.blue(`  ${ngrokUrl}/ftermx`));
                } catch (ngrokErr) {
                    console.log(chalk.red(`  Ngrok error: ${ngrokErr.message}`));
                    console.log(chalk.yellow('  Falling back to local URL'));
                    showLocalUrl();
                }
            } else {
                showLocalUrl();
            }

            console.log(sep());
            console.log(chalk.gray('  Press Ctrl+C to stop\n'));
        });
    } catch (error) {
        console.error(chalk.red('  Server error:'), error);
        process.exit(1);
    }
}

function showLocalUrl() {
    console.log(chalk.green('  Local URL:'));
    console.log(chalk.bold.blue(`  http://localhost:${PORT}/ftermx`));
}

process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n  Shutting down…'));
    for (const [, conn] of connections) {
        if (conn.client) conn.client.end();
    }
    connections.clear();

    if (process.env.DEPLOY_TYPE === 'ngrok') {
        try {
            const ngrok = require('@ngrok/ngrok');
            await ngrok.disconnect();
            await ngrok.kill();
        } catch (_) {}
    }

    server.close(() => {
        console.log(chalk.green('  Server stopped'));
        process.exit(0);
    });
});

startServer();
