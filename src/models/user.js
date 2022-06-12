const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const config = require('../config')

const {Schema, Types: { ObjectId, Map }} =  mongoose
const statuses = ['active', 'blocked', 'suspended', 'deleted']
const carriers = ['PAYSTACK', 'FLUTTERWAVE', 'MONIFY']
const user = new Schema({
    first_name: String,
    last_name: String,
    email: {type: String, unique: true},
    phone: {
        type: String,
        default: null
    },
    gender: String,
    address: String,
    country: String,
    date_of_birth: Date,
    account_verified: Boolean,
    account_verified_at: Date,
    status: {
        type: String, 
        enum: statuses
    },
    avatar: {
        type: String,
        default: 'avatar.png'
    },
    password: String,
    wallet_balance: {
        type: Number,
        default: 0
    },
    ip_addresses: [{
        type: String
    }],
    secret_key : {
        type: String,
        default: null
    },
    public_key: {
        type: String,
        default: null
    },
    test_secret_key: {
        type: String,
        default: null
    },
    test_public_key: {
        type: String,
        default: null
    },
    cards: [{
        first6: {
            type: String
        },
        last4: {
            type: String
        },
        reusable: Boolean,
        issuer: String,
        country: String,
        card_type: String,
        token: String,
        expiry: String,
        customer: {
            email: String,
            name: String,
            phone_number: String
        },
        carrier: {
            type: String,
            enum: carriers,
            default: "PAYSTACK"
        }
    }],
    kyc: {
        bvn: String,
        account_number: Number,
        bvn_verified: Boolean,
        account_name: String,
        bank: String
    },
    banks: [{
        account_number: String,
        account_name: String,
        bank: String
    }],
    beneficiaries: [{
        user_id: {
            type: ObjectId,
            ref: 'User',
        },
        date_added: {
            type: Date,
            default: new Date()
        }
    }]
}, {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at', deleted_at: 'deleted_at'}
})

user.statics = {
    getOTP() {
      return Math.floor(1000 + Math.random() * 9000)
    },
    generateToken(user) {
        const token = jwt.sign(user, config.secret)
        return token
    },
    getHashPassword(password) {
        const salt = bcrypt.genSaltSync()
        return bcrypt.hashSync(password, salt)
    },
    hashPassword(password) {
        const token = this.getHashPassword(password)
        return token.replace(/\//g, '-')
    }
}

user.plugin(mongoosePaginate);
module.exports = mongoose.model('User', user)