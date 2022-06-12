const moment = require('moment')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Verification = require('../models/verification')
const responseHandler = require('../utils/response')
const {publish} = require('../utils/publisher')


/**
 * 
 * @param {email, password} req 
 * @param {*} res 
 * @returns 
 * @method POST
 * @author Daniel Ozeh hello@danielozeh.com.ng
 */
exports.register = async(req, res) => {
    const {email, password} = req.body
    try {
        const passwordHash = User.getHashPassword(password)
        let user = await User.create({email, password: passwordHash})
        //create a verification code
        const otp = await User.getOTP()
        await Verification.create({
            user: user.id, code: otp, email, type: 'account_verification', expired_at: moment().add(1, 'hour')
        })

        //create a notofication and publish it to the queue
        const notification = 'email'
        const queueName = 'email.notification'
        const qMessage = {
            event: 'notification',
            action: 'SEND_ACCOUNT_VERIFICATION',
            data: {
                notification,
                to: email,
                subject: 'Verify Your Account',
                payload: {otp}
            }
        }
        await publish(queueName, qMessage)
        delete user.password
        return responseHandler.sendSuccess(res, {
            message: 'Account created successfully.',
            data: user
        })
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

exports.verifyEmail = async (req, res) => {
    const {otp, email} = req.body
    try {
        const verification = await Verification.findOne({code: otp, email}).exec()
        if (verification && verification.status !== 'used') {
            const update = {
                account_verified: true, account_verified_at: new Date(), status: 'active',
            }
            const user = await User.findByIdAndUpdate(verification.user, update, {new: true, projection: '-password'}).exec()
            if (user) {
                await verification.update({status: 'used'})
                return responseHandler.sendSuccess(res, {
                    message: 'Account verified successfully',
                    data: {
                        user,
                        access_token: User.generateToken({id: user.id}),
                        refresh_token: User.generateToken({id: user.id})
                    }
                })
            }
        }
        return responseHandler.sendError(res, {
            message: 'Invalid otp.'
        })
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

exports.resendEmail = async (req, res) => {
    const {email} = req.body
    try {
        const query = {email: email}
        const user = await User.findOne(query).lean()

        if (user && user.account_verified === true) {
            return responseHandler.sendError(res, {
                message: 'Account Already Verified.',
                status: 401
            })
        }
        if (user) {
            const otp = await User.getOTP()
            await Verification.findOneAndUpdate({user: user._id, type: 'account_verification'}, {
                user: user.id,
                status: 'unused',
                code: otp, expired_at: moment().add(1, 'hour'), email, type: 'account_verification'
            }, {upsert: true}).exec()

            const notification = 'email'
            const queueName = 'email.notification'
            const qMessage = {
                event: 'notification',
                action: 'SEND_ACCOUNT_VERIFICATION',
                data: {
                    notification,
                    to: email,
                    subject: 'Verify Your Account',
                    payload: {otp}
                }
            }
            await publish(queueName, qMessage)

            return responseHandler.sendSuccess(res, {
                message: 'OTP sent successfully.'
            })
        }
        return responseHandler.sendError(res, {
            message: 'Account not found.'
        })
    } catch(e) {
        return responseHandler.internalServerError(res)
    }
}

exports.login = async (req, res) => {
    const {email, password} = req.body
    const query = { email: email }
    const user = await User.findOne(query).lean().exec()
    if (user) {
        const isPassword = bcrypt.compareSync(password, user.password)
        if (isPassword) {
            if (user.account_verified !== true) {
                return responseHandler.sendError(res, {
                    message: 'Email address not verified.',
                    status: 401
                })
            }
            if(user.status != 'active') {
                return responseHandler.sendError(res, {
                    message: 'Account Not Active. Contact Support',
                    status: 401
                })
            }
            const token = await User.generateToken({id: user._id})
            delete user.password
            return responseHandler.sendSuccess(res, {
                message: 'Login Successfully.',
                data: {
                    user,
                    access_token: token,
                    refresh_token: token
                }
            })
        }
    }
    return responseHandler.sendError(res, {
        message: 'email/password not correct.',
        status: 401
    })
}

exports.forgotPassword = async (req, res) => {
    const {email} = req.body
    const query = {email}
    const notification = 'email.notification'
    const user = await User.findOne(query).lean()
    if (user) {
        const otp = User.getOTP()
        await Verification.findOneAndUpdate({user: user._id, type: 'forgot_password'}, {
            user: user._id || user.id,
            code: otp, expired_at: moment().add(1, 'hour'), email, type: 'forgot_password',
        }, {upsert: true}).exec()
        const qMessage = {
            event: 'notification',
            action: 'SEND_FORGOT_PASSWORD',
            data: {
                to: email,
                subject: 'Reset Your Password',
                payload: {otp}
            }
        }
        await publish(notification, qMessage)
        return responseHandler.sendSuccess(res, {
            message: 'Password reset link sent successfully.'
        })
    }
    return responseHandler.sendError(res, {
        message: 'No account found for this account.',
        status: 404
    })
}

exports.resetPassword = async (req, res) => {
    const {otp, password, email} = req.body
    const verification = await Verification.findOne({code: otp, email}).lean()
    if (verification) {
        const user = await User.findByIdAndUpdate(verification.user, {
            password: User.getHashPassword(password)
        }, ).exec()
        if (user) {
            return responseHandler.sendSuccess(res, {
                message: 'Password reset successfully.'
            })
        }
        return responseHandler.sendError(res, {message: 'Account not found.', status: 404})
    }
    return responseHandler.sendError(res, {
        message: verification && verification.status === 'used' ? 'Token used already.': 'Token not found.',
        status: 404
    })
}