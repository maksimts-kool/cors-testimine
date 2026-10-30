const API = new URLSearchParams(location.search).get('api') || 'http://localhost:4000';

const testid = [
  {
    nimi: 'Lihtne GET',
    selgitus: 'GET ilma kohandatud päisteta. Preflight\'i ei teki.',
    kaivita: () => fetch(`${API}/api/avalik`),
  },
  {
    nimi: 'POST JSON-iga',
    selgitus: 'Content-Type: application/json, seega saadab brauser enne OPTIONS-päringu.',
    kaivita: () => fetch(`${API}/api/andmed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nimi: 'Mari' }),
    }),
  },
  {
    nimi: 'DELETE',
    selgitus: 'DELETE ei ole lihtne meetod, seega tuleb preflight.',
    kaivita: () => fetch(`${API}/api/andmed/42`, { method: 'DELETE' }),
  },
  {
    nimi: 'Sisselogimine küpsisega',
    selgitus: 'POST /api/login ja siis GET /api/mina, mõlemad credentials: \'include\'.',
    kaivita: async () => {
      await fetch(`${API}/api/login`, { method: 'POST', credentials: 'include' });
      return fetch(`${API}/api/mina`, { credentials: 'include' });
    },
  },
  {
    nimi: 'Authorization-päis',
    selgitus: 'Bearer-token on kohandatud päis, seega tuleb preflight. Preflight läheb autentimisest läbi.',
    kaivita: () => fetch(`${API}/api/mina`, { headers: { Authorization: 'Bearer demo-token' } }),
  },
  {
    nimi: 'Ilma sisselogimiseta',
    selgitus: 'Server vastab 401. Kuna CORS-päised on ka veavastusel, saab JavaScript vea lugeda.',
    kaivita: () => fetch(`${API}/api/mina`),
  },
  {
    nimi: 'Serveriviga',
    selgitus: 'Server vastab 500. Ka sellel vastusel on CORS-päised.',
    kaivita: () => fetch(`${API}/api/viga`),
  },
  {
    nimi: 'mode: \'no-cors\'',
    selgitus: 'Levinud "parandus", mis ei tööta: päring läheb läbi, aga vastus on läbipaistmatu.',
    kaivita: () => fetch(`${API}/api/avalik`, { mode: 'no-cors' }),
  },
];

async function kirjelda(vastus) {
  if (vastus.type === 'opaque') {
    return { ok: false, tekst: `type: opaque, status: ${vastus.status}\nVastust ei saa lugeda.` };
  }
  const keha = await vastus.text();
  let ilus = keha;
  try { ilus = JSON.stringify(JSON.parse(keha), null, 2); } catch {}
  const acao = vastus.headers.get('Access-Control-Allow-Origin');
  return {
    ok: true,
    tekst: `HTTP ${vastus.status}\nAccess-Control-Allow-Origin: ${acao}\n\n${ilus}`,
  };
}

async function jooksuta(test, tulemus) {
  tulemus.className = '';
  tulemus.textContent = '…';
  try {
    const { ok, tekst } = await kirjelda(await test.kaivita());
    tulemus.className = ok ? 'ok' : 'err';
    tulemus.textContent = tekst;
  } catch (e) {
    // CORS-i blokeering ei anna JavaScriptile põhjust, ainult TypeError
    tulemus.className = 'err';
    tulemus.textContent = `Blokeeritud: ${e.name}: ${e.message}\nPõhjus on näha brauseri konsoolis.`;
  }
}

const konteiner = document.getElementById('testid');
const tulemused = testid.map((test) => {
  const rida = document.createElement('section');
  rida.className = 'test';
  rida.innerHTML = '<div><h2></h2><p></p></div><button>Käivita</button><pre></pre>';
  rida.querySelector('h2').textContent = test.nimi;
  rida.querySelector('p').textContent = test.selgitus;
  const tulemus = rida.querySelector('pre');
  rida.querySelector('button').addEventListener('click', () => jooksuta(test, tulemus));
  konteiner.append(rida);
  return tulemus;
});

document.getElementById('koik').addEventListener('click', async () => {
  for (const [i, test] of testid.entries()) await jooksuta(test, tulemused[i]);
});
document.getElementById('puhasta').addEventListener('click', () => {
  tulemused.forEach((t) => { t.className = ''; t.textContent = ''; });
});

document.getElementById('leht').textContent = location.origin;
document.getElementById('api').textContent = API;
const teinePort = location.port === '3000' ? '3001' : '3000';
const vaheta = document.getElementById('vaheta');
vaheta.href = `${location.protocol}//${location.hostname}:${teinePort}${location.search}`;
vaheta.textContent = teinePort === '3001'
  ? 'Proovi keelatud päritolult (:3001) →'
  : 'Tagasi lubatud päritolule (:3000) →';
