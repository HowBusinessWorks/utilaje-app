-- Procese verbale: coloane pentru sef de santier / subcontractant mentionati,
-- si actualizare view cu numele lor (folosit de pagina "Procese verbale" a sefului).
-- Ruleaza in Supabase -> SQL Editor.

ALTER TABLE procese_verbale ADD COLUMN IF NOT EXISTS sef_santier_id INTEGER REFERENCES persoane(id);
ALTER TABLE procese_verbale ADD COLUMN IF NOT EXISTS subcontractant_id INTEGER REFERENCES persoane(id);

CREATE INDEX IF NOT EXISTS idx_pv_sef_santier ON procese_verbale(sef_santier_id);

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
