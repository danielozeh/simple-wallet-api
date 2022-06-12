const axios = require('axios')
const config = require('../config')
const paystack = axios.create({
    baseURL: 'https://api.paystack.co/',
    headers: {
        Authorization: `Bearer ${config.paystack.secret}`,
        'Content-Type': 'application/json'
    }
})

const verifyBvn = (bvnData) => {
    return paystack.post('/bvn/match', bvnData)
    .then(({data})=> data)
        .catch(({response}) => response)
}

const verifyAccountNumber  = (account) => {
    return paystack.get('/bank/resolve?'+account)
    .then(({data})=> data)
    .catch(({response}) => response)
}

module.exports = {
    verifyBvn,
    verifyAccountNumber,
    paystack
}