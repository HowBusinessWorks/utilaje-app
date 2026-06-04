const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../db');
const { uploadFile } = require('../storage');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('v_reparatii').select('*').order('data_reparatie', { ascending: false });
    const { utilaj_id, data_start, data_sfarsit } = req.query;
    if (utilaj_id)   query = query.eq('utilaj_id', utilaj_id);
    if (data_start)  query = query.gte('data_reparatie', data_start);
    if (data_sfarsit) query = query.lte('data_reparatie', data_sfarsit);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { utilaj_id, data_reparatie, furnizor, descriere, cost_total, ore_contor, durata_zile, observatii } = req.body;
    const { data, error } = await supabase.from('fise_reparatii')
      .insert({ utilaj_id, data_reparatie, furnizor, descriere, cost_total,
                ore_contor: ore_contor || null, durata_zile: durata_zile || null, observatii: observatii || null })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { utilaj_id, data_reparatie, furnizor, descriere, cost_total, ore_contor, durata_zile, observatii } = req.body;
    const { error } = await supabase.from('fise_reparatii')
      .update({ utilaj_id, data_reparatie, furnizor, descriere, cost_total,
                ore_contor: ore_contor || null, durata_zile: durata_zile || null, observatii: observatii || null })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fise_reparatii').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/factura', upload.single('factura'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fisier lipsa' });
    const ext = req.file.originalname.split('.').pop();
    const url = await uploadFile('reparatii', `facturi/${req.params.id}/${Date.now()}.${ext}`, req.file.buffer, req.file.mimetype);
    await supabase.from('fise_reparatii').update({ factura_url: url }).eq('id', req.params.id);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/poze', upload.single('poza'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fisier lipsa' });
    const ext = req.file.originalname.split('.').pop();
    const url = await uploadFile('reparatii', `poze/${req.params.id}/${Date.now()}.${ext}`, req.file.buffer, req.file.mimetype);
    const { data, error } = await supabase.from('reparatii_poze')
      .insert({ reparatie_id: req.params.id, url })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
