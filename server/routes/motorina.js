const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../db');
const { uploadFile, deleteFile } = require('../storage');
const { requireAdmin } = require('../auth');

const upload = multer({ storage: multer.memoryStorage() });

// Un sef de santier poate alimenta doar utilajul dintr-un PV deschis pe numele lui.
async function findOpenPvForSef(utilaj_id, sef_santier_id) {
  const { data } = await supabase.from('procese_verbale')
    .select('id, lucrare_id').eq('utilaj_id', utilaj_id).eq('status', 'deschis')
    .eq('sef_santier_id', sef_santier_id).maybeSingle();
  return data;
}

async function loadFisa(id) {
  const { data } = await supabase.from('fise_motorina').select('*').eq('id', id).maybeSingle();
  return data;
}

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_motorina').select('*').order('data_consum', { ascending: false });
    const { utilaj_id, lucrare_id, data_start, data_sfarsit } = req.query;
    if (utilaj_id)   query = query.eq('utilaj_id', utilaj_id);
    if (lucrare_id)  query = query.eq('lucrare_id', lucrare_id);
    if (data_start)  query = query.gte('data_consum', data_start);
    if (data_sfarsit) query = query.lte('data_consum', data_sfarsit);
    if (req.user.role !== 'admin') query = query.eq('persoana_id', req.user.id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    let { utilaj_id, lucrare_id, persoana_id, data_consum, nr_litri, furnizor, ore_contor, observatii } = req.body;
    if (req.user.role !== 'admin') {
      const pv = await findOpenPvForSef(utilaj_id, req.user.id);
      if (!pv) return res.status(403).json({ error: 'Poti adauga o fisa de motorina doar pentru un utilaj cu proces verbal deschis pe numele tau.' });
      persoana_id = req.user.id;
      lucrare_id = lucrare_id || pv.lucrare_id;
    }
    const { data, error } = await supabase.from('fise_motorina')
      .insert({ utilaj_id, lucrare_id: lucrare_id || null, persoana_id: persoana_id || null,
                data_consum, nr_litri, furnizor: furnizor || null,
                ore_contor: ore_contor || null, observatii: observatii || null })
      .select('id').single();
    if (error) throw error;
    if (ore_contor) {
      await supabase.rpc('update_ore_contor', { p_utilaj_id: utilaj_id, p_ore: ore_contor });
    }
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { utilaj_id, lucrare_id, persoana_id, data_consum, nr_litri, furnizor, ore_contor, observatii } = req.body;
    const { error } = await supabase.from('fise_motorina')
      .update({ utilaj_id, lucrare_id: lucrare_id || null, persoana_id: persoana_id || null,
                data_consum, nr_litri, furnizor: furnizor || null,
                ore_contor: ore_contor || null, observatii: observatii || null })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fisier lipsa' });
    const fisa = await loadFisa(req.params.id);
    if (req.user.role !== 'admin' && (!fisa || fisa.persoana_id !== req.user.id)) return res.status(403).json({ error: 'Acces interzis' });
    if (fisa?.document_url) await deleteFile('motorina', fisa.document_url);
    const ext = req.file.originalname.split('.').pop();
    const url = await uploadFile('motorina', `docs/${req.params.id}/${Date.now()}.${ext}`, req.file.buffer, req.file.mimetype);
    await supabase.from('fise_motorina').update({ document_url: url }).eq('id', req.params.id);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/document', async (req, res) => {
  try {
    const fisa = await loadFisa(req.params.id);
    if (req.user.role !== 'admin' && (!fisa || fisa.persoana_id !== req.user.id)) return res.status(403).json({ error: 'Acces interzis' });
    if (fisa?.document_url) await deleteFile('motorina', fisa.document_url);
    await supabase.from('fise_motorina').update({ document_url: null }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('fise_motorina').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
