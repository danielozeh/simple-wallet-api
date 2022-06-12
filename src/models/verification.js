const mongoose = require('mongoose')

const Schema = mongoose.Schema

const verification = new Schema({
    user: {type: mongoose.Types.ObjectId, ref: 'User'},
    code: String,
    email: String,
    expired_at: Date,
    status: {type: String, default: 'unused'},
    type: String
}, {

    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at', deleted_at: 'deleted_at'}
})

module.exports = mongoose.model('Verification', verification)
