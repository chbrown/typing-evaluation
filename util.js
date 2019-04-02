const {createLogger, format, transports} = require('winston')

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.label({label: process.pid}),
    format.splat(),
    format.printf(info => {
      const {level, message, label, timestamp} = info
      return `${timestamp} [${label}] ${level.padEnd(7)} ${message}`
    })
  ),
  transports: [
    new transports.Console(),
  ],
})

exports.logger = logger
