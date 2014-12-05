/*jslint node: true */
var sqlcmd = require('sqlcmd');

module.exports = new sqlcmd.Connection({
  host: 'db',
  user: 'postgres',
  database: 'typing-evaluation',
});
