var util = require('util');

var AuthError = exports.AuthError = function(message, statusCode) {
  Error.call(this);
  this.name = 'AuthError';
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
  this.statusCode = (statusCode !== undefined) ? statusCode : 401;
};
util.inherits(AuthError, Error);

var authenticatedUser = exports.authenticatedUser = function(req, callback) {
  /** Return a dummy user.

      callback: (error: Error, user: User)
  */
  setImmediate(function() {
    return callback(null, {id: 1, created: new Date()});
  });
};

var assertUserAuthorization = exports.assertUserAuthorization = function(req, callback) {
  /** Try to get the authenticated user.
  1. If no user is available, raise an error.
  2. If there is one, return the user object.

      callback: (error: Error, user: User)
  */
  authenticatedUser(req, function(err, user) {
    if (err) return callback(err);
    if (user === null) {
      err = new AuthError('Authorization failed; you must login first.', 401);
      return callback(err);
    }
    callback(null, user);
  });
};
