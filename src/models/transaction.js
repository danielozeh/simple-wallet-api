const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const {Schema, Types: { ObjectId, Map }} =  mongoose
const transaction_types = ['sent', 'received', 'cashout', 'top-up', 'request', 'declined', 'gift', 'received-gift', 'reversed']
const transaction = new Schema({
    sender: {
        user: {
            type: ObjectId,
            ref: 'User',
            default: null,
        },
        transaction_type: {
            type: String,
            enum: transaction_types,
            default: null
        }
    },
    recipient: {
        user: {
            type: ObjectId,
            ref: 'User',
            default: null,
        },
        transaction_type: {
            type: String,
            enum: transaction_types,
            default: null
        }
    },
    amount: { type: Number },
    fee: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: 'success'
    },
    transfer_code: String
}, {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at', deleted_at: 'deleted_at'}
})

transaction.statics = {
}

transaction.plugin(mongoosePaginate);
transaction.plugin(aggregatePaginate)
module.exports = mongoose.model('Transaction', transaction)
