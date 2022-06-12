const Joi = require('joi')

const User = require('../models/user')

const check = async (d) => {
    const q = d.indexOf('@') == -1 ? {phone: d} : {email: d}
    const user = await User.findOne(q).exec()
    if (user) {
        throw Error('email already exists.')
    }
}

module.exports = {
    register: Joi.object({
        email: Joi.required('email', {is: Joi.exist(), then: Joi.string().email().external(check).required()}),
        password: Joi.string().required(),
        confirm_password: Joi.string().required().valid(Joi.ref('password')),
    }),

    login: Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required(),
    }),

    resendOTP: Joi.object({
        email: Joi.string().required().email()
    }),

    verifyEmail: Joi.object({
        email: Joi.string().required().email(),
        otp: Joi.string().required()
    }),
    resetPassword: Joi.object({
        otp: Joi.string().required(),
        password: Joi.string().required(),
        email: Joi.string().email().required()
    }),
    changePassword: Joi.object({
        old_password: Joi.string().required(),
        new_password: Joi.string().required()
    }),
    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),
    checkEmail: Joi.object({
        email: Joi.string().email().required()
    })
}
