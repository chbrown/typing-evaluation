/*jslint node: true */
var path = require('path');
var logger = require('loge');

var db = require('./db');

function die(err) {
  logger.error('Encountered error while initializing: %s', err);
  logger.error(err);
  process.exit(1);
}

db.createDatabaseIfNotExists(function(err, exists) {
  if (err) return die(err);

  var migrations_dirpath = path.join(__dirname, 'migrations');
  db.executePatches('_migrations', migrations_dirpath, function(err) {
    if (err) return die(err);

    process.exit(0);
  });
});
