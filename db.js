const sqlcmd = require('sqlcmd-pg')

const {logger} = require('./util')

// the DB_PORT_5432_TCP_* stuff comes from docker
const db = new sqlcmd.Connection({
  host: process.env.DB_PORT_5432_TCP_ADDR || '127.0.0.1',
  port: process.env.DB_PORT_5432_TCP_PORT || '5432',
  user: 'postgres',
  database: 'typing-evaluation',
})

// setup logger
db.on('log', (ev) => {
  logger.log(ev.level, ev.format, ...ev.args)
})

module.exports = db
