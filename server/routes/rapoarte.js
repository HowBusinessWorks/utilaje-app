const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/dashboard', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard');
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/utilaj/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_raport_utilaj', {
      p_id: parseInt(req.params.id),
      p_luna: req.query.luna || null,
    });
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Utilaj negasit' });
    const { utilaj, motorina, reparatii, activitateLunara } = data;
    res.json({
      utilaj,
      motorina:        motorina        || [],
      reparatii:       reparatii       || [],
      activitateLunara: activitateLunara || [],
      totalMotorinaLitri:    (motorina        || []).reduce((s, r) => s + (r.nr_litri   || 0), 0),
      totalCosturiReparatii: (reparatii       || []).reduce((s, r) => s + (r.cost_total || 0), 0),
      totalOreLucrate:       (activitateLunara || []).reduce((s, r) => s + (r.ore_lucrate  || 0), 0),
      totalZileLucrate:      (activitateLunara || []).reduce((s, r) => s + (r.zile_lucrate || 0), 0),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/lucrare/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_raport_lucrare', {
      p_id: parseInt(req.params.id),
    });
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lucrare negasita' });
    const { orePerUtilaj } = data;
    res.json({
      ...data,
      totalOreLucrare:  (orePerUtilaj || []).reduce((s, r) => s + (r.ore_lucrate  || 0), 0),
      totalZileLucrare: (orePerUtilaj || []).reduce((s, r) => s + (r.zile_lucrate || 0), 0),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
