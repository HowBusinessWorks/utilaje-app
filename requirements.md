# FleetOps — Plan Tehnic Simplificat
### Aplicație Demo Locală · Fără Autentificare · Toate Funcționalitățile

---

## REZUMAT EXECUTIV

Scopul este o aplicație funcțională care rulează **100% local**, fără server extern, fără autentificare, ușor de pornit cu o singură comandă. Poate fi demonstrată oricând de pe orice laptop.

---

## TECH STACK

```
Frontend:  React + Vite  (TypeScript opțional, merge și JS pur)
Styling:   Tailwind CSS
Grafice:   Recharts
Hartă:     React Leaflet + OpenStreetMap  (GRATUIT, fără API key)
DB local:  SQLite  prin better-sqlite3
Backend:   Express.js  (câteva zeci de linii, rulează în același proiect)
Upload:    Fișierele se salvează local în /uploads (pe disk)
Start:     o singură comandă: npm run dev
```

**De ce acest stack:**
- SQLite = un singur fișier `.db` pe disk, zero configurare, zero server de baze de date
- Express = minim de cod pentru API, rulează în Node.js care oricum e instalat
- Leaflet + OpenStreetMap = hartă completă, gratuit, zero API key, funcționează offline (după prima încărcare a tile-urilor)
- Vite = start instant, hot reload, bundle rapid
- Tot proiectul = un folder, un `npm install`, un `npm run dev`

**Ce NU există în această versiune (intenționat):**
- Autentificare / roluri
- Cloud storage
- Email / notificări
- Multi-tenant

---

## STRUCTURA PROIECTULUI

```
fleetops/
├── package.json
├── vite.config.js
├── tailwind.config.js
│
├── server/                     ← Express backend
│   ├── index.js                ← Entry point server (port 3001)
│   ├── db.js                   ← Inițializare SQLite + seed date demo
│   └── routes/
│       ├── utilaje.js
│       ├── planificari.js
│       ├── motorina.js
│       ├── pvp.js
│       ├── reparatii.js
│       ├── lucrari.js
│       ├── persoane.js
│       └── rapoarte.js
│
├── src/                        ← React frontend
│   ├── main.jsx
│   ├── App.jsx                 ← Router principal
│   ├── api.js                  ← Wrapper fetch → http://localhost:3001
│   │
│   ├── components/
│   │   ├── Layout.jsx          ← Sidebar + Topbar wrapper
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── StatusBadge.jsx
│   │   └── UploadZone.jsx
│   │
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Utilaje.jsx
│       ├── UtilajDetaliu.jsx
│       ├── Planificare.jsx
│       ├── Harta.jsx
│       ├── Motorina.jsx
│       ├── ProceseVerbale.jsx
│       ├── Reparatii.jsx
│       ├── Lucrari.jsx
│       ├── Persoane.jsx
│       └── Rapoarte.jsx
│
└── uploads/                    ← Fișierele uploadate local (poze, facturi)
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "vite",
    "build": "vite build"
  }
}
```

---

## BAZA DE DATE SQLite

### Fișier: `server/db.js`

