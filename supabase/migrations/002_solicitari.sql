-- Solicitari utilaje trimise de sefii de santier catre admin.
-- Ruleaza in Supabase -> SQL Editor.

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
  utilaj_id INTEGER REFERENCES utilaje(id),        -- utilajul concret alocat la acceptare
  planificare_id INTEGER REFERENCES planificari(id) ON DELETE SET NULL,
  motiv_respingere TEXT,
  seen_admin BOOLEAN DEFAULT false,      -- adminul a vazut solicitarea noua
  seen_solicitant BOOLEAN DEFAULT true,  -- seful a vazut raspunsul (false cand se schimba statusul)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solicitari_status ON solicitari(status);
CREATE INDEX IF NOT EXISTS idx_solicitari_solicitant ON solicitari(solicitant_id);

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
