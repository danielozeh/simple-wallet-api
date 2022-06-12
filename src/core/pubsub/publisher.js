const amqp = require('amqp-connection-manager')

const {exchange, type} = require('./constants')
const config = require('../../config')

const connection = amqp.connect([config.amqp.url])
connection.on('connect', () => console.log('mqp connected'))
connection.on('disconnect', err => console.log('mqp disconnected', err.stack))

const channelWrapper = connection.createChannel({
    json: true,
    setup: channel => channel.assertExchange(exchange, type, {durable: true})
})

const publish = (key, message) => {
    console.log('sending message to queue')
    channelWrapper.publish(exchange, key, message).then(pub => {
        console.log('message published', pub)
    }).catch(e => {
        console.log('Message was rejected', e.stack)
    })
}

module.exports = {publish, channelWrapper}
