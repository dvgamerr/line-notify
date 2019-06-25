/* eslint-disable no-console */
const express = require('express')
const request = require('request-promise')
const bodyParser = require('body-parser')
const cron = require('node-cron')
const mongo = require('./mongodb')
const moment = require('moment')

const pkg = require('./package.json')
const port = process.env.PORT || 4000
const dev = !(process.env.NODE_ENV === 'production')
const app = express()
 

if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')
if (!process.env.SLACK_TOKEN) throw new Error('Token slack is undefined.')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/jsons
app.use(bodyParser.json())

// normal bot
app.post('/:bot', require('./route-bot/webhook'))
app.put('/:bot/:to?', require('./route-bot/push-message'))
app.put('/flex/:name/:to', require('./route-bot/push-flex'))

// fixed line-bot to slack without change req data.
app.post('/slack/:channel', require('./route-bot/push-slack'))


app.get('/db/:bot/cmd', require('./route-db/bot-cmd'))
app.post('/db/:bot/cmd/:id', require('./route-db/bot-cmd'))
app.get('/db/:bot/inbound', require('./route-db/inbound'))
app.get('/db/:bot/outbound', require('./route-db/outbound'))

app.get('/stats', require('./route-db/stats'))

app.use('/static', express.static('./static'))
app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))


// const lineAlert = require('./flex/alert')
// An access token (from your Slack app or custom integration - xoxp, xoxb)
const slackStats = require('./flex/stats')

const { slackMessage } = require('./slack-bot')

const pkgChannel = 'api-line-bot'
const pkgName = `LINE-BOT v${pkg.version}`
const errorToSlack = async ex => {
  const icon = 'https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png'
  await slackMessage(pkgChannel, pkgName, {
    text: ex.message,
    blocks: [
      {
        type: 'context',
        elements: [ { type: 'image', image_url: icon, alt_text: 'ERROR' }, { type: 'mrkdwn', text: `*${ex.message}*` } ]
      },
      { type: 'section', text: { type: 'mrkdwn', text: ex.stack ? ex.stack : '' } }
    ]
  })
}

const lineInitilize = async () => {
  const { LineBot } = mongo.get()
  let date = moment().add(7, 'hour').add(-1, 'day')

  let data = await LineBot.find({ type: 'line' })
  for (const line of data) {
    const opts = { headers: { 'Authorization': `Bearer ${line.accesstoken}` }, json: true }

    let quota = await request('https://api.line.me/v2/bot/message/quota', opts)
    let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
    let reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
    let push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

    let stats = {
      usage : consumption.totalUsage,
      limited : quota.type === 'limited' ? quota.value : 0,
      reply: reply.status === 'ready' ? reply.success : reply.status,
      push: push.status === 'ready' ? push.success : push.status,
      updated: date.toDate()
    }
    await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
  }
}

const scheduleDenyCMD = async () => {
  const { LineCMD } = mongo.get()
  await LineCMD.updateMany({ created : { $lte: new Date(+new Date() - 300000) }, executing: false, executed: false }, {
    $set: { executed: true }
  })
}
const scheduleStats = async () => {
  let { LineBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  let data = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
  data = data.map(e => {
    return { botname: e.botname, name: e.name, stats: e.options.stats }
  })
  
  await slackMessage(pkgChannel, pkgName, slackStats(pkgName, data))
}

// let logs = ''
mongo.open().then(async () => {
  await app.listen(port)
  if (!dev) {
    // const { ServiceStats } = mongo.get()
    // GMT Timezone +7 Asia/Bangkok
    lineInitilize().catch(errorToSlack)
    cron.schedule('0 0,6,12,18 * * *', () => lineInitilize().catch(errorToSlack))
    cron.schedule('* * * * *', () => scheduleDenyCMD().catch(errorToSlack))
    cron.schedule('0 7 * * *', () => scheduleStats().catch(errorToSlack))
    cron.schedule('0 3 * * *', async () => {
      await slackMessage(pkgChannel, pkgName, '*Heroku* server has terminated yourself.')
      process.exit()
    })
    // const bot = await ServiceStats.find({ name: 'line-bot' })
    // if (!bot) {
    //   await new ServiceStats({ name: 'line-bot', type: 'heroku', desc: 'line bot server.', wan_ip: 'unknow', lan_ip: 'unknow', online: true }).save()
    // }
    // restart line-bot notify.
    await slackMessage(pkgChannel, pkgName, '*Heroku* server has `rebooted`, and ready.')
  }
}).catch(async ex => {
  errorToSlack(ex).then(() => process.exit())
})
