var logger = require('loge');
var sqlcmd = require('sqlcmd-pg');

var db = module.exports = new sqlcmd.Connection({
  host: 'db',
  user: 'postgres',
  database: 'typing-evaluation',
});

// setup logger
db.on('log', function(ev) {
  var args = [ev.format].concat(ev.args);
  logger[ev.level].apply(logger, args);
});
