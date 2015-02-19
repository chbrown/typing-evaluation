var _ = require('lodash');
var url = require('url');
var logger = require('loge');
var Router = require('regex-router');

var auth = require('../../auth');
var db = require('../../db');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/participants
List all participants
*/
R.get(/^\/api\/participants$/, function(req, res) {
  db.Select('participants')
  .orderBy('id')
  .execute(function(err, result) {
    if (err) return res.error(err, req.headers);

    res.ngjson(result);
  });
});

/** GET /api/participants/new
Get blank (unsaved) participant
*/
R.get(/^\/api\/participants\/new$/, function(req, res) {
  res.json({id: null, created: new Date()});
});

/** POST /api/participants
Insert new participant
*/
R.post(/^\/api\/participants$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.error(err, req.headers);

    data = _.pick(data, ['demographics']);

    db.Insert('participants')
    .set(data)
    .returning('*')
    .execute(function(err, rows) {
      if (err) return res.error(err, req.headers);

      res.status(201).json(rows[0]);
    });
  });
});

/** GET /api/participants/:id
Get single participant
*/
R.get(/^\/api\/participants\/(\d+)$/, function(req, res, m) {
  db.Select('participants')
  .whereEqual({id: m[1]})
  .limit(1)
  .execute(function(err, rows) {
    if (err) return res.error(err, req.headers);

    res.json(rows[0]);
  });
});

/** POST /api/participants/:id
Update existing participant (should be PUT)
*/
R.post(/^\/api\/participants\/(\d+)$/, function(req, res, m) {
  auth.assertUserAuthorization(req, function(err, user) {
    if (err) return res.error(err, req.headers);

    req.readData(function(err, data) {
      if (err) return res.error(err, req.headers);

      data = _.pick(data, ['demographics']);

      db.Update('participants')
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

/** DELETE /api/posts/:id
Delete post
*/
R.delete(/^\/api\/participants\/(\d+)$/, function(req, res, m) {
  auth.assertUserAuthorization(req, function(err, user) {
    if (err) return res.error(err, req.headers);

    db.Delete('participants')
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.error(err, req.headers);

      res.status(204).end();
    });
  });
});

module.exports = R.route.bind(R);
