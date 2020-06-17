const sqlcmd = require('sqlcmd-pg')

const {logger} = require('./util')

const db = new sqlcmd.Connection({
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT || '5432',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || null,
  database: process.env.PGDATABASE || 'typing-evaluation',
})

// setup logger
db.on('log', (ev) => {
  logger.log(ev.level, ev.format, ...ev.args)
})

module.exports = db
