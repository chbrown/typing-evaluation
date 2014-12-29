/*jslint node: true */
var http = require('http-enhanced');
var logger = require('loge');

var root_controller = require('./controllers');

var server = module.exports = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  root_controller(req, res);
})
.on('listening', function() {
  var address = server.address();
  logger.info('server listening on http://%s:%d', address.address, address.port);
});

if (require.main === module) {
  server.listen(parseInt(process.env.PORT) || 80, process.env.HOSTNAME);
  logger.level = process.env.VERBOSE ? 'debug' : 'info';
  require('./db').logger = logger;
}
