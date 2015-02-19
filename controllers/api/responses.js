var _ = require('lodash');
var logger = require('loge');
var url = require('url');
var Router = require('regex-router');
var sv = require('sv');
var streaming = require('streaming');

var auth = require('../../auth');
var db = require('../../db');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

function acceptRenderer(req, res) {
  // use this from http-enhanced, once it's there
  var urlObj = url.parse(req.url, true);
  // Handle ?accept= querystring values as well as Accept: headers, defaulting
  // to line-delimited JSON
  var accept_header = urlObj.query.accept || req.headers.accept || 'application/json; boundary=LF';
  // now check that header against the accept values we support
  if (accept_header.match(/application\/json;\s+boundary=(NL|LF|EOL)/)) {
    res.setHeader('Content-Type', 'application/json; boundary=LF');
    return new streaming.json.Stringifier();
  }
  else if (accept_header.match(/application\/json/)) {
    res.setHeader('Content-Type', 'application/json');
    return new streaming.json.ArrayStringifier();
  }
  else if (accept_header.match(/text\/csv/)) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return new sv.Stringifier({peek: 100});
  }
  else if (accept_header.match(/text\/plain/)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return new sv.Stringifier({peek: 100});
  }
  else {
    var error = new Error('Cannot format response to match given Accept header');
    res.status(406).error(error, req.headers);
    return new streaming.Sink({objectMode: true});
  }
}

/** GET /api/responses
List all responses
*/
R.get(/^\/api\/responses(\?|$)/, function(req, res) {
  var urlObj = url.parse(req.url, true);
  var query = db.Select('responses').orderBy('id');

  // filter by participant if specified
  if (urlObj.query.participant_id) {
    query = query.whereEqual({participant_id: urlObj.query.participant_id});
  }

  query.execute(function(err, result) {
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
    .returning('*')
    .execute(function(err, rows) {
      if (err) return res.error(err, req.headers);

      res.status(201).json(rows[0]);
    });
  });
});

/** flattenValues(obj: Object)

Convert all values in object to primitives.
*/
function flattenValues(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key];
      if (typeof value != 'string') {
        obj[key] = JSON.stringify(obj[key]);
      }
    }
  }
}

/** extendPrefixed(target: Object, prefix: string, source: Object)

Sort of like _.extend(target, source), but prefix all keys in source when copying.
*/
function extendPrefixed(target, prefix, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      target[prefix + key] = source[key];
    }
  }
}

/** GET /api/responses/keystrokes

Export responses, one keystroke per row.
*/
R.get(/^\/api\/responses\/keystrokes(\?|$)/, function(req, res) {
  var urlObj = url.parse(req.url, true);

  var query = db.Select('responses, participants, sentences')
  .add([
    'responses.id AS response_id',
    'responses.keystrokes',
    'responses.created AS response_created',
    'participants.id AS participant_id',
    'participants.demographics AS participant_demographics',
    'sentences.id AS sentence_id',
    'sentences.text AS sentence_text',
  ])
  .where('sentences.id = responses.sentence_id')
  .where('participants.id = responses.participant_id')
  .orderBy('responses.id ASC');

  // filter by participant if specified
  if (urlObj.query.participant_id) {
    query = query.whereEqual({participant_id: urlObj.query.participant_id});
  }

  query.execute(function(err, rows) {
    if (err) return res.error(err, req.headers);
    // http://kl:1451/api/responses?accept=text/plain

    var stringifier = acceptRenderer(req, res);
    stringifier.pipe(res);

    rows.forEach(function(row) {
      row.keystrokes.forEach(function(keystroke) {
        // keystroke.timestamp = new Date(keystroke.timestamp).toISOString();
        keystroke.response_id = row.response_id;
        keystroke.response_created = row.response_created.toISOString();
        keystroke.participant_id = row.participant_id;
        keystroke.sentence_id = row.sentence_id;
        keystroke.sentence_text = row.sentence_text;

        flattenValues(row.participant_demographics);
        extendPrefixed(keystroke, 'demographics_', row.participant_demographics);

        stringifier.write(keystroke);
      });
    });
    stringifier.end();
  });
});

module.exports = R.route.bind(R);
