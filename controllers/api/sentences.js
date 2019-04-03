const async = require('async')
const Router = require('regex-router')
const url = require('url')

const db = require('../../db')
const auth = require('../../auth')

const R = new Router(((req, res) => {
  res.status(404).die('No resource at: ' + req.url)
}))

/** GET /api/sentences?

query: {
  order: string = 'view_order';
  direction: string = 'ASC';
  limit?: number;
}

List all sentences
*/
R.get(/^\/api\/sentences(\?|$)/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    const urlObj = url.parse(req.url, true)

    // prepare the query
    let select = db.Select('sentences')

    // set ORDER BY clause (this is kind of verbose, to avoid sql injection
    // vulnerability)
    let orderBy_column = 'view_order'
    if (urlObj.query.order == 'id') {
      orderBy_column = 'id'
    }
    else if (urlObj.query.order == 'language') {
      orderBy_column = 'language'
    }
    else if (urlObj.query.order == 'created') {
      orderBy_column = 'created'
    }
    const orderBy_direction = (urlObj.query.direction == 'DESC') ? 'DESC' : 'ASC'
    select = select.orderBy(orderBy_column + ' ' + orderBy_direction)

    // set LIMIT clause
    if (urlObj.query.limit) {
      select = select.limit(urlObj.query.limit)
    }

    select.execute((err, rows) => {
      if (err) return res.error(err, req.headers)

      res.ngjson(rows)
    })
  })
})

/** GET /api/sentences/new
Get blank (empty) sentence
*/
R.get(/^\/api\/sentences\/new$/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    db.Select('sentences')
    .add('MAX(view_order) AS max')
    .execute((err, rows) => {
      if (err) return res.error(err, req.headers)

      const max_view_order = (rows.length > 0) ? rows[0].max : 0
      res.json({
        id: null,
        active: true,
        language: 'en',
        view_order: max_view_order + 1,
        created: new Date(),
      })
    })
  })
})

/** POST /api/sentences
Insert new sentence
*/
R.post(/^\/api\/sentences$/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    req.readData((err, data) => {
      if (err) return res.error(err, req.headers)

      const {content, language, active, view_order} = data

      db.Insert('sentences')
      .set({content, language, active, view_order})
      .returning('*')
      .execute((insertErr, rows) => {
        if (insertErr) return res.error(insertErr, req.headers)

        res.status(201).json(rows[0])
      })
    })
  })
})

/** GET /api/sentences/:id?participant_id=:participant_id
Get single sentence

Returns more than just the sentence, though.
*/
R.get(/^\/api\/sentences\/(\d+)/, (req, res, m) => {
  const urlObj = url.parse(req.url, true)

  async.parallel({
    sentences: function(callback) {
      db.Select('sentences')
      .whereEqual({id: m[1]})
      .limit(1)
      .execute(callback)
    },
    completed: function(callback) {
      db.Select('responses')
      .add('COUNT(*)::int')
      .whereEqual({participant_id: urlObj.query.participant_id})
      .execute(callback)
    },
    total: function(callback) {
      // without ::int, the `total` count would otherwise come out as a string
      db.Select('sentences').add('COUNT(*)::int').execute(callback)
    },
  }, (err, results) => {
    if (err) return res.error(err, req.headers)

    const sentence = results.sentences[0] || {}
    sentence.participant_completed = (results.completed[0] || {}).count || 0
    sentence.participant_total = (results.total[0] || {}).count || 0

    res.json(sentence)
  })
})

/** GET /api/sentences/next?participant_id=:participant_id
Get single sentence for participant

Non-REST, but forwards to the proper REST endpoint
*/
R.get(/^\/api\/sentences\/next/, (req, res) => {
  const urlObj = url.parse(req.url, true)
  const participant_id = urlObj.query.participant_id || null

  db.Select('sentences')
  .add('id')
  .where('id NOT IN (SELECT sentence_id FROM responses WHERE participant_id = ?)', participant_id)
  .orderBy('view_order ASC')
  .limit(1)
  .execute((err, rows) => {
    if (err) return res.error(err, req.headers)
    if (rows.length === 0) {
      return res.error({message: 'No more sentences are available.', statusCode: 404}, req.headers)
    }

    urlObj.pathname = '/api/sentences/' + rows[0].id
    res.redirect(url.format(urlObj))
  })
})

/** POST /api/sentences/:id
Update existing sentence (should be PUT)
*/
R.post(/^\/api\/sentences\/(\d+)$/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    req.readData((err, data) => {
      if (err) return res.error(err, req.headers)

      const {content, language, active, view_order} = data

      db.Update('sentences')
      .whereEqual({id: m[1]})
      .setEqual({content, language, active, view_order})
      .returning('*')
      .execute((updateErr, rows) => {
        if (updateErr) return res.error(updateErr, req.headers)

        res.json(rows[0])
      })
    })
  })
})

/** DELETE /api/sentences/:id
Delete sentence
*/
R.delete(/^\/api\/sentences\/(\d+)$/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    db.Delete('sentences')
    .whereEqual({id: m[1]})
    .execute((err) => {
      if (err) return res.error(err, req.headers)

      res.status(204).end()
    })
  })
})

module.exports = R.route.bind(R)
