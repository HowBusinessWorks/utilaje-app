const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../db');
const { uploadFile, deleteFile } = require('../storage');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_pvp').select('*').order('created_at', { ascending: false });
    const { utilaj_id, status } = req.query;
    if (utilaj_id) query = query.eq('utilaj_id', utilaj_id);
    if (status)    query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: pv, error } = await supabase.from('v_pvp').select('*').eq('id', req.params.id).single();
    if (error || !pv) return res.status(404).json({ error: 'PV negasit' });
    const [{ data: poze }, { data: accesorii }] = await Promise.all([
      supabase.from('pv_poze').select('*').eq('pv_id', req.params.id),
      supabase.from('pv_accesorii').select('*').eq('pv_id', req.params.id).order('id'),
    ]);
    pv.poze = poze || [];
    pv.accesorii = accesorii || [];
    res.json(pv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { utilaj_id, lucrare_id, data_predare, persoana_primire_text,
            responsabil_predare, ore_contor_predare, motorina_predare,
            stare_predare, observatii_predare, accesorii, semnatura_predare,
            subcontractant_id, sef_santier_id } = req.body;
    const { data: openPv } = await supabase.from('procese_verbale')
      .select('id').eq('utilaj_id', utilaj_id).eq('status', 'deschis').maybeSingle();
    if (openPv) {
      return res.status(409).json({ error: 'Exista deja un PV deschis pentru acest utilaj. Inchide PV-ul curent inainte de a crea unul nou.' });
    }
    const { data, error } = await supabase.from('procese_verbale')
      .insert({
        utilaj_id, lucrare_id: lucrare_id || null, data_predare: data_predare || null,
        persoana_primire_text: persoana_primire_text || null,
        responsabil_predare: responsabil_predare || null,
        ore_contor_predare: ore_contor_predare || null, motorina_predare: motorina_predare || null,
        stare_predare: stare_predare || null, observatii_predare: observatii_predare || null,
        semnatura_predare: semnatura_predare || null, status: 'deschis',
        subcontractant_id: subcontractant_id || null,
        sef_santier_id: sef_santier_id || null,
      })
      .select('id').single();
    if (error) throw error;
    await supabase.from('utilaje').update({ status: 'indisponibil' }).eq('id', utilaj_id);
    if (Array.isArray(accesorii) && accesorii.length > 0) {
      await supabase.from('pv_accesorii').insert(
        accesorii.map(acc => ({ pv_id: data.id, denumire: acc.denumire, predat: acc.predat ? 1 : 0 }))
      );
    }
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/primire', async (req, res) => {
  try {
    const { data_primire, responsabil_primire, ore_contor_primire, motorina_primire,
            stare_primire, observatii_primire, probleme_constatate,
            accesorii_primire, semnatura_primire } = req.body;
    const { error } = await supabase.from('procese_verbale')
      .update({
        data_primire: data_primire || null, responsabil_primire: responsabil_primire || null,
        ore_contor_primire: ore_contor_primire || null, motorina_primire: motorina_primire || null,
        stare_primire: stare_primire || null, observatii_primire: observatii_primire || null,
        probleme_constatate: probleme_constatate || null,
        semnatura_primire: semnatura_primire || null, status: 'inchis',
      })
      .eq('id', req.params.id);
    if (error) throw error;
    if (Array.isArray(accesorii_primire) && accesorii_primire.length > 0) {
      await Promise.all(accesorii_primire.filter(a => a.id).map(acc =>
        supabase.from('pv_accesorii').update({ primit: acc.primit ? 1 : 0 }).eq('id', acc.id)
      ));
    }
    const { data: pv } = await supabase.from('procese_verbale').select('utilaj_id').eq('id', req.params.id).single();
    if (pv) {
      if (ore_contor_primire) {
        await supabase.rpc('update_ore_contor', { p_utilaj_id: pv.utilaj_id, p_ore: ore_contor_primire });
      }
      await supabase.from('utilaje').update({ status: 'disponibil' }).eq('id', pv.utilaj_id);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/poze', upload.single('poza'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fisier lipsa' });
    const { etapa } = req.body;
    const ext = req.file.originalname.split('.').pop();
    const url = await uploadFile('pvp', `photos/${req.params.id}/${etapa || 'predare'}/${Date.now()}.${ext}`, req.file.buffer, req.file.mimetype);
    const { data, error } = await supabase.from('pv_poze')
      .insert({ pv_id: req.params.id, url, etapa: etapa || 'predare' })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/poze/:pozaId', async (req, res) => {
  try {
    const { data: poza } = await supabase.from('pv_poze')
      .select('*').eq('id', req.params.pozaId).eq('pv_id', req.params.id).single();
    if (!poza) return res.status(404).json({ error: 'Poza negasita' });
    await deleteFile('pvp', poza.url);
    await supabase.from('pv_poze').delete().eq('id', req.params.pozaId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('procese_verbale').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
