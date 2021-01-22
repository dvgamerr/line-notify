const sdk = require('@line/bot-sdk')
const Sentry = require('@sentry/node')
const { notice } = require('@touno-io/db/schema')
const { onEvents, onCommands } = require('../../line-bot/cmd')
const userCustom = require('../../line-bot/custom')

const _VERIFY_TOKEN = '00000000000000000000000000000000'

const getID = (e) => {
  if (!e || !e.source) { throw new Error('getID() :: Event is unknow source.') }
  return e.source[`${e.source.type}Id`]
}

const getVariable = async (e, name) => {
  const data = ((await notice.get('LineBotRoom').findOne({ id: getID(e) })) || {})
  return data.variable && data.variable[name] 
}

module.exports = async (req, res) => {
  const { bot } = req.params
  const { events } = req.body
  if (!events) { return res.end() }
  try {
    await notice.open()
    const { LineInbound, LineCMD, LineBot } = notice.get()

    const client = await LineBot.findOne({ botname: bot })
    if (!client) { throw new Error('LINE API bot is undefined.') }
    const { accesstoken, secret } = client

    if (!accesstoken || !secret) { throw new Error('LINE Channel AccessToken is undefined.') }

    const line = new sdk.Client({ channelAccessToken: accesstoken, channelSecret: secret })
    const lineSenderObj = msg => typeof msg === 'string' ? { type: 'text', text: msg } : typeof msg === 'function' ? msg() : msg
    const linePushId = ({ source }) => source[`${source.type}Id`]
    const lineMessage = async (e, sender) => {
      if (!sender) { return }

      if (typeof e === 'string') {
        await line.pushMessage(e, lineSenderObj(sender))
      } else if (e.replyToken) {
        await line.replyMessage(e.replyToken, lineSenderObj(sender))
      } else {
        await line.pushMessage(linePushId(e), lineSenderObj(sender))
      }
    }

    if (events.length) {
      for (const e of events) {
        if (e.replyToken === _VERIFY_TOKEN) { continue }
        await new LineInbound(Object.assign(e, { botname: bot })).save()
        if (await getVariable(e, 'bypass')) {
          const cmdIndex = await getVariable(e, 'index')
          if (e.type === 'message' && e.message.type === 'text') {
            const { text } = e.message
            
            const userId = await getVariable(e, 'userId')
            if (userId === e.source.userId) {
              const txtBot = /บอท|bot/i.exec(text)
              const txtCancel = /ยกเลิก|cancel|ปิด/i.exec(e.message.text)
              if (!txtBot || !txtCancel) continue

              await userCustom[bot][cmdIndex].bypass.call(this, e, lineMessage, line, true)
              continue
            }
          }
          await userCustom[bot][cmdIndex].bypass.call(this, e, lineMessage, line, false)
          continue
        }

        if (e.type === 'message' && e.message.type === 'text') {
          const { text } = e.message
          const { groups } = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/ig.exec(text) || {}
          
          if (groups) {
            const args = groups.arg.trim().split(' ').filter(e => e !== '')
            const cmd = await new LineCMD({
              botname: bot,
              userId: e.source.userId,
              command: groups.name,
              args: args.length ? args : null,
              text,
              event: e,
              executing: false,
              executed: false,
              updated: null,
              created: new Date()
            }).save()
  
            if (!e.replyToken || !groups || !onCommands[groups.name]) continue
              await LineCMD.updateOne({ _id: cmd._id }, { $set: { executing: true } })
            const result = await onCommands[groups.name].call(this, bot, args, e, line)
            await LineCMD.updateOne({ _id: cmd._id }, { $set: { executed: true } })
            await lineMessage(e, result)
          } else {
            const txtBot = /บอท|bot/i.exec(text)
            if (!txtBot || !userCustom[bot]) continue

            for (const custom of userCustom[bot]) {
              const cmdCustom = custom.cmd.filter(e => text.indexOf(e) > txtBot.index)
              if (!cmdCustom.length) continue
              await custom.job.call(this, e, lineMessage, line)
              break
            }
          }
        } else if (typeof onEvents[e.type] === 'function') {
          const result = await onEvents[e.type].call(this, bot, e, line)
          await lineMessage(e, result)
        } else if (e.type === 'postback') {
          await new LineCMD({
            botname: bot,
            userId: e.source.userId,
            command: e.type,
            args: null,
            text: e.postback.data,
            event: e,
            executing: false,
            executed: false,
            updated: null,
            created: new Date()
          }).save()
        }
      }
    } else {
      await new LineInbound(Object.assign(events, { botname: bot })).save()
    }
  } catch (ex) {
    Sentry.captureException(ex)
    console.error(ex)
    res.sendStatus(500)
  } finally {
    res.end()
  }
}
