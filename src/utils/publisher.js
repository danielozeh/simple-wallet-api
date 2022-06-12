const pub = require('../core/pubsub/publisher')

const publish = (name, {event, action, data}) => {
    return pub.publish(name, {
        event, action, data
    })
}
module.exports = {
    publish
}