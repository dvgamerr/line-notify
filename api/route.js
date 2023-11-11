module.exports = [
  // { method: 'GET', path: '/auth/sso', handler: require('./auth/sso') },
  // { method: 'POST', path: '/auth/login', handler: require('./auth/login') },
  // { method: 'POST', path: '/auth/user', handler: require('./auth/user') },

  // // API Bot
  // {
  //   method: 'PUT',
  //   path: '/system/notice/:msg',
  //   handler: require('./notice.js')
  // },
  // {
  //   method: 'PUT',
  //   path: '/line/:bot/:to',
  //   handler: require('./line-bot/to.js')
  // },
  // {
  //   method: 'POST',
  //   path: '/line/:bot',
  //   handler: require('./line-bot/index.js')
  // },

  // API Notify
  {
    method: 'GET',
    path: '/register/:serviceName/:roomName?',
    handler: require('./notify-bot/register')
  },
  {
    method: 'DELETE',
    path: '/revoke/:serviceName/:roomName',
    handler: require('./notify-bot/revoke')
  },
  {
    method: ['PUT', 'POST'],
    path: '/notify/:serviceName/:roomName',
    handler: require('./notify-bot/to.js')
  },

  // API UI
  {
    method: 'GET',
    path: '/api/dashboard',
    handler: require('./route-db/notify/dashboard')
  },

  // LINE Bot
  { method: 'GET', path: '/api/line', handler: require('./route-db/line-bot') },
  {
    method: 'GET',
    path: '/api/line/:bot/room',
    handler: require('./route-db/line-bot')
  },
  {
    method: 'GET',
    path: '/api/line/:bot/history',
    handler: require('./route-db/history')
  },

  // LINE Notify
  {
    method: 'GET',
    path: '/api/notify/:notify/room',
    handler: require('./route-db/line-notify')
  },
  {
    method: 'GET',
    path: '/api/notify/:notify/history',
    handler: require('./route-db/history')
  },

  {
    method: 'GET',
    path: '/api/history/:id',
    handler: require('./route-db/history')
  },

  {
    method: 'POST',
    path: '/api/notify',
    handler: require('./route-db/notify/new')
  },
  {
    method: 'POST',
    path: '/api/notify/update',
    handler: require('./route-db/notify/update')
  },
  {
    method: 'POST',
    path: '/api/notify/check',
    handler: require('./route-db/notify/check')
  },
  { method: 'POST', path: '/api/bot', handler: require('./route-db/bot/new') },
  {
    method: 'GET',
    path: '/api/check/stats',
    handler: require('./route-check/stats')
  },
  {
    method: 'GET',
    path: '/api/stats/bot/:name?',
    handler: require('./route-check/stats-bot')
  },
  {
    method: 'GET',
    path: '/api/stats/notify/:name?',
    handler: require('./route-check/stats-notify')
  },
  {
    method: 'GET',
    path: '/api/stats/slack',
    handler: require('./route-check/stats-slack')
  }

  // API Get Database
  // { method: 'GET', path: '/db/cmd', handler: require('./route-db/bot-cmd') },
  // { method: 'GET', path: '/db/cmd/endpoint', handler: require('./route-db/bot-endpoint') },
  // { method: 'GET', path: '/db/:bot/cmd', handler: require('./route-db/bot-cmd') },
  // { method: 'POST', path: '/db/:bot/cmd/:id', handler: require('./route-db/bot-cmd') },
  // { method: 'GET', path: '/db/:bot/inbound', handler: require('./route-db/history') },
  // { method: 'GET', path: '/db/:bot/outbound', handler: require('./route-db/outbound') },
  // { method: ['GET', 'PATCH', 'PUT'], path: '/line/:bot/{room}/{funcId}', handler: require('./line-bot/function') }

  // { method: 'POST', path: '/line/:bot/:to', handler: require('./webhook/push-webhook') },
  // { method: 'GET', path: '/webhook/:id', handler: require('./webhook') },

  // API Telegram
  // { method: 'PUT', path: '/telegram/:bot/:room', handler: require('./telegram/message') },

  // { method: 'PUT', path: '/flex/:name/:to', handler: require('./route-bot/push-flex') },

  // { method: 'POST', path: '/line/webhook/:type/:name/:to/:msg?', handler: require('./webhook/push-notify') },
]
