var _ = require('lodash');
var Router = require('regex-router');
var url = require('url');

var db = require('../../db');
var auth = require('../../auth');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/administrators
List all administrators
*/
R.get(/^\/api\/administrators(\?|$)/, function(req, res) {
  auth.assertAuthorization(req, res, function() {
    db.Select('administrators')
    .orderBy('id')
    .execute(function(err, rows) {
      if (err) return res.error(err, req.headers);
      res.ngjson(rows);
    });
  });
});

/** GET /api/administrators/new
Get blank (empty) administrator
*/
R.get(/^\/api\/administrators\/new$/, function(req, res) {
  auth.assertAuthorization(req, res, function() {
    res.json({created: new Date()});
  });
});

/** POST /api/administrators
Insert new administrator.
*/
R.post(/^\/api\/administrators$/, function(req, res) {
  auth.assertAuthorization(req, res, function() {
    req.readData(function(err, data) {
      if (err) return res.error(err, req.headers);

      // storing the password in the clear!
      data = _.pick(data, ['email', 'password']);

      db.Insert('administrators')
      .set(data)
      .returning('*')
      .execute(function(err, rows) {
        if (err) return res.error(err, req.headers);

        res.status(201).json(rows[0]);
      });
    });
  });
});

/** GET /api/administrators/:id
Get single administrator
*/
R.get(/^\/api\/administrators\/(\d+)/, function(req, res, m) {
  auth.assertAuthorization(req, res, function() {
    db.Select('administrators')
    .whereEqual({id: m[1]})
    .limit(1)
    .execute(function(err, rows) {
      if (err) return res.error(err, req.headers);

      res.json(rows[0]);
    });
  });
});

/** POST /api/administrators/:id
Update existing administrator (should be PUT)
*/
R.post(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  auth.assertAuthorization(req, res, function() {
    req.readData(function(err, data) {
      if (err) return res.error(err, req.headers);

      data = _.pick(data, ['email', 'password']);

      db.Update('administrators')
      .whereEqual({id: m[1]})
      .setEqual(data)
      .returning('*')
      .execute(function(err, rows) {
        if (err) return res.error(err, req.headers);

        res.json(rows[0]);
      });
    });
  });
});

/** DELETE /api/administrators/:id
Delete administrator
*/
R.delete(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  auth.assertAuthorization(req, res, function() {
    db.Delete('administrators')
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.error(err, req.headers);

      res.status(204).end();
    });
  });
});

module.exports = R.route.bind(R);
