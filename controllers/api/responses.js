const url = require('url')
const Router = require('regex-router')
const sv = require('sv')
const {Stringifier, ArrayStringifier} = require('streaming/json')
const {Sink} = require('streaming/sink')

const auth = require('../../auth')
const db = require('../../db')
const {logger, mapKeys, mapValues, simplify} = require('../../util')

const R = new Router(((req, res) => {
  res.status(404).die('No resource at: ' + req.url)
}))

function acceptRenderer(req, res) {
  // use this from http-enhanced, once it's there
  const urlObj = url.parse(req.url, true)
  // Handle ?accept= querystring values as well as Accept: headers, defaulting
  // to line-delimited JSON
  const accept_header = urlObj.query.accept || req.headers.accept || 'application/json; boundary=LF'
  // now check that header against the accept values we support
  if (accept_header.match(/application\/json;\s+boundary=(NL|LF|EOL)/)) {
    res.setHeader('Content-Type', 'application/json; boundary=LF')
    return new Stringifier()
  }
  else if (accept_header.match(/application\/json/)) {
    res.setHeader('Content-Type', 'application/json')
    return new ArrayStringifier()
  }
  else if (accept_header.match(/text\/csv/)) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    return new sv.Stringifier({peek: 100})
  }
  else if (accept_header.match(/text\/plain/)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return new sv.Stringifier({peek: 100})
  }
  else {
    const error = new Error('Cannot format response to match given Accept header')
    res.status(406).error(error, req.headers) // Not Acceptable
    return new Sink({objectMode: true})
  }
}

/** GET /api/responses
List all responses
*/
R.get(/^\/api\/responses(\?|$)/, (req, res) => {
  const urlObj = url.parse(req.url, true)
  let query = db.Select('responses').orderBy('id')

  // filter by participant if specified
  if (urlObj.query.participant_id) {
    query = query.whereEqual({participant_id: urlObj.query.participant_id})
  }
  if (urlObj.query.limit) {
    query = query.limit(urlObj.query.limit)
    // and add the full count
    query = query.add('responses.*', 'COUNT(responses.id) OVER() AS count')
  }

  query.execute((err, result) => {
    if (err) return res.error(err, req.headers)

    res.ngjson(result)
  })
})

/** POST /api/responses
Insert new response
*/
R.post(/^\/api\/responses$/, (req, res) => {
  req.readData((err, data) => {
    if (err) return res.error(err, req.headers)

    logger.info('inserting response: %j', data)

    // omit 'id' and 'created'
    const {participant_id, sentence_id, keystrokes} = data

    db.Insert('responses')
    .set({participant_id, sentence_id, keystrokes: JSON.stringify(keystrokes)})
    .returning('*')
    .execute((insertErr, rows) => {
      if (insertErr) return res.error(insertErr, req.headers)

      res.status(201).json(rows[0])
    })
  })
})

/** DELETE /api/responses/:id
Delete response
*/
R.delete(/^\/api\/responses\/(\d+)$/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    db.Delete('responses')
    .whereEqual({id: m[1]})
    .execute((err) => {
      if (err) return res.error(err, req.headers)

      res.status(204).end()
    })
  })
})

/** GET /api/responses/keystrokes

Export responses, one keystroke per row.
*/
R.get(/^\/api\/responses\/keystrokes(\?|$)/, (req, res) => {
  const urlObj = url.parse(req.url, true)

  let query = db.Select('responses, participants, sentences')
  .add([
    'responses.id AS response_id',
    'responses.keystrokes',
    'responses.created AS response_created',
    'participants.id AS participant_id',
    'participants.demographics AS participant_demographics',
    'participants.parameters AS participant_parameters',
    'sentences.id AS sentence_id',
    'sentences.content AS sentence_content',
  ])
  .where('sentences.id = responses.sentence_id')
  .where('participants.id = responses.participant_id')
  .orderBy('responses.id ASC')

  // filter by participant if specified
  if (urlObj.query.participant_id) {
    query = query.whereEqual({participant_id: urlObj.query.participant_id})
  }

  query.execute((err, rows) => {
    if (err) return res.error(err, req.headers)
    // http://kl:1451/api/responses?accept=text/plain

    const stringifier = acceptRenderer(req, res)
    stringifier.pipe(res)

    rows.forEach((row) => {
      const {response_id, response_created, participant_id, sentence_id, sentence_content} = row
      // prefix participant_{demographics,parameters} fields
      const participant_demographics = mapKeys(
        row.participant_demographics, key => `demographics_${key}`)
      const participant_parameters = mapKeys(
        row.participant_demographics, key => `parameters_${key}`)
      // merge with other row fields
      const rawRowObject = Object.assign({
        response_id,
        response_created,
        participant_id,
        sentence_id,
        sentence_content,
      }, participant_demographics, participant_parameters)
      const rowObject = mapValues(rawRowObject, simplify)
      row.keystrokes.forEach((keystroke) => {
        Object.assign(keystroke, rowObject)
        stringifier.write(keystroke)
      })
    })
    stringifier.end()
  })
})

module.exports = R.route.bind(R)
