-- =============================================
-- FleetOps — Supabase / PostgreSQL Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- TABLES

CREATE TABLE IF NOT EXISTS categorii (
  id SERIAL PRIMARY KEY,
  nume TEXT NOT NULL UNIQUE,
  culoare TEXT DEFAULT '#5b8af0'
);

CREATE TABLE IF NOT EXISTS locatii (
  id SERIAL PRIMARY KEY,
  nume TEXT NOT NULL,
  adresa TEXT,
  lat REAL,
  lng REAL,
  tip TEXT DEFAULT 'lucrare'
);

CREATE TABLE IF NOT EXISTS lucrari (
  id SERIAL PRIMARY KEY,
  nume TEXT NOT NULL,
  locatie_id INTEGER REFERENCES locatii(id),
  data_start TEXT,
  data_sfarsit TEXT,
  status TEXT DEFAULT 'activa'
);

CREATE TABLE IF NOT EXISTS persoane (
  id SERIAL PRIMARY KEY,
  nume TEXT NOT NULL,
  telefon TEXT,
  categorie TEXT NOT NULL,
  parola_hash TEXT
);

CREATE TABLE IF NOT EXISTS utilaje (
  id SERIAL PRIMARY KEY,
  denumire TEXT NOT NULL,
  alias TEXT,
  serie TEXT,
  nr_inventar TEXT,
  responsabil_id INTEGER REFERENCES persoane(id),
  locatie_baza_id INTEGER REFERENCES locatii(id),
  producator TEXT,
  proprietate TEXT DEFAULT 'propriu',
  garantie_exp TEXT,
  data_achizitie TEXT,
  observatii TEXT,
  status TEXT DEFAULT 'disponibil',
  categorie_id INTEGER REFERENCES categorii(id),
  chirie_zi REAL,
  ore_contor INTEGER DEFAULT 0,
  thumbnail_url TEXT
);

