const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { verifyPassword, signToken, requireAuth } = require('../auth');

// Login sef de santier: telefon + parola
router.post('/login', async (req, res) => {
  try {
    const telefon = (req.body.telefon || '').trim();
    const parola = req.body.parola || '';
    if (!telefon || !parola) {
      return res.status(400).json({ error: 'Introdu numarul de telefon si parola' });
    }

    const { data, error } = await supabase.from('persoane')
      .select('id, nume, telefon, categorie, parola_hash')
      .eq('telefon', telefon)
      .limit(1);
    if (error) throw error;

    const persoana = data && data[0];
    if (!persoana || !persoana.parola_hash || !verifyPassword(parola, persoana.parola_hash)) {
      return res.status(401).json({ error: 'Telefon sau parola gresita' });
    }

    const user = {
      id: persoana.id,
      nume: persoana.nume,
      telefon: persoana.telefon,
      categorie: persoana.categorie,
      role: 'sef_santier',
    };
    res.json({ token: signToken(user), user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login administrator: doar parola (din .env)
router.post('/admin', async (req, res) => {
  try {
    const parola = req.body.parola || '';
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return res.status(500).json({ error: 'ADMIN_PASSWORD nu este configurat pe server' });
    }
    const a = Buffer.from(parola);
    const b = Buffer.from(expected);
    const ok = a.length === b.length &&
      require('crypto').timingSafeEqual(a, b);
    if (!ok) return res.status(401).json({ error: 'Parola de administrator gresita' });

    const user = { id: null, nume: 'Administrator', role: 'admin' };
    res.json({ token: signToken(user), user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Validare token / informatii utilizator curent
router.get('/me', requireAuth, (req, res) => {
  const { exp, ...user } = req.user;
  res.json(user);
});

module.exports = router;
