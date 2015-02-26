var util = require('util');
var logger = require('loge');
var db = require('./db');

/** authenticatedAdministrator(req: http.IncomingMessage,
                               callback: (error: Error, administrator: Administrator))

Return the authenticated administrator.
*/
function authenticatedAdministrator(req, callback) {
  var basic_auth_match = (req.headers.authorization || '').match(/^Basic\s+(.+)$/);
  if (basic_auth_match) {
    var basic_auth_pair = new Buffer(basic_auth_match[1], 'base64').toString('utf8').split(':');

    db.Select('administrators')
    .whereEqual({
      email: basic_auth_pair[0],
      password: basic_auth_pair[1],
    })
    .limit(1)
    .execute(function(err, rows) {
      if (err) return callback(err);

      callback(null, rows[0]);
    });
  }
  else {
    callback(null, null);
  }
}

/** assertAuthorization(req: http.IncomingMessage,
                        res: http.ServerResponse,
                        callback: (administrator: Administrator))

Try to get the authenticated administrator.

1. If no administrator is available, raise an error.
2. If there is one, return the user object.
*/
exports.assertAuthorization = function(req, res, callback) {
  authenticatedAdministrator(req, function(err, administrator) {
    if (err) {
      return res.error(err, req.headers);
    }
    if (!administrator) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="admin"');

      return res.text('Authorization failed; you must login first.');
    }
    callback(administrator);
  });
};
