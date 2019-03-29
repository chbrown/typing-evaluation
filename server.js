var cluster = require('cluster');
var domain = require('domain');
var http = require('http-enhanced');
var logger = require('loge');

var root_controller = require('./controllers');

var server = http.createServer(function(req, res) {
  var request_domain = domain.create();
  request_domain.add(req);
  request_domain.add(res);
  request_domain.on('error', function(err) {
    logger.error('Domain: %s', err.stack);

    // let the master know we're dying
    cluster.worker.disconnect();

    // close down after 10s so that we don't drop current connections.
    setTimeout(function() {
      process.exit(1);
    }, 10000).unref();

    // stop taking new requests
    server.close();

    try {
      // try to send an error to the request that triggered the problem
      res.die('Exception encountered! ' + err.toString());
    }
    catch (internal_error) {
      // oh well, not much we can do at this point
      logger.error('Error responding with error! %s', internal_error.stack);
    }
  });
  request_domain.run(function() {
    logger.debug('%s %s', req.method, req.url);
    root_controller(req, res);
  });
})
.on('listening', function() {
  const address = server.address();
  const addressString = typeof address == 'string' ? address : `${address.address}:${address.port}`;
  logger.info('server listening on http://%s', addressString);
});

module.exports = server;
