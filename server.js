/*jslint node: true */
var http = require('http-enhanced');
var logger = require('loge');

var root_controller = require('./controllers');

var server = module.exports = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  root_controller(req, res);
})
.on('listening', function() {
  var parts = server._connectionKey.split(':');
  logger.info('server listening on http://%s:%d', parts[1], parts[2]);
});

if (require.main === module) {
  server.listen(parseInt(process.env.PORT), process.env.HOSTNAME);
}
