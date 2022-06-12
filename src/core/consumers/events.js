'use strict'
const { EventEmitter } = require('events')
class WalletEmitter extends EventEmitter {
    constructor() {
        super();
        this.deffereEvents = []
    }

    defferedEmit(name, payload) {
        this.deffereEvents.push({ name, payload })
    }

    broadCastDefferedEmit() {
        if (this.deffereEvents.length === 0) {
            return false
        }
        const event = this.deffereEvents.shift();
        this.emit(event.name, event.payload)
        return true
    }

    messageContent(msg) {
        return msg.content.toString()
        //return JSON.parse(msg.content.toString())
    }
}

module.exports = new WalletEmitter()
