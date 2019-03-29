const url = require('url');
const path = require('path');
const Router = require('regex-router');
const send = require('send');

const auth = require('../auth');

const R = new Router(((req, res) => {
  const urlObj = url.parse(req.url);
  urlObj.pathname = '/experiment/';
  res.redirect(url.format(urlObj));
}));

R.any(/^\/experiment/, (req, res) => {
  req.url = '/ui/experiment/layout.html';
  R.route(req, res);
});

R.any(/^\/admin/, (req, res) => {
  auth.assertAuthorization(req, res, () => {
    req.url = '/ui/admin/layout.html';
    R.route(req, res);
  });
});

R.get('/info', (req, res) => {
  const package_json = require('../package.json');
  const info = {
    name: package_json.name,
    version: package_json.version,
    description: package_json.description,
  };
  res.json(info);
});

R.any(/^\/ui\/([^?]+)(\?|$)/, (req, res, m) => {
  const root = path.join(__dirname, '..', 'ui');
  send(req, m[1], {root: root})
  .on('error', (err) => {
    res.status(err.status || 500).die('send error: ' + err.message);
  })
  .on('directory', () => {
    res.status(404).die('No resource at: ' + req.url);
  })
  .pipe(res);
});

R.any(/^\/api/, require('./api'));

module.exports = R.route.bind(R);
