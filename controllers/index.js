/*jslint node: true */
var Router = require('regex-router');
var send = require('send');

var R = new Router(function(req, res) {
  req.url = '/static/experiment.html';
  R.route(req, res);
});

R.any(/^\/admin/, function(req, res) {
  req.url = '/static/admin.html';
  R.route(req, res);
});

['ng', 'static'].forEach(function(root) {
  var file_regex = new RegExp('^/' + root + '/([^?]+)(\\?|$)');
  R.any(file_regex, function(req, res, m) {
    send(req, m[1], {root: root})
      .on('error', function(err) {
        res.status(err.status || 500).die('send error: ' + err.message);
      })
      .on('directory', function() {
        res.status(404).die('No resource at: ' + req.url);
      })
      .pipe(res);
  });
});

R.get('/info', function(req, res) {
  var package_json = require('../package.json');
  var info = {
    name: package_json.name,
    version: package_json.version,
    description: package_json.description,
  };
  res.json(info);
});

R.any(/^\/api/, require('./api'));

module.exports = R.route.bind(R);
