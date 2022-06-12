const http = require('http')

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const helmet = require('helmet')

const config = require('../../config')
const router = require('../../routes')
const subcriber = require('../pubsub/subscriber')

const rawBodySaver = function (req, _res, buf, encoding) {
    if (buf && buf.length)req.rawBody = buf.toString(encoding || 'utf8');
}
const app = express()
app.use(express.static('.'));
app.use(cors())
app.use(bodyParser.json({limit: '50mb', verify: rawBodySaver}))
app.use(bodyParser.urlencoded({limit: '50mb', verify: rawBodySaver, extended: false}))
app.use(morgan('dev'))
app.use(helmet())
app.use(router)

const startAPI = () => {
    const server = http.createServer(app)
    server.listen(config.port, (err) => {
        if (err) {
            console.log(`API could not be start`, err)
            process.exit(-1)
        }
        subcriber.waitForConnect(done => {
            console.log('done connecting', done)
        })
        //redisInstance()
        console.log('API started on ', config.port)
    })
}

module.exports = {
    startAPI
}
