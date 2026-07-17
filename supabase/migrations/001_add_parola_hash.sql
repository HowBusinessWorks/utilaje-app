-- Autentificare: coloana pentru parola (hash) sefilor de santier.
-- Ruleaza in Supabase -> SQL Editor.
ALTER TABLE persoane ADD COLUMN IF NOT EXISTS parola_hash TEXT;
