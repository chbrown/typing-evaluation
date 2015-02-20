var _ = require('lodash');
var Router = require('regex-router');
var url = require('url');

var db = require('../../db');
var auth = require('../../auth');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/sentences
List all sentences
*/
R.get(/^\/api\/sentences(\?|$)/, function(req, res) {
  db.Select('sentences')
  .orderBy('id')
  .execute(function(err, rows) {
    if (err) return res.error(err, req.headers);

    res.ngjson(rows);
  });
});

/** GET /api/sentences/new
Get blank (empty) sentence
*/
R.get(/^\/api\/sentences\/new$/, function(req, res) {
  res.json({id: null, active: true, language: 'en', created: new Date()});
});

/** POST /api/sentences
Insert new sentence
*/
R.post(/^\/api\/sentences$/, function(req, res) {
  auth.assertUserAuthorization(req, function(err, user) {
    if (err) return res.error(err, req.headers);

    req.readData(function(err, data) {
      if (err) return res.error(err, req.headers);

      data = _.pick(data, ['text', 'language', 'active']);

      db.Insert('sentences')
      .set(data)
      .returning('*')
      .execute(function(err, rows) {
        if (err) return res.error(err, req.headers);

        res.status(201).json(rows[0]);
      });
    });
  });
});

/** GET /api/sentences/:id
Get single sentence
*/
R.get(/^\/api\/sentences\/(\d+)/, function(req, res, m) {
  db.Select('sentences')
  .add('sentences.*', '(SELECT COUNT(*) FROM sentences) AS total')
  .whereEqual({id: m[1]})
  .limit(1)
  .execute(function(err, rows) {
    if (err) return res.error(err, req.headers);

    res.json(rows[0]);
  });
});


/** GET /api/sentences/next?participant_id=:participant_id
Get single sentence for participant

Non-REST
*/
R.get(/^\/api\/sentences\/next/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);

  db.Select('sentences')
  .add('sentences.*', '(SELECT COUNT(*) FROM sentences) AS total')
  .where('id NOT IN (SELECT sentence_id FROM responses WHERE participant_id = ?)', urlObj.query.participant_id)
  .limit(1)
  .execute(function(err, rows) {
    if (err) return res.error(err, req.headers);
    if (rows.length === 0) {
      return res.error({message: 'No more sentences are available.', statusCode: 404}, req.headers);
    }

    res.json(rows[0]);
  });
});

/** POST /api/sentences/:id
Update existing sentence (should be PUT)
*/
R.post(/^\/api\/sentences\/(\d+)$/, function(req, res, m) {
  auth.assertUserAuthorization(req, function(err, user) {
    if (err) return res.error(err, req.headers);

    req.readData(function(err, data) {
      if (err) return res.error(err, req.headers);

      data = _.pick(data, ['text', 'language', 'active']);

      db.Update('sentences')
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

/** DELETE /api/sentences/:id
Delete sentence
*/
R.delete(/^\/api\/sentences\/(\d+)$/, function(req, res, m) {
  auth.assertUserAuthorization(req, function(err, user) {
    if (err) return res.error(err, req.headers);

    db.Delete('sentences')
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.error(err, req.headers);

      res.status(204).end();
    });
  });
});

module.exports = R.route.bind(R);
