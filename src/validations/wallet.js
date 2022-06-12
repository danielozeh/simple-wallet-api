const Joi = require('joi')

module.exports = {
    generateTransRef: Joi.object({
        carrier: Joi.string().required(),
    }),

    giftMoney: Joi.object({
        recipient: Joi.required(),
        amount: Joi.required()
    }),

    verifyTransaction: Joi.object({
        transaction_reference: Joi.string().required()
    }),

    verifyPayment: Joi.object({
        ref: Joi.string().required()
    }),

    verifyAccountDetails: Joi.object({
        bvn: Joi.string().required(),
        account_number: Joi.string().required(),
        bank: Joi.string().required()
    }),

    verifyBankAccount: Joi.object({
        account_number: Joi.string().required(),
        bank: Joi.string().required()
    }),

    requestMoney: Joi.object({
        requestFrom: Joi.string().required(),
        amount: Joi.number().required()
    }),

    withdrawMoney: Joi.object({
        amount: Joi.number().required(), 
        bank: Joi.string().required(), 
        account_number: Joi.string().required(),
        account_name: Joi.string().required()
    }),
    addBeneficiary: Joi.object({
        beneficiary: Joi.string().required()
    })
}
