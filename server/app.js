import express from 'express';
import cors from 'cors';

export function lubatudParitolud(env = process.env) {
  return (env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function createApp({ origins = lubatudParitolud() } = {}) {
  const app = express();

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin)) cb(null, true);
      else cb(null, false); // keelatud: CORS-päiseid ei lisata
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }));

  app.use(express.json());

  app.get('/api/avalik', (req, res) => {
    res.json({ sonum: 'Tere! See on avalik vastus.', aeg: new Date().toISOString() });
  });

  app.post('/api/andmed', (req, res) => {
    res.status(201).json({ salvestatud: req.body });
  });

  app.delete('/api/andmed/:id', (req, res) => {
    res.json({ kustutatud: req.params.id });
  });

  app.post('/api/login', (req, res) => {
    const crossSite = process.env.COOKIE_CROSS_SITE === '1';
    res.cookie('sessioon', 'demo', {
      httpOnly: true,
      // Eri domeenide vahel on vaja SameSite=None; Secure. localhost:3000 ja :4000 on sama "site".
      sameSite: crossSite ? 'none' : 'lax',
      secure: crossSite,
    });
    res.json({ sisse: true });
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('sessioon').json({ sisse: false });
  });

  function nouaSisselogimist(req, res, next) {
    if (req.method === 'OPTIONS') return next();
    const kypsis = /(?:^|;\s*)sessioon=demo(?:;|$)/.test(req.headers.cookie || '');
    const token = req.headers.authorization === 'Bearer demo-token';
    if (kypsis || token) return next();
    res.status(401).json({ viga: 'Pole sisse logitud' });
  }

  app.get('/api/mina', nouaSisselogimist, (req, res) => {
    res.json({ kasutaja: 'demo', viis: req.headers.authorization ? 'token' : 'küpsis' });
  });

  app.get('/api/viga', () => {
    throw new Error('Tahtlik serveriviga');
  });

  app.use((err, req, res, next) => {
    res.status(500).json({ viga: err.message });
  });

  return app;
}
