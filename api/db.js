const sqlite3 = require('sqlite3').verbose()
const logger = require('pino')()
const db = new sqlite3.Database(process.env.SQLITE_PATH || './notice.db')

const dbGetAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (e, r) => {
    if (e) return reject(e)
    resolve(r)
  })
})
const dbGetOne = async (sql, params) => {
  const result = await dbGetAll(sql, params)
  if (result) { return result[0] } else { return null }
}

const dbRun = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, (e) => {
    if (e) return reject(e)
    resolve()
  })
})

const uuid = (length, hex = false) => {
  let result = ''
  const characters = !hex ?  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' : 'abcdef0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const init = async () => {
  logger.info(`init database...`)
  return dbRun(`
  CREATE TABLE IF NOT EXISTS notify_auth (
    user_id VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    room VARCHAR NULL,
    state VARCHAR NULL,
    code VARCHAR NULL,
    redirect_uri VARCHAR NULL,
    access_token TEXT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notify_service (
    user_id VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    client_id VARCHAR NOT NULL,
    client_secret VARCHAR NOT NULL,
    active BOOLEAN DEFAULT true,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS history_notify (
    uuid VARCHAR(32) NOT NULL,
    category VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    room VARCHAR NOT NULL,
    sender TEXT NULL,
    error TEXT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );


  CREATE INDEX IF NOT EXISTS notify_auth_idx ON notify_auth(service, room);
  CREATE INDEX IF NOT EXISTS notify_service_idx ON notify_service(service, active);
  CREATE INDEX IF NOT EXISTS notify_auth_state_idx ON notify_auth(state);
  CREATE UNIQUE INDEX IF NOT EXISTS notify_service_unq ON notify_service (service);
  `)
}

module.exports = { uuid, db, dbGetAll, dbGetOne, dbRun, init }
