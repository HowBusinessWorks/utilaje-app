const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('preturi_motorina')
      .select('*')
      .eq('data', today)
      .maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/extern', async (req, res) => {
  try {
    const resp = await fetch('https://pretcarburant.ro/api/v1/preturi/minime', {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) throw new Error('Serviciul extern de preturi nu raspunde');
    const json = await resp.json();
    const motorina = json?.preturi?.motorina_standard;
    if (!motorina?.mediu) throw new Error('Raspuns extern invalid');
    res.json({ pret_per_litru: motorina.mediu, data: json.data, sursa: 'pretcarburant.ro' });
  } catch (e) {
    res.status(502).json({ error: e.message || 'Nu s-a putut prelua pretul din API' });
  }
});

router.get('/:date', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('preturi_motorina')
      .select('*')
      .eq('data', req.params.date)
      .maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { data: date, pret_per_litru } = req.body;
    if (!date || !pret_per_litru) return res.status(400).json({ error: 'data si pret_per_litru sunt obligatorii' });
    const { data, error } = await supabase
      .from('preturi_motorina')
      .upsert({ data: date, pret_per_litru }, { onConflict: 'data' })
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
