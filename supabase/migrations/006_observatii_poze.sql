-- Poze atasate unei observatii, facute de seful de santier direct din camera
-- sau incarcate din galerie. Stocate in baza de date, encodate base64.
-- Ruleaza in Supabase -> SQL Editor (dupa 005_observatii_admin.sql).

CREATE TABLE IF NOT EXISTS observatii_poze (
  id SERIAL PRIMARY KEY,
  observatie_id INTEGER REFERENCES observatii(id) ON DELETE CASCADE NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observatii_poze_observatie ON observatii_poze(observatie_id);

-- Recreeaza view-ul ca sa includa numarul de poze (fara sa incarce continutul base64).
DROP VIEW IF EXISTS v_observatii;
CREATE VIEW v_observatii AS
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
