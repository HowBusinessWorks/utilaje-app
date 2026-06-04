const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../db');
const { uploadFile, deleteFile } = require('../storage');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_motorina').select('*').order('data_consum', { ascending: false });
    const { utilaj_id, lucrare_id, data_start, data_sfarsit } = req.query;
    if (utilaj_id)   query = query.eq('utilaj_id', utilaj_id);
    if (lucrare_id)  query = query.eq('lucrare_id', lucrare_id);
    if (data_start)  query = query.gte('data_consum', data_start);
    if (data_sfarsit) query = query.lte('data_consum', data_sfarsit);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { utilaj_id, lucrare_id, persoana_id, data_consum, nr_litri, furnizor, ore_contor, observatii } = req.body;
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

router.put('/:id', async (req, res) => {
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
    const { data: fisa } = await supabase.from('fise_motorina').select('document_url').eq('id', req.params.id).single();
    if (fisa?.document_url) await deleteFile('motorina', fisa.document_url);
    const ext = req.file.originalname.split('.').pop();
    const url = await uploadFile('motorina', `docs/${req.params.id}/${Date.now()}.${ext}`, req.file.buffer, req.file.mimetype);
    await supabase.from('fise_motorina').update({ document_url: url }).eq('id', req.params.id);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/document', async (req, res) => {
  try {
    const { data: fisa } = await supabase.from('fise_motorina').select('document_url').eq('id', req.params.id).single();
    if (fisa?.document_url) await deleteFile('motorina', fisa.document_url);
    await supabase.from('fise_motorina').update({ document_url: null }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fise_motorina').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
