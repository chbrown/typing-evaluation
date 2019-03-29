var url = require('url');
var path = require('path');
var Router = require('regex-router');
var send = require('send');

var auth = require('../auth');

var R = new Router(function(req, res) {
  var urlObj = url.parse(req.url);
  urlObj.pathname = '/experiment/';
  res.redirect(url.format(urlObj));
});

R.any(/^\/experiment/, function(req, res) {
  req.url = '/ui/experiment/layout.html';
  R.route(req, res);
});

R.any(/^\/admin/, function(req, res) {
  auth.assertAuthorization(req, res, function() {
    req.url = '/ui/admin/layout.html';
    R.route(req, res);
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

R.any(/^\/ui\/([^?]+)(\?|$)/, function(req, res, m) {
  var root = path.join(__dirname, '..', 'ui');
  send(req, m[1], {root: root})
  .on('error', function(err) {
    res.status(err.status || 500).die('send error: ' + err.message);
  })
  .on('directory', function() {
    res.status(404).die('No resource at: ' + req.url);
  })
  .pipe(res);
});

R.any(/^\/api/, require('./api'));

module.exports = R.route.bind(R);
