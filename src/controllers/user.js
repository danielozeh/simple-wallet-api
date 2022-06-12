const User = require('../models/user');
const moment = require('moment')
const bcrypt = require('bcrypt')
const responseHandler = require('../utils/response');
const Paginator = require('../utils/paginator')

exports.changePassword = async (req, res) => {
    let user = req.user 
    let {old_password, new_password} = req.body
    if (user) {
        const isPassword = bcrypt.compareSync(old_password, user.password)
        if (isPassword) {
            await User.findByIdAndUpdate(user.id, {password: User.getHashPassword(new_password)}).exec()
            return responseHandler.sendSuccess(res, {
                message: 'Password change successfully.',
                data: user
            })
        }
        return responseHandler.sendError(res, {
            message: 'Old password not correct.'
        })
    }
    return responseHandler.sendError(res, {
        status: 404,
        message: 'Account not found.'
    })
}

exports.me = async (req, res) => {
    const user = req.user
    delete user.banks
    delete user.kyc
    delete user.cards
    return responseHandler.sendSuccess(res, {
        message: 'My Profile',
        data: user
    })
}

exports.editMe = async (req, res) => {
    const payload = req.body
    let user = req.user

    delete payload.email
    delete payload.password
    delete payload.banks
    delete payload.wallet_balance
    user = await User.findByIdAndUpdate(user._id, payload, {new: true, projection: '-kyc -banks'}).lean().exec()
    delete user.password
    delete user.banks
    delete user.cards
    return responseHandler.sendSuccess(res, {
        message: 'Profile updated successfully.',
        data: user
        
    })
}

exports.findUser = async(req, res) => {
    const user = req.user
    let {name, page, limit} = req.query
    const pageOptions = {
        select: 'phone email first_name last_name wallet_balance gender created_at updated_at avatar',
        page: page || 1,
        limit: limit || 25,
        lean: true
    }
    try {
        const userInfo = await User.paginate({ 
            account_verified: true,
            status: 'active',
            $or:[
                { 
                    first_name: {$regex: name, $options: 'i'}
                },
                { 
                    last_name: {$regex: name, $options: 'i'}
                },
                { 
                    username: {$regex: name, $options: 'i'}
                }
            ]
        }, pageOptions)

        return responseHandler.sendSuccess(res, {
            message: 'All Users',
            data: {users: userInfo.docs, pagination: Paginator.build(userInfo)}
        });
    } catch (error) {
        return responseHandler.internalServerError(res)
    }
}

exports.checkEmail = async (req, res) => {
    const { email } = req.body
    try {
        let check = await User.findOne({ email: email }).lean().exec()
        if(check) {
            return responseHandler.sendError(res, {
                message: 'Email Already Exist.',
                status: 400
            })   
        }
        return responseHandler.sendSuccess(res, {
            message: 'Email does not exist.',
            data: null
        })
    } catch(error) {
        console.log(error)
        return responseHandler.internalServerError(res)
    }
}