const express = require('express');
const router = express.Router();
const supabase = require('../db');

// CATEGORII
router.get('/categorii', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categorii').select('*').order('nume');
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/categorii', async (req, res) => {
  try {
    const { nume, culoare } = req.body;
    const { data, error } = await supabase.from('categorii')
      .insert({ nume, culoare: culoare || '#5b8af0' })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/categorii/:id', async (req, res) => {
  try {
    const { nume, culoare } = req.body;
    const { error } = await supabase.from('categorii')
      .update({ nume, culoare })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/categorii/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('categorii').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOCATII
router.get('/locatii', async (req, res) => {
  try {
    let query = supabase.from('locatii').select('*').order('nume');
    if (req.query.tip) query = query.eq('tip', req.query.tip);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/locatii', async (req, res) => {
  try {
    const { nume, adresa, lat, lng, tip } = req.body;
    const { data, error } = await supabase.from('locatii')
      .insert({ nume, adresa: adresa || null, lat: lat || null, lng: lng || null, tip: tip || 'lucrare' })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/locatii/:id', async (req, res) => {
  try {
    const { nume, adresa, lat, lng, tip } = req.body;
    const { error } = await supabase.from('locatii')
      .update({ nume, adresa: adresa || null, lat: lat || null, lng: lng || null, tip: tip || 'lucrare' })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/locatii/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('locatii').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LUCRARI
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_lucrari').select('*').order('data_start', { ascending: false });
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nume, locatie_id, data_start, data_sfarsit, status } = req.body;
    const { data, error } = await supabase.from('lucrari')
      .insert({ nume, locatie_id: locatie_id || null, data_start: data_start || null, data_sfarsit: data_sfarsit || null, status: status || 'activa' })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nume, locatie_id, data_start, data_sfarsit, status } = req.body;
    const { error } = await supabase.from('lucrari')
      .update({ nume, locatie_id: locatie_id || null, data_start: data_start || null, data_sfarsit: data_sfarsit || null, status: status || 'activa' })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('lucrari').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
