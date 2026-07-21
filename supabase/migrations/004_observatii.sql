-- Observatii: raportari facute de seful de santier in timpul folosirii unui utilaj.
-- Se pot inregistra doar pe baza unui proces verbal deja deschis pe numele lui.
-- Ruleaza in Supabase -> SQL Editor.

CREATE TABLE IF NOT EXISTS observatii (
  id SERIAL PRIMARY KEY,
  pv_id INTEGER REFERENCES procese_verbale(id) ON DELETE CASCADE NOT NULL,
  utilaj_id INTEGER REFERENCES utilaje(id),
  persoana_id INTEGER REFERENCES persoane(id),
  tip TEXT,                       -- defectiune | avarie | intretinere | combustibil | alta
  mesaj TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observatii_pv ON observatii(pv_id);
CREATE INDEX IF NOT EXISTS idx_observatii_persoana ON observatii(persoana_id);

CREATE OR REPLACE VIEW v_observatii AS
SELECT o.*,
  u.denumire AS utilaj_denumire, u.alias AS utilaj_alias,
  pv.status AS pv_status, pv.lucrare_id,
  l.nume AS lucrare_nume,
  p.nume AS persoana_nume
FROM observatii o
LEFT JOIN utilaje u ON o.utilaj_id = u.id
LEFT JOIN procese_verbale pv ON o.pv_id = pv.id
LEFT JOIN lucrari l ON pv.lucrare_id = l.id
LEFT JOIN persoane p ON o.persoana_id = p.id;
