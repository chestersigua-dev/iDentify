const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '================================================================');
console.log('\x1b[36m%s\x1b[0m', '    iDentify v3.0 | Starting Development Platform Environment    ');
console.log('\x1b[36m%s\x1b[0m', '================================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Backend (NestJS on Port 4000)
console.log('\x1b[33m%s\x1b[0m', '-> Launching NestJS Backend API (Port 4000)...');
const backend = spawn(npmCmd, ['run', 'start:dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '4000' },
});

// 2. Start Frontend (Next.js on Port 3000)
console.log('\x1b[34m%s\x1b[0m', '-> Launching Next.js Frontend & Kiosk (Port 3000)...');
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000' },
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down iDentify dev servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
