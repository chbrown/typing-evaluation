var async = require('async');
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
  auth.assertAuthorization(req, res, function() {
    db.Select('sentences')
    .orderBy('id')
    .execute(function(err, rows) {
      if (err) return res.error(err, req.headers);

      res.ngjson(rows);
    });
  });
});

/** GET /api/sentences/new
Get blank (empty) sentence
*/
R.get(/^\/api\/sentences\/new$/, function(req, res) {
  auth.assertAuthorization(req, res, function() {
    res.json({id: null, active: true, language: 'en', created: new Date()});
  });
});

/** POST /api/sentences
Insert new sentence
*/
R.post(/^\/api\/sentences$/, function(req, res) {
  auth.assertAuthorization(req, res, function() {
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

/** GET /api/sentences/:id?participant_id=:participant_id
Get single sentence

Returns more than just the sentence, though.
*/
R.get(/^\/api\/sentences\/(\d+)/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);

  async.parallel({
    sentences: function(callback) {
      db.Select('sentences')
      .whereEqual({id: m[1]})
      .limit(1)
      .execute(callback);
    },
    completed: function(callback) {
      db.Select('responses')
      .add('COUNT(*)::int')
      .whereEqual({participant_id: urlObj.query.participant_id})
      .execute(callback);
    },
    total: function(callback) {
      // without ::int, the `total` count would otherwise come out as a string
      db.Select('sentences').add('COUNT(*)::int').execute(callback);
    }
  }, function(err, results) {
    if (err) return res.error(err, req.headers);

    var sentence = results.sentences[0] || {};
    sentence.participant_completed = (results.completed[0] || {}).count || 0;
    sentence.participant_total = (results.total[0] || {}).count || 0;

    res.json(sentence);
  });
});

/** GET /api/sentences/next?participant_id=:participant_id
Get single sentence for participant

Non-REST, but forwards to the proper REST endpoint
*/
R.get(/^\/api\/sentences\/next/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);
  var participant_id = urlObj.query.participant_id || null;

  db.Select('sentences')
  .add('id')
  .where('id NOT IN (SELECT sentence_id FROM responses WHERE participant_id = ?)', participant_id)
  .orderBy('id ASC')
  .limit(1)
  .execute(function(err, rows) {
    if (err) return res.error(err, req.headers);
    if (rows.length === 0) {
      return res.error({message: 'No more sentences are available.', statusCode: 404}, req.headers);
    }

    urlObj.pathname = '/api/sentences/' + rows[0].id;
    res.redirect(url.format(urlObj));
  });
});

/** POST /api/sentences/:id
Update existing sentence (should be PUT)
*/
R.post(/^\/api\/sentences\/(\d+)$/, function(req, res, m) {
  auth.assertAuthorization(req, res, function() {
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
  auth.assertAuthorization(req, res, function() {
    db.Delete('sentences')
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.error(err, req.headers);

      res.status(204).end();
    });
  });
});

module.exports = R.route.bind(R);
