import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const API_PORT = process.env.API_PORT || '4000';
const APP_PORT = process.env.APP_PORT || '3000';
const API_URL = process.env.API_URL || `http://localhost:${API_PORT}`;
const DATA_PATH = path.resolve(root, process.env.DATA_PATH || 'database.csv');
const env = { ...process.env, API_PORT, APP_PORT, API_URL, DATA_PATH };

for (const dir of ['api', 'app']) {
  if (fs.existsSync(path.join(root, dir, 'node_modules'))) continue;
  console.log(`Installing ${dir}/ dependencies...`);
  const { status } = spawnSync(npm, ['ci', '--no-audit', '--no-fund'], { cwd: path.join(root, dir), stdio: 'inherit', shell: process.platform === 'win32' });
  if (status !== 0) process.exit(status ?? 1);
}

const children = [
  spawn(npm, ['start'], { cwd: path.join(root, 'api'), env, stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev', '--', '--port', APP_PORT], { cwd: path.join(root, 'app'), env, stdio: 'inherit', shell: process.platform === 'win32' }),
];

console.log(`API on ${API_URL}, app on http://localhost:${APP_PORT}, data in ${DATA_PATH}`);

let stopping = false;
function stopAll(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

for (const child of children) child.on('exit', (code) => stopAll(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stopAll(0));
