import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const juur = path.dirname(fileURLToPath(import.meta.url));

const tyybid = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

// Väike staatiline server; sama frontend käivitatakse mitmel pordil = mitu päritolu
export function createClientServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const failitee = url.pathname === '/' ? '/index.html' : url.pathname;
    const fail = path.join(juur, path.normalize(failitee));
    if (!fail.startsWith(juur + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const sisu = await readFile(fail);
      res.writeHead(200, { 'Content-Type': tyybid[path.extname(fail)] || 'application/octet-stream' });
      res.end(sisu);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Ei leitud');
    }
  });
}
