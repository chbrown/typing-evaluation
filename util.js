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

/** mapKeys(source: object, f: (key: string) => string): object

Return a new object with each key transformed by f.
Values are copied by reference
*/
function mapKeys(source, f) {
  const target = {}
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[f(key)] = source[key]
    }
  }
  return target
}

exports.mapKeys = mapKeys

/** mapValues(source: object, f: (value: any) => any): object

Return a new object with each value transformed by f.
*/
function mapValues(source, f) {
  const target = {}
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = f(source[key])
    }
  }
  return target
}

exports.mapValues = mapValues

/** simplify(value: any): string | number | boolean | null

Return a simplified representation of value.
  Date => string in ISO-8601 format
  undefined => null
  null => null
  string => string
  number => number
  boolean => boolean
  everything else => string via JSON.stringify()
*/
function simplify(value) {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value === null || value === undefined) {
    return null
  }
  const type = typeof value
  if (type == 'string' || type == 'number' || type == 'boolean') {
    return value
  }
  return JSON.stringify(value)
}

exports.simplify = simplify
