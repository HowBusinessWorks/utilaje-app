const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { requireAdmin } = require('../auth');

// Un sef de santier poate lasa observatii doar pentru un PV deschis pe numele lui.
async function loadPv(pv_id) {
  const { data } = await supabase.from('procese_verbale')
    .select('id, utilaj_id, status, sef_santier_id').eq('id', pv_id).maybeSingle();
  return data;
}

async function loadObservatie(id) {
  const { data } = await supabase.from('observatii').select('*').eq('id', id).maybeSingle();
  return data;
}

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_observatii').select('*').order('created_at', { ascending: false });
    const { pv_id, utilaj_id, status } = req.query;
    if (pv_id)     query = query.eq('pv_id', pv_id);
    if (utilaj_id) query = query.eq('utilaj_id', utilaj_id);
    if (status)    query = query.eq('status', status);
    if (req.user.role !== 'admin') query = query.eq('persoana_id', req.user.id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /count — badge inbox admin: observatii noi nevazute.
router.get('/count', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.json({ count: 0 });
    const { count, error } = await supabase.from('observatii')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'noua').eq('seen_admin', false);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /mark-seen — adminul a deschis inbox-ul: sting badge-ul (nu schimba status).
router.post('/mark-seen', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('observatii')
      .update({ seen_admin: true }).eq('status', 'noua').eq('seen_admin', false);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { pv_id, tip, mesaj } = req.body;
    if (!pv_id) return res.status(400).json({ error: 'Selecteaza un proces verbal.' });
    if (!mesaj || !mesaj.trim()) return res.status(400).json({ error: 'Scrie un mesaj cu ce s-a intamplat.' });
    const pv = await loadPv(pv_id);
    if (!pv) return res.status(404).json({ error: 'Proces verbal negasit.' });
    if (req.user.role !== 'admin') {
      if (pv.sef_santier_id !== req.user.id) return res.status(403).json({ error: 'Acces interzis.' });
      if (pv.status !== 'deschis') return res.status(400).json({ error: 'Procesul verbal este inchis.' });
    }
    const { data, error } = await supabase.from('observatii')
      .insert({
        pv_id,
        utilaj_id: pv.utilaj_id,
        persoana_id: req.user.role !== 'admin' ? req.user.id : null,
        tip: tip || null,
        mesaj: mesaj.trim(),
      })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    const { tip, mesaj } = req.body;
    if (!mesaj || !mesaj.trim()) return res.status(400).json({ error: 'Scrie un mesaj cu ce s-a intamplat.' });
    const { error } = await supabase.from('observatii')
      .update({ tip: tip || null, mesaj: mesaj.trim() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    const { error } = await supabase.from('observatii').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// Actiuni admin
// ------------------------------------------------------------------

// POST /:id/vazut — il anunta pe sef ca observatia a fost vazuta de birou.
router.post('/:id/vazut', requireAdmin, async (req, res) => {
  try {
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    const update = { seen_admin: true, reviewed_at: new Date().toISOString() };
    if (obs.status === 'noua') update.status = 'vazuta';
    const { error } = await supabase.from('observatii').update(update).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /:id/raspuns — trimite sefului un mesaj cu ce sa faca.
router.post('/:id/raspuns', requireAdmin, async (req, res) => {
  try {
    const { mesaj } = req.body;
    if (!mesaj || !mesaj.trim()) return res.status(400).json({ error: 'Scrie un mesaj pentru seful de santier.' });
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    const update = {
      raspuns_admin: mesaj.trim(),
      seen_admin: true,
      reviewed_at: new Date().toISOString(),
    };
    if (obs.status === 'noua') update.status = 'vazuta';
    const { error } = await supabase.from('observatii').update(update).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /:id/rezolva — marcheaza observatia ca rezolvata si o leaga de reparatia creata.
router.post('/:id/rezolva', requireAdmin, async (req, res) => {
  try {
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    const { error } = await supabase.from('observatii').update({
      status: 'rezolvata',
      reparatie_id: req.body.reparatie_id || null,
      seen_admin: true,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
