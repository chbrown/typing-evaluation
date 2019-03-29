const Router = require('regex-router');

const R = new Router(((req, res) => {
  res.status(404).die('No resource at: ' + req.url);
}));

// R.post(/^\/api\/access_tokens\/authenticateUser$/, function(req, res) {
//   req.readData(function(err, data) {
//     if (err) return res.error(err, req.headers);
//     // artificially slow this down to dissuade brute force attacks
//     setTimeout(function() {
//       auth.authenticateUser(data.email, data.password, function(err, access_token) {
//         if (err) return res.error(err, req.headers);

//         res.json(access_token);
//       });
//     }, 500);
//   });
// });

module.exports = R.route.bind(R);
