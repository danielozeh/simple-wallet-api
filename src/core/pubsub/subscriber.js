const amqp = require('amqp-connection-manager')
const consumer = require('../consumers')
const {exchange, type, queueName, routingKeys} = require('./constants')
const config = require('../../config')
const connection = amqp.connect([config.amqp.url])
connection.on('connect', () => console.log('subscriber Connected!'));
connection.on('disconnect', err => console.log('sSubscriber Disconnected.', err));
const handler = msg => {
    const channelName = msg.fields.routingKey
    //console.log(channelName, msg.content?.toString())
    //console.log(channelWrapper)
    consumer.emit(channelName, channelWrapper, msg)
}
const channelWrapper = connection.createChannel({
    setup: channel => {
        const bind = () => {
            const rKeys = routingKeys || [queueName]
            rKeys.forEach(rKey => {
                channel.bindQueue(queueName, exchange, rKey)
            })
            //console.log(channel.pending)
            return channel
        }
        return Promise.all([
            channel.assertQueue(queueName, { exclusive: false}),
            channel.assertExchange(exchange, type),
            channel.prefetch(1),
            //channel.bindQueue(queueName, queueName, '#'),
            bind(),
            channel.consume(queueName, handler)
        ])
    }
})

module.exports = channelWrapper