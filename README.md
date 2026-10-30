# CORS-i testimine

Väike näidisprojekt, kus näed CORS-i töötamas ja ebaõnnestumas päris brauseris.

- **API** (`server/app.js`): Express + `cors` pordil **4000**. Lubatud päritolud tulevad muutujast `CORS_ORIGINS`.
- **Frontend** (`client/`): töötab kahel pordil:
  - **http://localhost:3000**: lubatud päritolu.
  - **http://localhost:3001**: keelatud päritolu.

## Käivitamine

Vaja on Node.js 18 või uuemat.

```bash
npm install
npm start
```

Ava http://localhost:3000, vajuta **Käivita kõik** ja ava DevTools → Network/Console. Seejärel vajuta lingile „Proovi keelatud päritolult“ ja käivita testid uuesti.

## Mida leht näitab

| Test | Preflight? | Mida õpetab |
|---|---|---|
| Lihtne GET | ei | Vajab ainult `Allow-Origin` päist |
| POST JSON-iga | jah | `application/json` tekitab preflight'i |
| DELETE | jah | Mitte-lihtne meetod tekitab preflight'i |
| Sisselogimine küpsisega | jah | `credentials: 'include'` + `Allow-Credentials: true` |
| Authorization-päis | jah | Preflight lastakse autentimisest läbi |
| Ilma sisselogimiseta | ei | 401-vastusel on samuti CORS-päised |
| Serveriviga | ei | 500-vastusel on samuti CORS-päised |
| `mode: 'no-cors'` | ei | See ei paranda midagi, vastus on läbipaistmatu |

## Seadistus

| Muutuja | Vaikimisi | Tähendus |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:3000` | Komadega eraldatud lubatud päritolud |
| `API_PORT` | `4000` | API port |
| `CLIENT_PORT` | `3000` | Lubatud frontendi port |
| `BLOCKED_PORT` | `3001` | Keelatud frontendi port |
| `COOKIE_CROSS_SITE` | – | `1` paneb küpsisele `SameSite=None; Secure` (vajalik eri domeenide vahel, nõuab HTTPS-i) |

Näide: luba mõlemad pordid.

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001 npm start
```

## Testid

```bash
npm test
```

Testid (`test/cors.test.js`) kontrollivad, et:

- preflight saab õiged päised;
- keelatud päritolu ei saa `Allow-Origin` päist;
- `Origin` väärtust ei peegeldata ilma valge nimekirjata;
- 401- ja 500-vastustel on CORS-päised olemas;
- `OPTIONS` ei jää autentimise taha.
