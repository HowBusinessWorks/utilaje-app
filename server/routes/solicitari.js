const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { requireAdmin } = require('../auth');

// ------------------------------------------------------------------
// GET / — lista solicitarilor.
//   admin       -> toate
//   sef_santier -> doar cele proprii
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_solicitari').select('*').order('created_at', { ascending: false });
    if (req.user.role !== 'admin') query = query.eq('solicitant_id', req.user.id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// GET /count — numarul de notificari necitite pentru badge.
//   admin       -> solicitari noi nevazute
//   sef_santier -> raspunsuri (acceptata/respinsa) nevazute
// ------------------------------------------------------------------
router.get('/count', async (req, res) => {
  try {
    let query = supabase.from('solicitari').select('id', { count: 'exact', head: true });
    if (req.user.role === 'admin') {
      query = query.eq('status', 'noua').eq('seen_admin', false);
    } else {
      query = query.eq('solicitant_id', req.user.id)
        .in('status', ['acceptata', 'respinsa']).eq('seen_solicitant', false);
    }
    const { count, error } = await query;
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// GET /disponibilitate?categorie_id=&data_start=&data_sfarsit=
// Utilajele dintr-o categorie + daca sunt libere in intervalul cerut.
// ------------------------------------------------------------------
router.get('/disponibilitate', async (req, res) => {
  try {
    const { categorie_id, data_start, data_sfarsit } = req.query;
    if (!categorie_id || !data_start || !data_sfarsit) {
      return res.status(400).json({ error: 'Lipsesc parametrii' });
    }
    const { data: utilaje, error } = await supabase.from('utilaje')
      .select('id, denumire, alias, status')
      .eq('categorie_id', categorie_id)
      .neq('status', 'casat')
      .order('denumire');
    if (error) throw error;

    const ids = utilaje.map(u => u.id);
    let busy = new Set();
    if (ids.length > 0) {
      const { data: plans, error: pe } = await supabase.from('planificari')
        .select('utilaj_id')
        .in('utilaj_id', ids)
        .lte('data_start', data_sfarsit)
        .gte('data_sfarsit', data_start);
      if (pe) throw pe;
      busy = new Set((plans || []).map(p => p.utilaj_id));
    }

    const lista = utilaje.map(u => ({ ...u, disponibil: !busy.has(u.id) }));
    res.json({
      utilaje: lista,
      total: lista.length,
      disponibile: lista.filter(u => u.disponibil).length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// POST / — seful de santier (sau admin) trimite o solicitare noua.
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { categorie_id, lucrare_id, nota, data_start, data_sfarsit, subcontractanti_ids } = req.body;
    if (!categorie_id || !data_start || !data_sfarsit) {
      return res.status(400).json({ error: 'Completeaza categoria si perioada' });
    }
    const row = {
      solicitant_id: req.user.id || null,
      categorie_id,
      lucrare_id: lucrare_id || null,
      nota: nota || null,
      data_start,
      data_sfarsit,
      subcontractanti_ids: Array.isArray(subcontractanti_ids) ? subcontractanti_ids : [],
      status: 'noua',
      seen_admin: false,
      seen_solicitant: true,
    };
    const { data, error } = await supabase.from('solicitari').insert(row).select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// POST /:id/accept — admin accepta si aloca un utilaj concret.
// Creeaza automat planificarea si notifica seful.
// ------------------------------------------------------------------
router.post('/:id/accept', requireAdmin, async (req, res) => {
  try {
    const { utilaj_id } = req.body;
    if (!utilaj_id) return res.status(400).json({ error: 'Alege un utilaj de alocat' });

    const { data: sol, error: se } = await supabase.from('v_solicitari')
      .select('*').eq('id', req.params.id).single();
    if (se) throw se;
    if (!sol) return res.status(404).json({ error: 'Solicitare inexistenta' });
    if (sol.status !== 'noua') return res.status(409).json({ error: 'Solicitarea a fost deja procesata' });

    // Verifica suprapunerea utilajului ales
    const { data: overlap } = await supabase.from('planificari').select('id')
      .eq('utilaj_id', utilaj_id)
      .lte('data_start', sol.data_sfarsit)
      .gte('data_sfarsit', sol.data_start);
    if (overlap && overlap.length > 0) {
      return res.status(409).json({ error: 'Utilajul ales este deja planificat in acest interval' });
    }

    // Construieste observatii pentru planificare
    const subs = (sol.subcontractanti_nume || []).join(', ');
    const obsParts = [];
    if (sol.nota) obsParts.push(sol.nota);
    if (subs) obsParts.push('Subcontractanti: ' + subs);
    if (sol.solicitant_nume) obsParts.push('Solicitat de: ' + sol.solicitant_nume);
    const observatii = obsParts.join(' | ') || null;

    const { data: plan, error: pe } = await supabase.from('planificari').insert({
      utilaj_id,
      lucrare_id: sol.lucrare_id || null,
      persoana_id: null,
      data_start: sol.data_start,
      data_sfarsit: sol.data_sfarsit,
      observatii,
    }).select('id').single();
    if (pe) throw pe;

    const { error: ue } = await supabase.from('solicitari').update({
      status: 'acceptata',
      utilaj_id,
      planificare_id: plan.id,
      seen_solicitant: false,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.params.id);
    if (ue) throw ue;

    res.json({ ok: true, planificare_id: plan.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// POST /:id/reject — admin respinge (cu motiv optional).
// ------------------------------------------------------------------
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { data: sol } = await supabase.from('solicitari').select('status').eq('id', req.params.id).single();
    if (sol && sol.status !== 'noua') {
      return res.status(409).json({ error: 'Solicitarea a fost deja procesata' });
    }
    const { error } = await supabase.from('solicitari').update({
      status: 'respinsa',
      motiv_respingere: req.body.motiv || null,
      seen_solicitant: false,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// POST /mark-seen — marcheaza notificarile curente drept vazute.
// ------------------------------------------------------------------
router.post('/mark-seen', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { error } = await supabase.from('solicitari')
        .update({ seen_admin: true }).eq('status', 'noua').eq('seen_admin', false);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('solicitari')
        .update({ seen_solicitant: true })
        .eq('solicitant_id', req.user.id)
        .in('status', ['acceptata', 'respinsa'])
        .eq('seen_solicitant', false);
      if (error) throw error;
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------------------------------------------------------------------
// DELETE /:id — seful isi poate retrage o solicitare inca neprocesata;
// adminul poate sterge orice.
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { data: sol } = await supabase.from('solicitari')
      .select('solicitant_id, status').eq('id', req.params.id).single();
    if (!sol) return res.status(404).json({ error: 'Solicitare inexistenta' });
    if (req.user.role !== 'admin') {
      if (sol.solicitant_id !== req.user.id) return res.status(403).json({ error: 'Acces interzis' });
      if (sol.status !== 'noua') return res.status(409).json({ error: 'Solicitarea a fost deja procesata' });
    }
    const { error } = await supabase.from('solicitari').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
