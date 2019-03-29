const db = require('./db')

/** authenticatedAdministrator(req: http.IncomingMessage,
                               callback: (error: Error, administrator: Administrator))

Return the authenticated administrator.
*/
function authenticatedAdministrator(req, callback) {
  const basic_auth_match = (req.headers.authorization || '').match(/^Basic\s+(.+)$/)
  if (basic_auth_match) {
    const basic_auth_pair = Buffer.from(basic_auth_match[1], 'base64').toString('utf8').split(':')
    const email = basic_auth_pair[0]
    const password = basic_auth_pair[1]

    // check if the ADMIN_* environment variables have been set
    if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
      // if so, check that they match the basic auth pair
      if (email === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        // return a non-empty object for the administrator
        return callback(null, {id: 'env'})
      }
    }

    db.Select('administrators')
    .whereEqual({email: email, password: password})
    .limit(1)
    .execute((err, rows) => {
      if (err) return callback(err)

      callback(null, rows[0])
    })
  }
  else {
    callback(null, null)
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
  authenticatedAdministrator(req, (err, administrator) => {
    if (err) {
      return res.error(err, req.headers)
    }
    if (!administrator) {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="admin"')

      return res.text('Authorization failed; you must login first.')
    }
    callback(administrator)
  })
}
