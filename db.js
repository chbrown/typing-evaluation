const logger = require('loge');
const sqlcmd = require('sqlcmd-pg');

// the DB_PORT_5432_TCP_* stuff comes from docker
const db = new sqlcmd.Connection({
  host: process.env.DB_PORT_5432_TCP_ADDR || '127.0.0.1',
  port: process.env.DB_PORT_5432_TCP_PORT || '5432',
  user: 'postgres',
  database: 'typing-evaluation',
});

// setup logger
db.on('log', (ev) => {
  const args = [ev.format].concat(ev.args);
  logger[ev.level](...args);
});

module.exports = db;
