const walletEvent = require('./events')
const mailgun = require('mailgun-js')
const config = require('../../config')

walletEvent.on('email.notification', (sub, msg) => {
    const { event, action, data } = walletEvent.messageContent(msg)
    console.log('Sending Email to User Begins Here')
    console.log(action)
    let template = ''
    if(action == 'SEND_FORGOT_PASSWORD') {
        template = 'forgot_password'
    }
    if(action == 'SEND_ACCOUNT_VERIFICATION') {
        template = 'create_account'
    }
    const mg = mailgun({ apiKey: config.mailgun.apiKey, domain: config.mailgun.domain })
    const msgdata = {
        from: "Daniel Ozeh noreply@danielozeh.com.ng",
        to: data.to,
        subject: data.subject,
        template: template,
        'v:subject': data.subject,
        'v:email': data.to,
        'v:otp': data.payload.otp
    }
    mg.messages().send(msgdata, function(error, body) {
        if(!error) {
            console.log(body)
            sub.ack(msg)
        }
    })
    //console.log('')
})

module.exports = walletEvent
