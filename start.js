import { createApp, lubatudParitolud } from './server/app.js';
import { createClientServer } from './client/serve.js';

const API_PORT = Number(process.env.API_PORT || 4000);
const LUBATUD_PORT = Number(process.env.CLIENT_PORT || 3000);
const KEELATUD_PORT = Number(process.env.BLOCKED_PORT || 3001);

const origins = lubatudParitolud();

createApp({ origins }).listen(API_PORT, () => {
  console.log(`API:              http://localhost:${API_PORT}`);
});

createClientServer().listen(LUBATUD_PORT, () => {
  console.log(`Frontend (lubatud): http://localhost:${LUBATUD_PORT}`);
});

createClientServer().listen(KEELATUD_PORT, () => {
  console.log(`Frontend (keelatud): http://localhost:${KEELATUD_PORT}`);
});
