#!/usr/bin/env node

// Use tsx to run TypeScript directly
const { spawn } = require('child_process');
const { join } = require('path');

const cliPath = join(__dirname, '..', 'index.ts');
const child = spawn('npx', ['tsx', cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
