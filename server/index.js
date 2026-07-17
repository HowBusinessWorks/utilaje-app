require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { requireAuth } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Autentificare (public)
app.use('/api/auth', require('./routes/auth'));

// Rutele de date necesita autentificare
app.use('/api/utilaje',     requireAuth, require('./routes/utilaje'));
app.use('/api/planificari', requireAuth, require('./routes/planificari'));
app.use('/api/motorina',    requireAuth, require('./routes/motorina'));
app.use('/api/pvp',         requireAuth, require('./routes/pvp'));
app.use('/api/reparatii',   requireAuth, require('./routes/reparatii'));
app.use('/api/lucrari',     requireAuth, require('./routes/lucrari'));
app.use('/api/persoane',    requireAuth, require('./routes/persoane'));
app.use('/api/solicitari',  requireAuth, require('./routes/solicitari'));
app.use('/api/rapoarte',         requireAuth, require('./routes/rapoarte'));
app.use('/api/preturi-motorina', requireAuth, require('./routes/preturiMotorina'));

if (require.main === module) {
  app.listen(3001, () => console.log('FleetOps server -> http://localhost:3001'));
}

module.exports = app;
