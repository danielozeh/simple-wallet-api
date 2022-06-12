const mongoose = require('mongoose')
const config = require('../../config')

mongoose.connection.on('connected', () => {
    console.log(`API-DB Ready!`)
})

mongoose.connection.on('disconnected', (err) => {
    console.log(`API-DB disconnect from MongoDB via Mongoose because of ${err}`)
})

mongoose.connection.on('error', (err) => {
    console.log(`Could not connect to API-DB because of ${err}`)
    process.exit(-1)
})
exports.connect = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(config.mongoURL, {
            useNewUrlParser: true,

            maxPoolSize: 2,
            socketTimeoutMS: 600000, //kill idle connections after 10 minutes
            useUnifiedTopology: true
        }).then(() => {
            resolve(mongoose.connection)
        }).catch(err => reject(err))
    })
}
