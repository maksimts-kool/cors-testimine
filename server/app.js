import express from 'express';
import cors from 'cors';

// Lubatud päritolud tulevad keskkonnamuutujast, et arendus ja toodang oleksid eraldi
export function lubatudParitolud(env = process.env) {
  return (env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function createApp({ origins = lubatudParitolud() } = {}) {
  const app = express();

  // CORS peab olema esimene, et päised jõuaksid ka vea- ja 401-vastustele
  app.use(cors({
    origin: (origin, cb) => {
      // Ilma Origin-päiseta päringud (curl, sama päritolu) lastakse läbi
      if (!origin || origins.includes(origin)) cb(null, true);
      else cb(null, false); // keelatud: CORS-päiseid ei lisata, brauser blokeerib
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }));

  app.use(express.json());

  // Lihtne päring: GET ilma kohandatud päisteta, preflight'i ei teki
  app.get('/api/avalik', (req, res) => {
    res.json({ sonum: 'Tere! See on avalik vastus.', aeg: new Date().toISOString() });
  });

  // application/json sunnib brauseri enne OPTIONS-päringut saatma
  app.post('/api/andmed', (req, res) => {
    res.status(201).json({ salvestatud: req.body });
  });

  // DELETE ei ole "lihtne" meetod, seega samuti preflight
  app.delete('/api/andmed/:id', (req, res) => {
    res.json({ kustutatud: req.params.id });
  });

  // Küpsis: frontend peab saatma credentials: 'include'
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

  // Autentimine: preflight tuleb ilma küpsise ja tokenita, seega OPTIONS lastakse läbi
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

  // Näitab, et ka 500-vastusel on CORS-päised olemas
  app.get('/api/viga', () => {
    throw new Error('Tahtlik serveriviga');
  });

  app.use((err, req, res, next) => {
    res.status(500).json({ viga: err.message });
  });

  return app;
}
