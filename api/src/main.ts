import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const { API_PORT, DATA_PATH } = process.env;
if (!API_PORT || !DATA_PATH) {
  console.error('API_PORT and DATA_PATH must be set');
  process.exit(1);
}

const app = await createApp({
  seedPath: fileURLToPath(new URL('../../seed.json', import.meta.url)),
  dataPath: path.resolve(DATA_PATH),
});

await app.listen(Number(API_PORT));
console.log(`API listening on http://localhost:${API_PORT}`);
