const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_planificari').select('*').order('data_start');
    const { data_start, data_sfarsit, utilaj_id, categorie_id } = req.query;
    if (data_start)   query = query.gte('data_sfarsit', data_start);
    if (data_sfarsit) query = query.lte('data_start', data_sfarsit);
    if (utilaj_id)    query = query.eq('utilaj_id', utilaj_id);
    if (categorie_id) query = query.eq('categorie_id', categorie_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { utilaj_id, lucrare_id, persoana_id, data_start, data_sfarsit, observatii } = req.body;
    const { data: overlap } = await supabase.from('planificari').select('id')
      .eq('utilaj_id', utilaj_id).lte('data_start', data_sfarsit).gte('data_sfarsit', data_start);
    if (overlap && overlap.length > 0) {
      return res.status(409).json({ error: 'Utilajul are deja o planificare in aceasta perioada' });
    }
    const { data, error } = await supabase.from('planificari')
      .insert({ utilaj_id, lucrare_id: lucrare_id || null, persoana_id: persoana_id || null,
                data_start, data_sfarsit, observatii: observatii || null })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { utilaj_id, lucrare_id, persoana_id, data_start, data_sfarsit, observatii } = req.body;
    const { data: overlap } = await supabase.from('planificari').select('id')
      .eq('utilaj_id', utilaj_id).neq('id', req.params.id)
      .lte('data_start', data_sfarsit).gte('data_sfarsit', data_start);
    if (overlap && overlap.length > 0) {
      return res.status(409).json({ error: 'Utilajul are deja o planificare in aceasta perioada' });
    }
    const { error } = await supabase.from('planificari')
      .update({ utilaj_id, lucrare_id: lucrare_id || null, persoana_id: persoana_id || null,
                data_start, data_sfarsit, observatii: observatii || null })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('planificari').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/decalare', async (req, res) => {
  try {
    const { zile, data_referinta, utilaj_ids } = req.body;
    const zileInt = parseInt(zile);
    if (isNaN(zileInt) || zileInt === 0) return res.status(400).json({ error: 'Numar de zile invalid' });
    const { data: afectate, error } = await supabase.rpc('decaleaza_planificari', {
      p_zile: zileInt,
      p_data_referinta: data_referinta,
      p_utilaj_ids: utilaj_ids && utilaj_ids.length > 0 ? utilaj_ids : null,
    });
    if (error) throw error;
    res.json({ afectate });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
