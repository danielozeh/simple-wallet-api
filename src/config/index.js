require('dotenv').config()

module.exports = {
    appName: process.env.APP_NAME || 'Simple Wallet API',
    env: process.env.NODE_ENV,
    secret: process.env.APP_SECRET,
    port: process.env.PORT,
    mongoURL: process.env.MONGO_URL,
    amqp: {
        url: process.env.AMQP_URL  
    },
    redis: {},
    imagePath: {},
    paystack: {
        secret: process.env.PAYSTACK_SECRET_KEY
    },
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN_NAME
    },
}