const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../db');
const { uploadFile, deleteFile } = require('../storage');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_utilaje').select('*').order('denumire');
    const { status, categorie_id, search } = req.query;
    if (status)      query = query.eq('status', status);
    if (categorie_id) query = query.eq('categorie_id', categorie_id);
    if (search) {
      query = query.or(
        `denumire.ilike.%${search}%,alias.ilike.%${search}%,serie.ilike.%${search}%,nr_inventar.ilike.%${search}%`
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/meta/categorii', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categorii').select('*').order('nume');
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/accesorii', async (req, res) => {
  try {
    const { data, error } = await supabase.from('utilaj_accesorii')
      .select('*').eq('utilaj_id', req.params.id).order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/accesorii', async (req, res) => {
  try {
    const { denumire } = req.body;
    if (!denumire?.trim()) return res.status(400).json({ error: 'Denumire lipsa' });
    const { data, error } = await supabase.from('utilaj_accesorii')
      .insert({ utilaj_id: req.params.id, denumire: denumire.trim() })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id, denumire: denumire.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/accesorii/:accId', async (req, res) => {
  try {
    const { error } = await supabase.from('utilaj_accesorii')
      .delete().eq('id', req.params.accId).eq('utilaj_id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/fise', async (req, res) => {
  try {
    const [{ data: motorina }, { data: reparatii }] = await Promise.all([
      supabase.from('fise_motorina').select('id, data_consum, nr_litri, furnizor, observatii').eq('utilaj_id', req.params.id),
      supabase.from('fise_reparatii').select('id, data_reparatie, cost_total, furnizor, descriere').eq('utilaj_id', req.params.id),
    ]);
    const result = [
      ...(motorina  || []).map(r => ({ tip: 'motorina',  id: r.id, data: r.data_consum,    valoare: r.nr_litri,   furnizor: r.furnizor, observatii: r.observatii })),
      ...(reparatii || []).map(r => ({ tip: 'reparatie', id: r.id, data: r.data_reparatie, valoare: r.cost_total, furnizor: r.furnizor, observatii: r.descriere })),
    ].sort((a, b) => b.data.localeCompare(a.data));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: utilaj, error } = await supabase.from('v_utilaje_detaliu')
      .select('*').eq('id', req.params.id).single();
    if (error || !utilaj) return res.status(404).json({ error: 'Utilaj negasit' });
    const { data: poze } = await supabase.from('utilaje_poze').select('*').eq('utilaj_id', req.params.id);
    utilaj.poze = poze || [];
    res.json(utilaj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { denumire, alias, serie, nr_inventar, nr_matriculare, responsabil_id, locatie_baza_id,
            producator, proprietate, garantie_exp, data_achizitie, observatii,
            status, categorie_id, chirie_zi } = req.body;
    const { data, error } = await supabase.from('utilaje')
      .insert({
        denumire, alias: alias || null, serie: serie || null, nr_inventar: nr_inventar || null,
        nr_matriculare: nr_matriculare || null,
        responsabil_id: responsabil_id || null, locatie_baza_id: locatie_baza_id || null,
        producator: producator || null, proprietate: proprietate || 'propriu',
        garantie_exp: garantie_exp || null, data_achizitie: data_achizitie || null,
        observatii: observatii || null, status: status || 'disponibil',
        categorie_id: categorie_id || null, chirie_zi: chirie_zi || null,
      })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['denumire','alias','serie','nr_inventar','nr_matriculare','responsabil_id','locatie_baza_id',
                    'producator','proprietate','garantie_exp','data_achizitie','observatii',
                    'status','categorie_id','chirie_zi','ore_contor'];
    const updates = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f] === '' ? null : req.body[f];
    }
    if (Object.keys(updates).length === 0) return res.json({ ok: true });
    const { error } = await supabase.from('utilaje').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('utilaje').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/poze', upload.single('poza'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fisier lipsa' });
    const ext = req.file.originalname.split('.').pop();
    const url = await uploadFile('utilaje', `photos/${req.params.id}/${Date.now()}.${ext}`, req.file.buffer, req.file.mimetype);
    const { data: existing } = await supabase.from('utilaje_poze').select('id').eq('utilaj_id', req.params.id).limit(1);
    const isPrimary = !existing || existing.length === 0 ? 1 : 0;
    const { data, error } = await supabase.from('utilaje_poze')
      .insert({ utilaj_id: req.params.id, url, is_primary: isPrimary })
      .select('id').single();
    if (error) throw error;
    if (isPrimary) {
      await supabase.from('utilaje').update({ thumbnail_url: url }).eq('id', req.params.id);
    }
    res.json({ id: data.id, url, is_primary: isPrimary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/poze/:poza_id', async (req, res) => {
  try {
    const { data: poza } = await supabase.from('utilaje_poze').select('*').eq('id', req.params.poza_id).single();
    if (!poza) return res.json({ ok: true });
    await deleteFile('utilaje', poza.url);
    await supabase.from('utilaje_poze').delete().eq('id', req.params.poza_id);
    if (poza.is_primary) {
      const { data: next } = await supabase.from('utilaje_poze').select('*').eq('utilaj_id', req.params.id).limit(1);
      if (next && next.length > 0) {
        await supabase.from('utilaje_poze').update({ is_primary: 1 }).eq('id', next[0].id);
        await supabase.from('utilaje').update({ thumbnail_url: next[0].url }).eq('id', req.params.id);
      } else {
        await supabase.from('utilaje').update({ thumbnail_url: null }).eq('id', req.params.id);
      }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
