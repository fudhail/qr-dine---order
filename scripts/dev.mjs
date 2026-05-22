import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const viteBin = join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const serverFile = join(projectRoot, 'server.js');

const children = [];
let exited = false;

const stopChildren = (signal = 'SIGTERM') => {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

const start = (label, command, args) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  children.push(child);

  child.on('exit', (code, signal) => {
    if (exited) {
      return;
    }

    exited = true;
    stopChildren();

    if (signal) {
      process.exitCode = 1;
      return;
    }

    process.exitCode = code ?? 1;
  });

  child.on('error', (error) => {
    if (exited) {
      return;
    }

    exited = true;
    console.error(`[${label}] failed to start:`, error);
    stopChildren();
    process.exitCode = 1;
  });
};

process.on('SIGINT', () => {
  stopChildren('SIGINT');
});

process.on('SIGTERM', () => {
  stopChildren('SIGTERM');
});

start('vite', process.execPath, [viteBin, '--host']);
start('server', process.execPath, [serverFile]);