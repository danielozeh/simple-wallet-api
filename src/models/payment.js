const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const helper = require('../utils/helper');

const {Schema, Types: { ObjectId, Map }} =  mongoose

const carriers = ['PAYSTACK', 'FLUTTERWAVE', 'MONIFY']
const payment = new Schema({
    owner: {type: ObjectId},
    transaction_reference: String,
    amount: Number,
    currency: {
        type: String,
        default: 'NGN'
    },
    status: {
        payment: {
            type: String,
            default: 'open'
        },
        transaction: {
            type: String,
            default: 'open'
        }
    },
    message: String,
    carrier: {
        type: String,
        default: 'PAYSTACK',
        enum: carriers
    },
    charged_amount: Number,
}, {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
})

payment.statics = {
    generateTransactionReference(user) {
        let transaction_reference = helper.randomString(32);
        return this.create({
            owner: user._id,
            transaction_reference,
            status: {
              transaction: 'open'
            }
        });
    },

    getTransactionReference(transaction_reference) {
        return this.findOne({ transaction_reference });
    },

    closeTransactionReference(transaction_reference) {
        return this.findOneAndUpdate({ transaction_reference: transaction_reference }, { status: 'closed' })
    },
    recordPayment({user, amount, charged_amount, payment_type, transaction_reference, payment_reference}) {
        const payment_transaction = {
            user: user,
            amount: amount,
            charged_amount: charged_amount,
            payment_type: payment_type,
            status: 'successful',
            payment_reference: payment_reference
        }
        return this.findOneAndUpdate({ transaction_reference: transaction_reference }, { payment_transaction: payment_transaction })
    }
}

payment.plugin(mongoosePaginate);
module.exports = mongoose.model('Payment', payment)
