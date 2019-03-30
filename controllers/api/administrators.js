const Router = require('regex-router')

const db = require('../../db')
const auth = require('../../auth')

const R = new Router(((req, res) => {
  res.status(404).die('No resource at: ' + req.url)
}))

/** GET /api/administrators
List all administrators
*/
R.get(/^\/api\/administrators(\?|$)/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    db.Select('administrators')
    .orderBy('id')
    .execute((err, rows) => {
      if (err) return res.error(err, req.headers)
      res.ngjson(rows)
    })
  })
})

/** GET /api/administrators/new
Get blank (empty) administrator
*/
R.get(/^\/api\/administrators\/new$/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    res.json({created: new Date()})
  })
})

/** POST /api/administrators
Insert new administrator.
*/
R.post(/^\/api\/administrators$/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    req.readData((err, data) => {
      if (err) return res.error(err, req.headers)

      // storing the password in the clear!
      const {email, password} = data

      db.Insert('administrators')
      .set({email, password})
      .returning('*')
      .execute((insertErr, rows) => {
        if (insertErr) return res.error(insertErr, req.headers)

        res.status(201).json(rows[0])
      })
    })
  })
})

/** GET /api/administrators/:id
Get single administrator
*/
R.get(/^\/api\/administrators\/(\d+)/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    db.Select('administrators')
    .whereEqual({id: m[1]})
    .limit(1)
    .execute((err, rows) => {
      if (err) return res.error(err, req.headers)

      res.json(rows[0])
    })
  })
})

/** POST /api/administrators/:id
Update existing administrator (should be PUT)
*/
R.post(/^\/api\/administrators\/(\d+)$/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    req.readData((err, data) => {
      if (err) return res.error(err, req.headers)

      const {email, password} = data

      db.Update('administrators')
      .whereEqual({id: m[1]})
      .setEqual({email, password})
      .returning('*')
      .execute((updateErr, rows) => {
        if (updateErr) return res.error(updateErr, req.headers)

        res.json(rows[0])
      })
    })
  })
})

/** DELETE /api/administrators/:id
Delete administrator
*/
R.delete(/^\/api\/administrators\/(\d+)$/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    db.Delete('administrators')
    .whereEqual({id: m[1]})
    .execute((deleteErr) => {
      if (deleteErr) return res.error(deleteErr, req.headers)

      res.status(204).end()
    })
  })
})

module.exports = R.route.bind(R)
