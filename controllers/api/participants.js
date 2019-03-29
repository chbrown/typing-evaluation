const _ = require('lodash');
const Router = require('regex-router');

const auth = require('../../auth');
const db = require('../../db');

const R = new Router(((req, res) => {
  res.status(404).die('No resource at: ' + req.url);
}));

/** GET /api/participants
List all participants
*/
R.get(/^\/api\/participants$/, (req, res) => {
  db.Select('participants')
  .orderBy('id')
  .execute((err, result) => {
    if (err) return res.error(err, req.headers);

    res.ngjson(result);
  });
});

/** GET /api/participants/new
Get blank (unsaved) participant
*/
R.get(/^\/api\/participants\/new$/, (req, res) => {
  res.json({id: null, created: new Date()});
});

/** POST /api/participants
Insert new participant
*/
R.post(/^\/api\/participants$/, (req, res) => {
  req.readData((err, data) => {
    if (err) return res.error(err, req.headers);

    const participant = _.pick(data, ['demographics', 'parameters']);

    db.Insert('participants')
    .set(participant)
    .returning('*')
    .execute((insertErr, rows) => {
      if (insertErr) return res.error(insertErr, req.headers);

      res.status(201).json(rows[0]);
    });
  });
});

/** GET /api/participants/:id
Get single participant
*/
R.get(/^\/api\/participants\/(\d+)$/, (req, res, m) => {
  db.Select('participants')
  .whereEqual({id: m[1]})
  .limit(1)
  .execute((err, rows) => {
    if (err) return res.error(err, req.headers);

    res.json(rows[0]);
  });
});

/** POST /api/participants/:id
Update existing participant (should be PUT)

Cannot require auth since we now have to create the participant before the
demographics get filled in.
*/
R.post(/^\/api\/participants\/(\d+)$/, (req, res, m) => {
  req.readData((err, data) => {
    if (err) return res.error(err, req.headers);

    const participant = _.pick(data, ['demographics', 'parameters']);

    db.Update('participants')
    .whereEqual({id: m[1]})
    .setEqual(participant)
    .returning('*')
    .execute((updateErr, rows) => {
      if (updateErr) return res.error(updateErr, req.headers);

      res.json(rows[0]);
    });
  });
});

/** DELETE /api/participants/:id
Delete participant
*/
R.delete(/^\/api\/participants\/(\d+)$/, (req, res, m) => {
  auth.assertAuthorization(req, res, () => {
    db.Delete('participants')
    .whereEqual({id: m[1]})
    .execute((deleteErr) => {
      if (deleteErr) return res.error(deleteErr, req.headers);

      res.status(204).end();
    });
  });
});

module.exports = R.route.bind(R);
