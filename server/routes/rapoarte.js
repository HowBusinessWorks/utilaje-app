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
    const { data_start, data_end } = req.query;
    const { data, error } = await supabase.rpc('get_raport_utilaj', {
      p_id: parseInt(req.params.id),
      p_data_start: data_start || null,
      p_data_end: data_end || null,
    });
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Utilaj negasit' });
    const { utilaj, motorina, reparatii, activitateLunara, pvp } = data;
    const mot = motorina || [];
    const totalCostMot = mot.reduce((s, r) => r.cost_motorina != null ? s + Number(r.cost_motorina) : s, 0);
    res.json({
      utilaj,
      motorina:         mot,
      reparatii:        reparatii        || [],
      activitateLunara: activitateLunara  || [],
      pvp:              pvp              || [],
      totalMotorinaLitri:    mot.reduce((s, r) => s + (r.nr_litri   || 0), 0),
      totalCostMotorinaRON:  totalCostMot > 0 ? totalCostMot : null,
      totalCosturiReparatii: (reparatii  || []).reduce((s, r) => s + (r.cost_total || 0), 0),
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
    const { orePerUtilaj, motorina } = data;
    const mot = motorina || [];
    const totalCostMot = mot.reduce((s, r) => r.cost_motorina != null ? s + Number(r.cost_motorina) : s, 0);
    res.json({
      ...data,
      totalOreLucrare:     (orePerUtilaj || []).reduce((s, r) => s + (r.ore_lucrate  || 0), 0),
      totalZileLucrare:    (orePerUtilaj || []).reduce((s, r) => s + (r.zile_lucrate || 0), 0),
      totalCostMotorinaRON: totalCostMot > 0 ? totalCostMot : null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
