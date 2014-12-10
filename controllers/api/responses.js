/*jslint node: true */
var _ = require('lodash');
var logger = require('loge');
var url = require('url');
var Router = require('regex-router');

var auth = require('../../auth');
var db = require('../../db');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/responses
List all responses
*/
R.get(/^\/api\/responses(\?|$)/, function(req, res) {
  var urlObj = url.parse(req.url, true);

  db.Select('responses')
  .orderBy('id')
  .whereEqual({
    participant_id: urlObj.query.participant_id,
  })
  .execute(function(err, result) {
    if (err) return res.error(err, req.headers);

    res.ngjson(result);
  });
});

/** POST /api/responses
Insert new response
*/
R.post(/^\/api\/responses$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.error(err, req.headers);

    data = _.omit(data, ['id', 'created']);

    data.keystrokes = JSON.stringify(data.keystrokes);

    logger.info('inserting response: %j', data);

    db.Insert('responses')
    .set(data)
    .execute(function(err, rows) {
      if (err) return res.error(err, req.headers);

      res.status(201).json(rows[0]);
    });
  });
});

module.exports = R.route.bind(R);
