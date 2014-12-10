/*jslint node: true */
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.any(/^\/api\/responses/, require('./responses'));
R.any(/^\/api\/participants/, require('./participants'));
R.any(/^\/api\/sentences/, require('./sentences'));

module.exports = R.route.bind(R);