CREATE TABLE IF NOT EXISTS utilaje_poze (
  id SERIAL PRIMARY KEY,
  utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS planificari (
  id SERIAL PRIMARY KEY,
  utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
  lucrare_id INTEGER REFERENCES lucrari(id),
  persoana_id INTEGER REFERENCES persoane(id),
  data_start TEXT NOT NULL,
  data_sfarsit TEXT NOT NULL,
  observatii TEXT,
  culoare TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitari (
  id SERIAL PRIMARY KEY,
  solicitant_id INTEGER REFERENCES persoane(id),
  categorie_id INTEGER REFERENCES categorii(id),
  lucrare_id INTEGER REFERENCES lucrari(id),
  nota TEXT,
  data_start TEXT NOT NULL,
  data_sfarsit TEXT NOT NULL,
  subcontractanti_ids INTEGER[] DEFAULT '{}',
  status TEXT DEFAULT 'noua',            -- noua | acceptata | respinsa
  utilaj_id INTEGER REFERENCES utilaje(id),
  planificare_id INTEGER REFERENCES planificari(id) ON DELETE SET NULL,
  motiv_respingere TEXT,
  seen_admin BOOLEAN DEFAULT false,
  seen_solicitant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fise_motorina (
  id SERIAL PRIMARY KEY,
  utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
  lucrare_id INTEGER REFERENCES lucrari(id),
  persoana_id INTEGER REFERENCES persoane(id),
  data_consum TEXT NOT NULL,
  nr_litri REAL NOT NULL,
  furnizor TEXT,
  ore_contor INTEGER,
  observatii TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procese_verbale (
  id SERIAL PRIMARY KEY,
  utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
  lucrare_id INTEGER REFERENCES lucrari(id),
  data_predare TEXT,
  persoana_primire_id INTEGER REFERENCES persoane(id),
  persoana_primire_text TEXT,
  responsabil_predare TEXT,
  ore_contor_predare INTEGER,
  motorina_predare REAL,
  stare_predare TEXT,
  observatii_predare TEXT,
  semnatura_predare TEXT,
  data_primire TEXT,
  responsabil_primire TEXT,
  ore_contor_primire INTEGER,
  motorina_primire REAL,
  stare_primire TEXT,
  observatii_primire TEXT,
  probleme_constatate TEXT,
  semnatura_primire TEXT,
  status TEXT DEFAULT 'deschis',
  sef_santier_id INTEGER REFERENCES persoane(id),
  subcontractant_id INTEGER REFERENCES persoane(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pv_poze (
  id SERIAL PRIMARY KEY,
  pv_id INTEGER REFERENCES procese_verbale(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  etapa TEXT
);

CREATE TABLE IF NOT EXISTS utilaj_accesorii (
  id SERIAL PRIMARY KEY,
  utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE,
  denumire TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pv_accesorii (
  id SERIAL PRIMARY KEY,
  pv_id INTEGER REFERENCES procese_verbale(id) ON DELETE CASCADE,
  denumire TEXT NOT NULL,
  predat INTEGER DEFAULT 0,
  primit INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fise_reparatii (
  id SERIAL PRIMARY KEY,
  utilaj_id INTEGER REFERENCES utilaje(id) ON DELETE CASCADE NOT NULL,
  data_reparatie TEXT NOT NULL,
  furnizor TEXT NOT NULL,
  descriere TEXT NOT NULL,
  cost_total REAL NOT NULL,
  ore_contor INTEGER,
  durata_zile INTEGER,
  factura_url TEXT,
  observatii TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reparatii_poze (
  id SERIAL PRIMARY KEY,
  reparatie_id INTEGER REFERENCES fise_reparatii(id) ON DELETE CASCADE,
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS observatii (
  id SERIAL PRIMARY KEY,
  pv_id INTEGER REFERENCES procese_verbale(id) ON DELETE CASCADE NOT NULL,
  utilaj_id INTEGER REFERENCES utilaje(id),
  persoana_id INTEGER REFERENCES persoane(id),
  tip TEXT,                       -- defectiune | avarie | intretinere | combustibil | alta
  mesaj TEXT NOT NULL,
  status TEXT DEFAULT 'noua',     -- noua | vazuta | rezolvata
  seen_admin BOOLEAN DEFAULT false,
  raspuns_admin TEXT,
  reparatie_id INTEGER REFERENCES fise_reparatii(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observatii_poze (
  id SERIAL PRIMARY KEY,
  observatie_id INTEGER REFERENCES observatii(id) ON DELETE CASCADE NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VIEWS — flat joins used by API list queries
-- =============================================

CREATE OR REPLACE VIEW v_utilaje AS
SELECT u.*,
  c.nume AS categorie_nume, c.culoare AS categorie_culoare,
  p.nume AS responsabil_nume,
  l.nume AS locatie_baza_nume
FROM utilaje u
LEFT JOIN categorii c ON u.categorie_id = c.id
LEFT JOIN persoane p ON u.responsabil_id = p.id
LEFT JOIN locatii l ON u.locatie_baza_id = l.id;

CREATE OR REPLACE VIEW v_utilaje_detaliu AS
SELECT u.*,
  c.nume AS categorie_nume, c.culoare AS categorie_culoare,
  p.nume AS responsabil_nume,
  l.nume AS locatie_baza_nume, l.adresa AS locatie_baza_adresa
FROM utilaje u
LEFT JOIN categorii c ON u.categorie_id = c.id
LEFT JOIN persoane p ON u.responsabil_id = p.id
LEFT JOIN locatii l ON u.locatie_baza_id = l.id;

CREATE OR REPLACE VIEW v_planificari AS
SELECT p.*,
  u.denumire AS utilaj_denumire, u.alias AS utilaj_alias,
  c.culoare AS categorie_culoare, c.nume AS categorie_nume,
  l.nume AS lucrare_nume, l.locatie_id AS lucrare_locatie_id,
  per.nume AS persoana_nume
FROM planificari p
LEFT JOIN utilaje u ON p.utilaj_id = u.id
LEFT JOIN categorii c ON u.categorie_id = c.id
LEFT JOIN lucrari l ON p.lucrare_id = l.id
LEFT JOIN persoane per ON p.persoana_id = per.id;

CREATE OR REPLACE VIEW v_solicitari AS
SELECT s.*,
  c.nume AS categorie_nume, c.culoare AS categorie_culoare,
  l.nume AS lucrare_nume,
  per.nume AS solicitant_nume, per.telefon AS solicitant_telefon,
  u.denumire AS utilaj_denumire, u.alias AS utilaj_alias,
  (SELECT COALESCE(array_agg(pp.nume ORDER BY pp.nume), '{}')
     FROM persoane pp WHERE pp.id = ANY(s.subcontractanti_ids)) AS subcontractanti_nume
FROM solicitari s
LEFT JOIN categorii c ON s.categorie_id = c.id
LEFT JOIN lucrari l ON s.lucrare_id = l.id
LEFT JOIN persoane per ON s.solicitant_id = per.id
LEFT JOIN utilaje u ON s.utilaj_id = u.id;

CREATE OR REPLACE VIEW v_motorina AS
SELECT fm.*,
  u.denumire AS utilaj_denumire, u.alias AS utilaj_alias,
  l.nume AS lucrare_nume,
  p.nume AS persoana_nume
FROM fise_motorina fm
LEFT JOIN utilaje u ON fm.utilaj_id = u.id
LEFT JOIN lucrari l ON fm.lucrare_id = l.id
LEFT JOIN persoane p ON fm.persoana_id = p.id;

CREATE OR REPLACE VIEW v_pvp AS
SELECT pv.*,
  u.denumire AS utilaj_denumire, u.alias AS utilaj_alias,
  l.nume AS lucrare_nume,
  COALESCE(pv.persoana_primire_text, per.nume) AS persoana_primire_display,
  sef.nume AS sef_santier_nume,
  sub.nume AS subcontractant_nume
FROM procese_verbale pv
LEFT JOIN utilaje u ON pv.utilaj_id = u.id
LEFT JOIN lucrari l ON pv.lucrare_id = l.id
LEFT JOIN persoane per ON pv.persoana_primire_id = per.id
LEFT JOIN persoane sef ON pv.sef_santier_id = sef.id
LEFT JOIN persoane sub ON pv.subcontractant_id = sub.id;

CREATE OR REPLACE VIEW v_lucrari AS
SELECT l.*, loc.nume AS locatie_nume, loc.adresa AS locatie_adresa
FROM lucrari l
LEFT JOIN locatii loc ON l.locatie_id = loc.id;

CREATE OR REPLACE VIEW v_reparatii AS
SELECT fr.*, u.denumire AS utilaj_denumire, u.alias AS utilaj_alias
FROM fise_reparatii fr
LEFT JOIN utilaje u ON fr.utilaj_id = u.id;

CREATE OR REPLACE VIEW v_observatii AS
SELECT o.*,
  u.denumire AS utilaj_denumire, u.alias AS utilaj_alias,
  pv.status AS pv_status, pv.lucrare_id,
  l.nume AS lucrare_nume,
  p.nume AS persoana_nume,
  COALESCE(pz.poze_count, 0) AS poze_count
FROM observatii o
LEFT JOIN utilaje u ON o.utilaj_id = u.id
LEFT JOIN procese_verbale pv ON o.pv_id = pv.id
LEFT JOIN lucrari l ON pv.lucrare_id = l.id
LEFT JOIN persoane p ON o.persoana_id = p.id
LEFT JOIN (
  SELECT observatie_id, COUNT(*) AS poze_count
  FROM observatii_poze GROUP BY observatie_id
) pz ON pz.observatie_id = o.id;

-- =============================================
-- FUNCTIONS — complex queries via rpc()
-- =============================================

-- Helper: update ore_contor using GREATEST
CREATE OR REPLACE FUNCTION update_ore_contor(p_utilaj_id INTEGER, p_ore INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE utilaje SET ore_contor = GREATEST(ore_contor, p_ore) WHERE id = p_utilaj_id;
END;
$$;

-- Dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'utilaje', json_build_object(
      'total',       (SELECT COUNT(*) FROM utilaje),
      'disponibile', (SELECT COUNT(*) FROM utilaje WHERE status = 'disponibil'),
      'inService',   (SELECT COUNT(*) FROM utilaje WHERE status = 'service'),
      'indisponibile',(SELECT COUNT(*) FROM utilaje WHERE status = 'indisponibil'),
      'casate',      (SELECT COUNT(*) FROM utilaje WHERE status = 'casat')
    ),
    'lucrari', json_build_object(
      'active', (SELECT COUNT(*) FROM lucrari WHERE status = 'activa')
    ),
    'pvDeschise', (SELECT COUNT(*) FROM procese_verbale WHERE status = 'deschis'),
    'consumLuna', COALESCE((
      SELECT SUM(nr_litri) FROM fise_motorina
      WHERE TO_CHAR(data_consum::date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ), 0),
    'costuriReparatiiLuna', COALESCE((
      SELECT SUM(cost_total) FROM fise_reparatii
      WHERE TO_CHAR(data_reparatie::date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ), 0),
    'byCategorie', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT c.nume, c.culoare,
               COUNT(u.id) AS total,
               SUM(CASE WHEN u.status = 'disponibil' THEN 1 ELSE 0 END) AS disponibile
        FROM categorii c LEFT JOIN utilaje u ON u.categorie_id = c.id
        GROUP BY c.id, c.nume, c.culoare ORDER BY total DESC
      ) t
    ),
    'activitateMotorina', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT luna, litri FROM (
          SELECT TO_CHAR(data_consum::date, 'YYYY-MM') AS luna, SUM(nr_litri) AS litri
          FROM fise_motorina GROUP BY luna ORDER BY luna DESC LIMIT 6
        ) sub ORDER BY luna ASC
      ) t
    ),
    'planificariActive', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.*, u.denumire AS utilaj_denumire, u.alias AS utilaj_alias, l.nume AS lucrare_nume
        FROM planificari p
        LEFT JOIN utilaje u ON p.utilaj_id = u.id
        LEFT JOIN lucrari l ON p.lucrare_id = l.id
        WHERE p.data_sfarsit >= CURRENT_DATE::text
          AND p.data_start <= (CURRENT_DATE + INTERVAL '14 days')::text
        ORDER BY p.data_start LIMIT 10
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Per-utilaj report
CREATE OR REPLACE FUNCTION get_raport_utilaj(p_id INTEGER, p_luna TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_utilaj  RECORD;
  v_mot     JSON;
  v_rep     JSON;
  v_act     JSON;
BEGIN
  SELECT * INTO v_utilaj FROM utilaje WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF p_luna IS NOT NULL THEN
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY (t).data_consum), '[]'::json) INTO v_mot
    FROM (SELECT * FROM fise_motorina WHERE utilaj_id = p_id AND TO_CHAR(data_consum::date, 'YYYY-MM') = p_luna) t;
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY (t).data_reparatie), '[]'::json) INTO v_rep
    FROM (SELECT * FROM fise_reparatii WHERE utilaj_id = p_id AND TO_CHAR(data_reparatie::date, 'YYYY-MM') = p_luna) t;
  ELSE
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_mot
    FROM (SELECT * FROM fise_motorina WHERE utilaj_id = p_id ORDER BY data_consum DESC LIMIT 20) t;
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_rep
    FROM (SELECT * FROM fise_reparatii WHERE utilaj_id = p_id ORDER BY data_reparatie DESC LIMIT 20) t;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY (t).luna ASC), '[]'::json) INTO v_act
  FROM (
    SELECT
      TO_CHAR(pv.data_predare::date, 'YYYY-MM') AS luna,
      COALESCE(SUM(CASE
        WHEN pv.ore_contor_primire IS NOT NULL AND pv.ore_contor_predare IS NOT NULL
             AND pv.ore_contor_primire > pv.ore_contor_predare
        THEN pv.ore_contor_primire - pv.ore_contor_predare ELSE 0 END), 0)::INTEGER AS ore_lucrate,
      COALESCE(SUM(CASE
        WHEN pv.data_primire IS NOT NULL
        THEN (pv.data_primire::date - pv.data_predare::date + 1) ELSE 0 END), 0)::INTEGER AS zile_lucrate,
      COUNT(*) AS nr_pv
    FROM procese_verbale pv
    WHERE pv.utilaj_id = p_id AND pv.status = 'inchis' AND pv.data_predare IS NOT NULL
    GROUP BY luna ORDER BY luna DESC LIMIT 12
  ) t;

  RETURN json_build_object(
    'utilaj', row_to_json(v_utilaj),
    'motorina', v_mot,
    'reparatii', v_rep,
    'activitateLunara', v_act
  );
END;
$$;

-- Per-lucrare report
CREATE OR REPLACE FUNCTION get_raport_lucrare(p_id INTEGER)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_lucrare RECORD;
  result    JSON;
BEGIN
  SELECT * INTO v_lucrare FROM lucrari WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT json_build_object(
    'lucrare', row_to_json(v_lucrare),
    'planificari', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.*, u.denumire AS utilaj_denumire, u.alias AS utilaj_alias
        FROM planificari p LEFT JOIN utilaje u ON p.utilaj_id = u.id
        WHERE p.lucrare_id = p_id ORDER BY p.data_start
      ) t
    ),
    'motorina', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT fm.*, u.denumire AS utilaj_denumire
        FROM fise_motorina fm LEFT JOIN utilaje u ON fm.utilaj_id = u.id
        WHERE fm.lucrare_id = p_id ORDER BY fm.data_consum DESC
      ) t
    ),
    'totalLitri', COALESCE((SELECT SUM(nr_litri) FROM fise_motorina WHERE lucrare_id = p_id), 0),
    'orePerUtilaj', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          u.alias AS utilaj_alias, u.denumire AS utilaj_denumire,
          COALESCE(SUM(CASE
            WHEN pv.ore_contor_primire IS NOT NULL AND pv.ore_contor_predare IS NOT NULL
                 AND pv.ore_contor_primire > pv.ore_contor_predare
            THEN pv.ore_contor_primire - pv.ore_contor_predare ELSE 0 END), 0)::INTEGER AS ore_lucrate,
          COALESCE(SUM(CASE
            WHEN pv.data_primire IS NOT NULL
            THEN (pv.data_primire::date - pv.data_predare::date + 1) ELSE 0 END), 0)::INTEGER AS zile_lucrate,
          COUNT(*) AS nr_pv
        FROM procese_verbale pv
        LEFT JOIN utilaje u ON pv.utilaj_id = u.id
        WHERE pv.lucrare_id = p_id AND pv.status = 'inchis'
        GROUP BY u.id, u.alias, u.denumire
        ORDER BY ore_lucrate DESC, zile_lucrate DESC
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Bulk date-shift planificari
CREATE OR REPLACE FUNCTION decaleaza_planificari(
  p_zile INTEGER,
  p_data_referinta TEXT,
  p_utilaj_ids INTEGER[] DEFAULT NULL
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE affected INTEGER;
BEGIN
  IF p_utilaj_ids IS NOT NULL AND array_length(p_utilaj_ids, 1) > 0 THEN
    UPDATE planificari SET
      data_start   = (data_start::date   + p_zile * INTERVAL '1 day')::date::text,
      data_sfarsit = (data_sfarsit::date + p_zile * INTERVAL '1 day')::date::text
    WHERE data_start >= p_data_referinta AND utilaj_id = ANY(p_utilaj_ids);
  ELSE
    UPDATE planificari SET
      data_start   = (data_start::date   + p_zile * INTERVAL '1 day')::date::text,
      data_sfarsit = (data_sfarsit::date + p_zile * INTERVAL '1 day')::date::text
    WHERE data_start >= p_data_referinta;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
