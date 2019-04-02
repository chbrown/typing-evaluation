const cluster = require('cluster')
const domain = require('domain')
const os = require('os')
const path = require('path')

const http = require('http-enhanced')

const root_controller = require('./controllers')
const db = require('./db')
const {logger} = require('./util')

const server = http.createServer((req, res) => {
  const request_domain = domain.create()
  request_domain.add(req)
  request_domain.add(res)
  request_domain.on('error', (err) => {
    logger.error('Domain: %s', err.stack)

    // let the master know we're dying
    cluster.worker.disconnect()

    // close down after 10s so that we don't drop current connections.
    setTimeout(() => {
      process.exit(1)
    }, 10000).unref()

    // stop taking new requests
    server.close()

    try {
      // try to send an error to the request that triggered the problem
      res.die('Exception encountered! ' + err.toString())
    }
    catch (internal_error) {
      // oh well, not much we can do at this point
      logger.error('Error responding with error! %s', internal_error.stack)
    }
  })
  request_domain.run(() => {
    logger.debug('%s %s', req.method, req.url)
    root_controller(req, res)
  })
})
.on('listening', () => {
  const address = server.address()
  const addressString = typeof address == 'string' ? address : `${address.address}:${address.port}`
  logger.info('server listening on http://%s', addressString)
})

/**
Create database and run migrations.
*/
function initialize(callback) {
  db.createDatabaseIfNotExists((createErr) => {
    if (createErr) {
      return callback(createErr)
    }
    const migrations_dirpath = path.join(__dirname, 'migrations')
    db.executePatches('_migrations', migrations_dirpath, (patchErr) => {
      callback(patchErr)
    })
  })
}

/**
This is the shared entry point for the cluster master and its workers.
*/
function start(port, hostname, forks) {
  if (cluster.isWorker) {
    // workers:
    server.listen(port, hostname)
  }
  else {
    // master:
    initialize(err => {
      if (err) throw err

      logger.info('Cluster master forking %d initial workers.', forks)
      for (let i = 0; i < forks; i++) {
        cluster.fork()
      }
      cluster.on('disconnect', (worker) => {
        logger.error('Cluster worker[%s] died. Forking a new worker.', worker.id)
        cluster.fork()
      })
    })
  }
}

function main() {
  const yargs = require('yargs')
  .describe({
    hostname: 'hostname to listen on',
    port: 'port to listen on',
    forks: 'number of workers to spawn',

    help: 'print this help message',
    verbose: 'print extra output',
    version: 'print version',
  })
  .boolean(['help', 'verbose', 'version'])
  .default({
    port: parseInt(process.env.PORT, 10) || 80,
    forks: os.cpus().length,
  })

  const argv = yargs.argv
  logger.level = argv.verbose ? 'debug' : 'info'
  logger.debug('Set logging level to %s', logger.level)

  if (argv.help) {
    yargs.showHelp()
  }
  else if (argv.version) {
    console.log(require('../package').version)
  }
  else {
    start(argv.port, argv.hostname, argv.forks)
  }
}

exports.main = main

if (require.main === module) {
  main()
}
