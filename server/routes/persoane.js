const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { hashPassword } = require('../auth');

// Coloane publice (fara parola_hash). Adaugam un flag are_cont.
const SELECT_COLS = 'id, nume, telefon, categorie, parola_hash';
const strip = (p) => {
  const { parola_hash, ...rest } = p;
  return { ...rest, are_cont: !!parola_hash };
};

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('persoane').select(SELECT_COLS).order('nume');
    if (req.query.categorie) query = query.eq('categorie', req.query.categorie);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data.map(strip));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nume, telefon, categorie, parola } = req.body;
    const row = { nume, telefon: telefon || null, categorie };
    if (parola) row.parola_hash = hashPassword(parola);
    const { data, error } = await supabase.from('persoane')
      .insert(row)
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nume, telefon, categorie, parola } = req.body;
    const row = { nume, telefon: telefon || null, categorie };
    // Actualizam parola doar daca a fost introdusa una noua
    if (parola) row.parola_hash = hashPassword(parola);
    const { error } = await supabase.from('persoane')
      .update(row)
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('persoane').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
