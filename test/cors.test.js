import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, lubatudParitolud } from '../server/app.js';

const LUBATUD = 'http://localhost:3000';
const KEELATUD = 'http://localhost:3001';

let server;
let api;

before(async () => {
  server = createApp({ origins: [LUBATUD] }).listen(0);
  await new Promise((r) => server.once('listening', r));
  api = `http://localhost:${server.address().port}`;
});

after(() => server.close());

function preflight(path, origin, method = 'POST', headers = 'Content-Type') {
  return fetch(`${api}${path}`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': headers,
    },
  });
}

test('preflight lubatud päritolult saab kõik vajalikud päised', async () => {
  const res = await preflight('/api/andmed', LUBATUD, 'DELETE', 'Content-Type, Authorization');
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), LUBATUD);
  assert.match(res.headers.get('access-control-allow-methods'), /DELETE/);
  assert.match(res.headers.get('access-control-allow-headers'), /Authorization/);
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  assert.equal(res.headers.get('access-control-max-age'), '86400');
  assert.match(res.headers.get('vary'), /Origin/);
});

test('keelatud päritolu ei saa Allow-Origin päist', async () => {
  const res = await preflight('/api/andmed', KEELATUD);
  assert.equal(res.headers.get('access-control-allow-origin'), null);

  const get = await fetch(`${api}/api/avalik`, { headers: { Origin: KEELATUD } });
  assert.equal(get.headers.get('access-control-allow-origin'), null);
});

test('päritolu ei peegeldata ilma valge nimekirjata', async () => {
  const res = await fetch(`${api}/api/avalik`, { headers: { Origin: 'https://kuri.example' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('Allow-Origin ei ole kunagi * koos credentials\'iga', async () => {
  const res = await fetch(`${api}/api/avalik`, { headers: { Origin: LUBATUD } });
  assert.equal(res.headers.get('access-control-allow-origin'), LUBATUD);
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
});

test('401- ja 500-vastustel on samuti CORS-päised', async () => {
  const pole = await fetch(`${api}/api/mina`, { headers: { Origin: LUBATUD } });
  assert.equal(pole.status, 401);
  assert.equal(pole.headers.get('access-control-allow-origin'), LUBATUD);

  const viga = await fetch(`${api}/api/viga`, { headers: { Origin: LUBATUD } });
  assert.equal(viga.status, 500);
  assert.equal(viga.headers.get('access-control-allow-origin'), LUBATUD);
});

test('preflight kaitstud teele ei nõua autentimist', async () => {
  const res = await preflight('/api/mina', LUBATUD, 'GET', 'Authorization');
  assert.equal(res.status, 204);
});

test('küpsise ja tokeniga saab /api/mina kätte', async () => {
  const login = await fetch(`${api}/api/login`, { method: 'POST', headers: { Origin: LUBATUD } });
  const kypsis = login.headers.get('set-cookie').split(';')[0];
  const mina = await fetch(`${api}/api/mina`, { headers: { Origin: LUBATUD, Cookie: kypsis } });
  assert.equal(mina.status, 200);
  assert.deepEqual(await mina.json(), { kasutaja: 'demo', viis: 'küpsis' });

  const token = await fetch(`${api}/api/mina`, { headers: { Authorization: 'Bearer demo-token' } });
  assert.equal(token.status, 200);
});

test('CORS_ORIGINS loetakse komadega eraldatud nimekirjana', () => {
  assert.deepEqual(
    lubatudParitolud({ CORS_ORIGINS: 'https://minuapp.ee, http://localhost:3000' }),
    ['https://minuapp.ee', 'http://localhost:3000'],
  );
  assert.deepEqual(lubatudParitolud({}), ['http://localhost:3000']);
});
