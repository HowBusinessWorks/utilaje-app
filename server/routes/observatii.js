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

const MAX_POZE = 5;
const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9+.-]+);base64,([a-zA-Z0-9+/=]+)$/;

// Insereaza pozele (data URL-uri base64) trimise pentru o observatie.
async function insertPoze(observatie_id, poze) {
  if (!Array.isArray(poze) || poze.length === 0) return;
  const rows = poze.slice(0, MAX_POZE).map(p => {
    const match = typeof p === 'string' ? DATA_URL_RE.exec(p) : null;
    return match ? { observatie_id, mime_type: match[1], data_base64: match[2] } : null;
  }).filter(Boolean);
  if (rows.length === 0) return;
  const { error } = await supabase.from('observatii_poze').insert(rows);
  if (error) throw error;
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
    const { pv_id, tip, mesaj, poze } = req.body;
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
    await insertPoze(data.id, poze);
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

// GET /:id/poze — pozele atasate unei observatii (incarcate la cerere, nu in lista).
router.get('/:id/poze', async (req, res) => {
  try {
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    if (req.user.role !== 'admin' && obs.persoana_id !== req.user.id) {
      return res.status(403).json({ error: 'Acces interzis.' });
    }
    const { data, error } = await supabase.from('observatii_poze')
      .select('id, mime_type, data_base64, created_at').eq('observatie_id', req.params.id).order('id');
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /:id/poze/:pozaId — sterge o poza gresita.
router.delete('/:id/poze/:pozaId', async (req, res) => {
  try {
    const obs = await loadObservatie(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observatie negasita.' });
    if (req.user.role !== 'admin' && obs.persoana_id !== req.user.id) {
      return res.status(403).json({ error: 'Acces interzis.' });
    }
    const { error } = await supabase.from('observatii_poze')
      .delete().eq('id', req.params.pozaId).eq('observatie_id', req.params.id);
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
