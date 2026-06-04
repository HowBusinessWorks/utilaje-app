require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/utilaje',     require('./routes/utilaje'));
app.use('/api/planificari', require('./routes/planificari'));
app.use('/api/motorina',    require('./routes/motorina'));
app.use('/api/pvp',         require('./routes/pvp'));
app.use('/api/reparatii',   require('./routes/reparatii'));
app.use('/api/lucrari',     require('./routes/lucrari'));
app.use('/api/persoane',    require('./routes/persoane'));
app.use('/api/rapoarte',    require('./routes/rapoarte'));

if (require.main === module) {
  app.listen(3001, () => console.log('FleetOps server -> http://localhost:3001'));
}

module.exports = app;