```javascript
const Database = require('better-sqlite3');
const db = new Database('./fleetops.db');

// Activează foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Creare tabele la prima pornire
db.exec(`
  CREATE TABLE IF NOT EXISTS categorii (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL UNIQUE,
    culoare TEXT DEFAULT '#5b8af0'
  );

  CREATE TABLE IF NOT EXISTS locatii (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    adresa TEXT,
    lat REAL,
    lng REAL,
    tip TEXT DEFAULT 'lucrare'  -- 'baza' sau 'lucrare'
  );

  CREATE TABLE IF NOT EXISTS lucrari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    locatie_id INTEGER REFERENCES locatii(id),
    data_start TEXT,
    data_sfarsit TEXT,
    status TEXT DEFAULT 'activa'  -- 'activa', 'finalizata', 'suspendata'
  );

  CREATE TABLE IF NOT EXISTS persoane (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    telefon TEXT,
    categorie TEXT NOT NULL  -- 'angajat', 'subcontractant'
  );

  CREATE TABLE IF NOT EXISTS utilaje (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    denumire TEXT NOT NULL,
    alias TEXT,
    serie TEXT,
    nr_inventar TEXT,
    responsabil_id INTEGER REFERENCES persoane(id),
    locatie_baza_id INTEGER REFERENCES locatii(id),
    producator TEXT,
    proprietate TEXT DEFAULT 'propriu',  -- 'propriu', 'inchiriat', 'leasing'
    garantie_exp TEXT,
    data_achizitie TEXT,
    observatii TEXT,
    status TEXT DEFAULT 'disponibil',  -- 'disponibil', 'service', 'indisponibil', 'casat'
    categorie_id INTEGER REFERENCES categorii(id),
    chirie_zi REAL,
    ore_contor INTEGER DEFAULT 0,
    thumbnail_url TEXT
  );

  CREATE TABLE IF NOT EXISTS utilaje_poze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS planificari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
    lucrare_id INTEGER REFERENCES lucrari(id),
    persoana_id INTEGER REFERENCES persoane(id),
    data_start TEXT NOT NULL,
    data_sfarsit TEXT NOT NULL,
    observatii TEXT,
    culoare TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fise_motorina (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
    lucrare_id INTEGER REFERENCES lucrari(id),
    persoana_id INTEGER REFERENCES persoane(id),
    data_consum TEXT NOT NULL,
    nr_litri REAL NOT NULL,
    furnizor TEXT,
    ore_contor INTEGER,
    observatii TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS procese_verbale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
    lucrare_id INTEGER REFERENCES lucrari(id),
    -- PREDARE
    data_predare TEXT,
    persoana_primire_id INTEGER REFERENCES persoane(id),
    responsabil_predare TEXT,
    ore_contor_predare INTEGER,
    motorina_predare REAL,
    stare_predare TEXT,
    observatii_predare TEXT,
    -- PRIMIRE
    data_primire TEXT,
    responsabil_primire TEXT,
    ore_contor_primire INTEGER,
    motorina_primire REAL,
    stare_primire TEXT,
    observatii_primire TEXT,
    probleme_constatate TEXT,
    -- STATUS
    status TEXT DEFAULT 'deschis',  -- 'deschis', 'inchis'
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pv_poze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pv_id INTEGER REFERENCES procese_verbale(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    etapa TEXT  -- 'predare' sau 'primire'
  );

  CREATE TABLE IF NOT EXISTS fise_reparatii (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
    data_reparatie TEXT NOT NULL,
    furnizor TEXT NOT NULL,
    descriere TEXT NOT NULL,
    cost_total REAL NOT NULL,
    ore_contor INTEGER,
    durata_zile INTEGER,
    factura_url TEXT,
    observatii TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reparatii_poze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reparatie_id INTEGER REFERENCES fise_reparatii(id) ON DELETE CASCADE,
    url TEXT NOT NULL
  );
`);
```

### Date demo seed (se inserează automat la prima pornire dacă DB e goală):

```javascript
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM utilaje').get().c;
  if (count > 0) return;

  // Categorii
  const cats = db.prepare('INSERT INTO categorii (nume, culoare) VALUES (?, ?)');
  cats.run('Excavatoare', '#5b8af0');
  cats.run('Buldozere', '#f0a500');
  cats.run('Macarale', '#9b6dff');
  cats.run('Compactoare', '#2dd4a0');
  cats.run('Autobasculante', '#ff6b35');

  // Locatii
  const loc = db.prepare('INSERT INTO locatii (nume, adresa, lat, lng, tip) VALUES (?, ?, ?, ?, ?)');
  loc.run('Baza Cluj', 'Cluj-Napoca, Str. Fabricii 20', 46.7712, 23.6236, 'baza');
  loc.run('Bloc Titan', 'Cluj-Napoca, Calea Turzii 145', 46.7489, 23.6140, 'lucrare');
  loc.run('Șantier Nord', 'Cluj-Napoca, Str. Dorobanților 14', 46.7890, 23.5980, 'lucrare');
  loc.run('Parc Industrial Tetarom', 'Cluj-Napoca, Tetarom III', 46.8012, 23.7100, 'lucrare');

  // Persoane
  const per = db.prepare('INSERT INTO persoane (nume, telefon, categorie) VALUES (?, ?, ?)');
  per.run('Ion Popescu', '0740 123 456', 'angajat');
  per.run('Mihai Radu', '0741 234 567', 'angajat');
  per.run('George Dan', '0742 345 678', 'angajat');
  per.run('SC Meca SRL', '0264 100 200', 'subcontractant');
  per.run('Pavel Mureșan', '0743 456 789', 'angajat');

  // Lucrari
  const luc = db.prepare('INSERT INTO lucrari (nume, locatie_id, data_start, status) VALUES (?, ?, ?, ?)');
  luc.run('Bloc Titan', 2, '2025-04-15', 'activa');
  luc.run('Șantier Nord', 3, '2025-05-01', 'activa');
  luc.run('Parc Industrial Tetarom', 4, '2025-03-10', 'activa');

  // Utilaje
  const util = db.prepare(`INSERT INTO utilaje 
    (denumire, alias, serie, nr_inventar, responsabil_id, locatie_baza_id, 
     producator, proprietate, garantie_exp, data_achizitie, status, categorie_id, chirie_zi, ore_contor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  util.run('Excavator CAT 320', 'EXC-01', 'CAT320-2019-1042', '10042', 1, 1, 'Caterpillar', 'propriu', '2026-03-14', '2019-03-14', 'disponibil', 1, 850, 2840);
  util.run('Macara Liebherr LTM 1050', 'MAC-02', 'LTM-2020-0081', '10067', 2, 1, 'Liebherr', 'propriu', '2025-01-20', '2020-01-20', 'service', 3, 1200, 1520);
  util.run('Buldozer Caterpillar D6T', 'BLD-03', 'D6T-2018-5522', '10033', 3, 1, 'Caterpillar', 'propriu', null, '2018-06-10', 'disponibil', 2, 720, 4210);
  util.run('Compactor BOMAG BW 213', 'CMP-04', 'BW213-2021-0991', '10089', 5, 1, 'BOMAG', 'leasing', '2026-08-15', '2021-08-15', 'indisponibil', 4, 480, 980);
  util.run('Autobasculantă Volvo FMX', 'ABS-05', 'FMX-2022-1107', '10112', 1, 1, 'Volvo', 'propriu', '2027-02-20', '2022-02-20', 'disponibil', 5, 650, 3120);
  util.run('Încărcător Frontal JCB 456', 'INC-06', 'JCB456-2020-3301', '10098', 3, 1, 'JCB', 'propriu', null, '2020-11-05', 'disponibil', 1, 390, 1870);

  // Planificari demo
  const plan = db.prepare(`INSERT INTO planificari (utilaj_id, lucrare_id, persoana_id, data_start, data_sfarsit) VALUES (?, ?, ?, ?, ?)`);
  plan.run(1, 1, 1, '2025-06-02', '2025-06-14');
  plan.run(3, 2, 3, '2025-06-05', '2025-06-20');
  plan.run(5, 1, 1, '2025-06-01', '2025-06-12');
  plan.run(2, null, 2, '2025-06-01', '2025-06-06'); // service

  // Fise motorina demo
  const mot = db.prepare(`INSERT INTO fise_motorina (utilaj_id, lucrare_id, persoana_id, data_consum, nr_litri, furnizor, ore_contor) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  mot.run(1, 1, 1, '2025-06-03', 320, 'Rompetrol', 2870);
  mot.run(3, 2, 3, '2025-06-02', 180, 'OMV', 4240);
  mot.run(5, 1, 1, '2025-06-01', 95, 'Rompetrol', 3145);

  // Reparatie demo
  db.prepare(`INSERT INTO fise_reparatii (utilaj_id, data_reparatie, furnizor, descriere, cost_total, ore_contor, durata_zile)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(3, '2025-06-02', 'SC Meca SRL', 'Înlocuire garnituri hidraulice și ulei hidraulic', 4200, 4210, 3);
}
```

---

## API ROUTES (Express)

### `server/index.js`
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // servire fișiere statice

// Routes
app.use('/api/utilaje', require('./routes/utilaje'));
app.use('/api/planificari', require('./routes/planificari'));
app.use('/api/motorina', require('./routes/motorina'));
app.use('/api/pvp', require('./routes/pvp'));
app.use('/api/reparatii', require('./routes/reparatii'));
app.use('/api/lucrari', require('./routes/lucrari'));
app.use('/api/persoane', require('./routes/persoane'));
app.use('/api/rapoarte', require('./routes/rapoarte'));

app.listen(3001, () => console.log('FleetOps server → http://localhost:3001'));
```

### Lista completă endpoints necesari:

```
UTILAJE
  GET    /api/utilaje                ?status=&categorie_id=&search=
  GET    /api/utilaje/:id            include: responsabil, locatie_baza, categorie, poze
  POST   /api/utilaje
  PUT    /api/utilaje/:id
  DELETE /api/utilaje/:id
  POST   /api/utilaje/:id/poze       multipart/form-data
  DELETE /api/utilaje/:id/poze/:poza_id
  GET    /api/utilaje/:id/fise       toate fișele unui utilaj, cronologic

CATEGORII
  GET    /api/categorii
  POST   /api/categorii
  PUT    /api/categorii/:id
  DELETE /api/categorii/:id

LOCATII
  GET    /api/locatii                ?tip=baza|lucrare
  POST   /api/locatii
  PUT    /api/locatii/:id
  DELETE /api/locatii/:id

LUCRARI
  GET    /api/lucrari                ?status=activa|finalizata
  POST   /api/lucrari
  PUT    /api/lucrari/:id
  DELETE /api/lucrari/:id

PERSOANE
  GET    /api/persoane               ?categorie=angajat|subcontractant
  POST   /api/persoane
  PUT    /api/persoane/:id
  DELETE /api/persoane/:id

PLANIFICARI
  GET    /api/planificari            ?data_start=&data_sfarsit=&categorie_id=&utilaj_id=
  POST   /api/planificari
  PUT    /api/planificari/:id
  DELETE /api/planificari/:id
  POST   /api/planificari/decalare   body: { zile, data_referinta, lucrare_id? }

MOTORINA
  GET    /api/motorina               ?utilaj_id=&lucrare_id=&data_start=&data_sfarsit=
  POST   /api/motorina
  PUT    /api/motorina/:id
  DELETE /api/motorina/:id

PROCESE VERBALE
  GET    /api/pvp                    ?utilaj_id=&status=deschis|inchis
  GET    /api/pvp/:id
  POST   /api/pvp
  PATCH  /api/pvp/:id/primire
  POST   /api/pvp/:id/poze           multipart/form-data  body: etapa=predare|primire
  DELETE /api/pvp/:id

REPARATII
  GET    /api/reparatii              ?utilaj_id=&data_start=&data_sfarsit=
  POST   /api/reparatii
  PUT    /api/reparatii/:id
  DELETE /api/reparatii/:id
  POST   /api/reparatii/:id/factura  multipart
  POST   /api/reparatii/:id/poze     multipart

RAPOARTE
  GET    /api/rapoarte/dashboard
  GET    /api/rapoarte/utilaj/:id    ?luna=YYYY-MM
  GET    /api/rapoarte/lucrare/:id
```

### Exemplu route complet — `routes/utilaje.js`:
```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET toate utilajele cu filtre
router.get('/', (req, res) => {
  const { status, categorie_id, search } = req.query;
  let sql = `
    SELECT u.*, 
           c.nume as categorie_nume, c.culoare as categorie_culoare,
           p.nume as responsabil_nume,
           l.nume as locatie_baza_nume
    FROM utilaje u
    LEFT JOIN categorii c ON u.categorie_id = c.id
    LEFT JOIN persoane p ON u.responsabil_id = p.id
    LEFT JOIN locatii l ON u.locatie_baza_id = l.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND u.status = ?'; params.push(status); }
  if (categorie_id) { sql += ' AND u.categorie_id = ?'; params.push(categorie_id); }
  if (search) {
    sql += ' AND (u.denumire LIKE ? OR u.alias LIKE ? OR u.serie LIKE ? OR u.nr_inventar LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  sql += ' ORDER BY u.denumire';
  res.json(db.prepare(sql).all(...params));
});

// GET detaliu utilaj cu poze
router.get('/:id', (req, res) => {
  const utilaj = db.prepare(`
    SELECT u.*, c.nume as categorie_nume, c.culoare as categorie_culoare,
           p.nume as responsabil_nume, l.nume as locatie_baza_nume, l.adresa as locatie_baza_adresa
    FROM utilaje u
    LEFT JOIN categorii c ON u.categorie_id = c.id
    LEFT JOIN persoane p ON u.responsabil_id = p.id
    LEFT JOIN locatii l ON u.locatie_baza_id = l.id
    WHERE u.id = ?
  `).get(req.params.id);
  if (!utilaj) return res.status(404).json({ error: 'Utilaj negăsit' });
  utilaj.poze = db.prepare('SELECT * FROM utilaje_poze WHERE utilaj_id = ?').all(req.params.id);
  res.json(utilaj);
});

// POST utilaj nou
router.post('/', (req, res) => {
  const { denumire, alias, serie, nr_inventar, responsabil_id, locatie_baza_id,
          producator, proprietate, garantie_exp, data_achizitie, observatii,
          status, categorie_id, chirie_zi } = req.body;
  const result = db.prepare(`
    INSERT INTO utilaje (denumire, alias, serie, nr_inventar, responsabil_id, locatie_baza_id,
      producator, proprietate, garantie_exp, data_achizitie, observatii, status, categorie_id, chirie_zi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(denumire, alias, serie, nr_inventar, responsabil_id, locatie_baza_id,
         producator, proprietate, garantie_exp, data_achizitie, observatii,
         status || 'disponibil', categorie_id, chirie_zi);
  res.json({ id: result.lastInsertRowid });
});

// PUT editare utilaj
router.put('/:id', (req, res) => {
  const fields = ['denumire','alias','serie','nr_inventar','responsabil_id','locatie_baza_id',
                  'producator','proprietate','garantie_exp','data_achizitie','observatii',
                  'status','categorie_id','chirie_zi'];
  const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ');
  const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  db.prepare(`UPDATE utilaje SET ${updates} WHERE id = ?`).run(...values, req.params.id);
  res.json({ ok: true });
});

// DELETE utilaj
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM utilaje WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
```

---

## PLAN DE EXECUȚIE — 8 ZILE

### Ziua 1 — Setup + DB + Seed
```
□ npm create vite@latest fleetops -- --template react
□ npm install express better-sqlite3 cors multer concurrently
□ npm install -D tailwindcss autoprefixer postcss
□ Creare server/db.js cu toate tabelele + seed
□ Creare server/index.js cu Express de bază
□ Verificare că DB se creează și seed-ul funcționează
□ Configurare Tailwind + variabile CSS dark/light mode
□ Componenta Layout.jsx (Sidebar + Topbar) cu navigare funcțională
□ Routing React Router cu placeholder pentru fiecare pagină
```

### Ziua 2 — Entități de bază (Categorii, Locații, Persoane, Lucrări)
```
□ routes/lucrari.js + routes/locatii.js + routes/persoane.js
□ Pagina Lucrari.jsx — tab Lucrări + tab Locații (liste + formulare)
□ Pagina Persoane.jsx — listă + formular adăugare
□ api.js — wrapper simplu pentru fetch cu base URL
□ Componenta Modal.jsx reutilizabilă
□ Componenta Toast.jsx (notificări bottom-right)
```

### Ziua 3 — Modul Utilaje (lista + detaliu)
```
□ routes/utilaje.js complet (CRUD + poze)
□ Setup Multer pentru upload local în /uploads
□ Pagina Utilaje.jsx — grid carduri cu filtre (categorie tabs + status dropdown)
□ Componenta UtilajCard.jsx cu status badge + 3 icon-butoane rapide
□ Panoul lateral UtilajDetailPanel (380px) cu detalii + acțiuni rapide
□ Modal formular adăugare/editare utilaj (toate câmpurile)
□ Componenta UploadZone.jsx pentru poze
□ Search funcțional în topbar (debounce 300ms)
```

### Ziua 4 — Fișe operaționale (Motorină + Reparații)
```
□ routes/motorina.js CRUD complet
□ routes/reparatii.js CRUD + upload factură + poze
□ Pagina Motorina.jsx — tabel cu filtre + modal formular
□ Pagina Reparatii.jsx — tabel cu filtre + modal formular + upload
□ Actualizare automată ore_contor în utilaj la salvare fișă
□ Aceste pagini accesibile și din butoanele rapide ale unui utilaj
```

### Ziua 5 — Procese Verbale
```
□ routes/pvp.js — creare + patch primire + upload poze
□ Pagina ProceseVerbale.jsx — listă cu badge status (DESCHIS/INCHIS)
□ Modal PVP cu 2 taburi: Predare / Primire
□ Tab Primire vizibil doar la editare PV existent deschis
□ Upload poze separate pentru predare și primire
□ Highlight PV-uri deschise (utilaje neîntoarse)
□ Actualizare ore_contor la închidere PV
```

### Ziua 6 — Calendar Gantt
```
□ routes/planificari.js CRUD + endpoint /decalare
□ Pagina Planificare.jsx — Gantt cu 2 săptămâni vizibile
□ Calcul poziții bare: left% și width% din date
□ Navigare luni (‹ ›) + filter chips categorii
□ Click pe bară → editare planificare
□ Click pe zonă liberă → adăugare planificare pre-completată
□ Validare suprapunere utilaj (pe server și mesaj clar pe frontend)
□ Modal DecalareModal cu nr. planificări afectate
□ Buton decalare 1 zi din toolbar
```

### Ziua 7 — Hartă + Dashboard + Rapoarte
```
□ npm install react-leaflet leaflet
□ Pagina Harta.jsx — MapContainer cu Marker per utilaj
□ Culoare marker după status + Popup cu detalii
□ Logică locație curentă: planificare activă sau locație bază
□ routes/rapoarte.js — dashboard + per utilaj + per lucrare
□ Pagina Dashboard.jsx — stat cards + activitate recentă + bare status + banner decalare
□ Pagina Rapoarte.jsx — 4 taburi cu Recharts (BarChart, LineChart)
□ npm install recharts
```

### Ziua 8 — Polish, QA, Demo Data
```
□ Validare toate formularele (câmpuri obligatorii marcate cu *)
□ Error handling — mesaje în română, nu crash
□ Loading spinners pe toate fetch-urile
□ Seed date mai bogate: 10+ utilaje, 5+ lucrări, 30+ fișe
□ Test complet al fiecărui flow de la cap la coadă
□ README.md cu instrucțiuni de instalare și pornire
□ Verificare că totul funcționează pe un laptop fresh (doar Node.js instalat)
```

---

## README INSTALARE (ce primește persoana care rulează demo-ul)

```markdown
# FleetOps — Instalare locală

## Cerințe
- Node.js v18+ (descărcare: https://nodejs.org)
- Git (opțional)

## Pornire
1. Dezarhivează folderul sau clonează repo-ul
2. cd fleetops
3. npm install
4. npm run dev

Aplicația pornește la:
- Frontend: http://localhost:5173
- API:      http://localhost:3001

Prima pornire creează automat baza de date cu date demo.
Datele se salvează în fișierul fleetops.db din folderul proiectului.
```

---

## DEPENDENȚE COMPLETE (`package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    "express": "^4.19.0",
    "better-sqlite3": "^9.6.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5",
    "concurrently": "^8.2.0",
    "recharts": "^2.12.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Total dependențe: 14 pachete.** Zero cloud, zero API keys externe, zero configurare complexă.

---

## NOTE PENTRU CODING AGENT

1. **Fișierele uploadate** se salvează în `/uploads/utilaje/:id/`, `/uploads/reparatii/:id/`, etc. URL-ul salvat în DB este `/uploads/...` (relativ), servit de Express ca static.

2. **Harta folosește Leaflet + OpenStreetMap** — tile-urile se încarcă din internet la prima utilizare, dar funcționează fără API key. Dacă vrei complet offline, există și tile-uri locale dar e overkill pentru demo.

3. **SQLite better-sqlite3 este sincron** — toate query-urile se fac fără async/await, codul este mai simplu. Nu e o problemă pentru o aplicație mono-user locală.

4. **Nu există autentificare** — toate rutele sunt publice. Aplicația e gândită pentru un singur utilizator sau echipă mică pe rețea locală.

5. **Baza de date** (`fleetops.db`) se poate copia/backup direct ca fișier. E portabilă.

6. **Vite proxy** — pentru a evita CORS în development, adaugă în `vite.config.js`:
   ```javascript
   server: { proxy: { '/api': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } }
   ```
   Astfel în frontend poți face `fetch('/api/utilaje')` fără să specifici portul.

7. **Gantt-ul** se poate implementa cu CSS positioning pur (fără librărie Gantt dedicată) — calculul e simplu: `left = (startDay - firstVisibleDay) / totalDays * 100%`. Nu e nevoie de o librărie separată.

8. **Toate textele în română** — label-uri, placeholder-e, mesaje de eroare, notificări.

9. **Dark/Light mode** — toggle în topbar, preferința salvată în `localStorage`. Implementat prin clasa `dark` pe `<html>` + Tailwind `dark:` prefix.
```
