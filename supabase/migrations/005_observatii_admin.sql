-- Observatii — flux admin: status, marcare ca vazut, raspuns (mesaj catre sef)
-- si legatura cu o reparatie creata din observatie.
-- Ruleaza in Supabase -> SQL Editor (dupa 004_observatii.sql).

ALTER TABLE observatii ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'noua';   -- noua | vazuta | rezolvata
ALTER TABLE observatii ADD COLUMN IF NOT EXISTS seen_admin BOOLEAN DEFAULT false;
ALTER TABLE observatii ADD COLUMN IF NOT EXISTS raspuns_admin TEXT;
ALTER TABLE observatii ADD COLUMN IF NOT EXISTS reparatie_id INTEGER REFERENCES fise_reparatii(id) ON DELETE SET NULL;
ALTER TABLE observatii ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_observatii_status ON observatii(status);

-- Backfill pentru observatiile create inainte de aceasta migrare.
UPDATE observatii SET status = 'noua' WHERE status IS NULL;
UPDATE observatii SET seen_admin = false WHERE seen_admin IS NULL;

-- Recreeaza view-ul ca sa includa noile coloane. Folosim DROP + CREATE pentru ca
-- `CREATE OR REPLACE VIEW` nu permite schimbarea ordinii coloanelor, iar noile
-- coloane din observatii se insereaza in mijlocul expansiunii `o.*`.
DROP VIEW IF EXISTS v_observatii;
CREATE VIEW v_observatii AS
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
