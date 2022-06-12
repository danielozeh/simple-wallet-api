const config = require('../config');
const Payment = require('../models/payment');
const Transaction = require('../models/transaction');
const responseHandler = require('../utils/response');
const Paginator = require('../utils/paginator');
const User = require('../models/user');
const {verifyBvn, verifyAccountNumber, paystack} = require('../utils/paystack')
const BankList = require('../utils/bankList');

exports.generateTransactionReference = async(req, res) => {
    let user = req.user
    let reference = await Payment.generateTransactionReference(user)

    return responseHandler.sendSuccess(res, {
        message: 'Transaction Reference',
        data: reference
    });
}

exports.addBeneficiary = async(req, res) => {
    let user = req.user
    const { beneficiary } = req.body
    try {
        let isBeneficiaryExist = false
        //check if user exist
        const isUserExist = await User.findById(beneficiary).lean().exec()
        if(isUserExist) {
            //check if user exst in my beneficiary
            const myBeneficiary = (user.beneficiaries) ? user.beneficiaries : []
            Promise.all(myBeneficiary.map(data => {
                if(String(data.user_id) == String(beneficiary)) {
                    isBeneficiaryExist = true
                }
            }))
            if(isBeneficiaryExist) {
                return responseHandler.sendError(res, {
                    message: 'Beneficiary already exist'
                })
            }
            const addB = await User.findByIdAndUpdate(user._id, {
                $addToSet: {
                    beneficiaries: {
                        user_id: beneficiary,
                        date_added: new Date().toISOString()
                    }
                }
            })
            return responseHandler.sendSuccess(res, {
                message: 'Beneficiary Added',
                data: addB.beneficiaries
            })
        }
        return responseHandler.sendError(res, {
            message: 'User does not exist'
        })
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.removeBeneficiary = async(req, res) => {
    let user = req.user
    const { beneficiaryId } = req.params
    try {
        let isBeneficiaryRemoved = false
        let myBeneficiary = (user.beneficiaries) ? user.beneficiaries : []
        Promise.all(myBeneficiary = myBeneficiary.map(async data => {
            if(String(data._id) == String(beneficiaryId)) {
                isBeneficiaryRemoved = true
            }
        }))
        if(isBeneficiaryRemoved) {
            await User.findByIdAndUpdate(user._id, {
                $pull: {
                    beneficiaries: {
                        _id: beneficiaryId
                    }
                }
            })
            return responseHandler.sendSuccess(res, {
                message: 'Beneficiary removed',
            })
        }
        return responseHandler.sendError(res, {
            message: 'Beneficiary does not exist'
        })
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.sendMoney = async(req, res) => {
    let user = req.user
    let { recipient, amount } = req.body;
    try {
        let isBeneficiary = false
        const myBeneficiary = (user.beneficiaries) ? user.beneficiaries : []
        Promise.all(myBeneficiary.map(data => {
            if(String(data.user_id) == String(recipient)) {
                isBeneficiary = true
            }
        }))
        if(!isBeneficiary) {
            return responseHandler.sendError(res, {
                message: 'you can only send money to your beneficiary'
            })
        }
        //get user wallet balance
        let walletBalance = (user.wallet_balance) ? user.wallet_balance : 0
        
        //check if walletBalance is greater than or equal to amount to be sent
        if(walletBalance > Number(amount)) {
            //record new balance
            await User.findByIdAndUpdate(user._id, {
                $inc: {wallet_balance: -Number(amount)},
            });

            await User.findByIdAndUpdate(recipient, {
                $inc: {wallet_balance: Number(amount)},
            })

            //record the wallet transaction
            const transact = await Transaction.create({
                sender: {
                    user: user._id,
                    transaction_type: 'sent'
                },
                recipient: {
                    user: recipient,
                    transaction_type: 'received'
                },
                amount: amount
            });

            return responseHandler.sendSuccess(res, {
                message: 'Send money successful',
                data: transact
            });
        }
        return responseHandler.sendError(res, {
            message: 'Insufficient Balance... Top Up',
            status: 422
        });
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.requestMoney = async(req, res) => {
    let user = req.user
    const { requestFrom, amount } = req.body;
    try {
        const transaction = await Transaction.create({
            sender: {
                user: requestFrom,
                transaction_type: 'sent'
            },
            recipient: {
                user: user._id,
                transaction_type: 'request'
            },
            amount: amount,
            status: 'pending'
        });

        return responseHandler.sendSuccess(res, {
            message: 'Request Money Successful',
            data: transaction
        })

    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.acceptMoneyRequest = async(req, res) => {
    let user = req.user
    const { transactionId } = req.params;
    try {
        const transaction = await Transaction.findById(transactionId);
        if(transaction.status != 'pending') {
            return responseHandler.sendError(res, {
                message: 'You cannot accept this request at this time',
                status: 422
            });
        }
        if(String(transaction.sender.user) == String(user._id)) {
            const recipient = transaction.recipient.user
            //get user wallet balance
            let walletBalance = (user.wallet_balance) ? user.wallet_balance : 0
            
            //check if walletBalance is greater than or equal to amount to be approved
            if(walletBalance > transaction.amount) {
                await User.findByIdAndUpdate(user._id, {
                    $inc: {wallet_balance: -Number(transaction.amount)},
                });

                await User.findByIdAndUpdate(recipient, {
                    $inc: {wallet_balance: Number(transaction.amount)},
                })
                await Transaction.findByIdAndUpdate(transactionId, {
                    status: 'success'
                }, {new: true})

                return responseHandler.sendSuccess(res, {
                    message: 'Accepted Money Request',
                    data: transaction
                });
            }
            return responseHandler.sendError(res, {
                message: 'Insufficient Balance... Top Up',
                status: 422
            });
        }
        return responseHandler.sendError(res, {
            message: 'Money Request is not sent to you',
            status: 402
        });
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.rejectMoneyRequest = async(req, res) => {
    let user = req.user
    const { transactionId } = req.params;
    try {
        const transaction = await Transaction.findById(transactionId);
        if(transaction.status != 'pending') {
            return responseHandler.sendError(res, {
                message: 'You cannot reject this request at this time',
                status: 422
            });
        }
        if(String(transaction.sender.user) == String(user._id)) {
            await Transaction.findByIdAndUpdate(transactionId, {
                status: 'declined'
            }, {new: true})

            return responseHandler.sendSuccess(res, {
                message: 'Declined Money Request',
                data: transaction
            });
        }
        return responseHandler.sendError(res, {
            message: 'Money Request is not sent to you',
            status: 402
        });
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.getMyWalletHistory = async(req, res) => {
    const user = req.user
    const {page, limit, transaction_type} = req.query
    try {
        const pageOptions = {
            sort: { created_at: -1 },
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 25,
            lean: true,
            populate: [
                { 
                    path: 'recipient.user',
                    select: '_id email username first_name last_name phone avatar profile_picture wallet_balance level'
                },
                { 
                    path: 'sender.user',
                    select: '_id email username first_name last_name phone avatar profile_picture wallet_balance level'
                }
            ],
        }

        let transactions = []
        if(!transaction_type || transaction_type === 'recent') {
            transactions = await Transaction.paginate({ 
                $or: [
                    {
                        'sender.user': user._id
                    }, 
                    {
                        'recipient.user': user._id
                    } 
                ]
            }, pageOptions)
        }
        else {
            let query = {}
            let query2 = {}
            if((transaction_type === 'received') || (transaction_type === 'cashout') || (transaction_type === 'top-up' || (transaction_type === 'request'))) {
                query = { 'recipient.transaction_type': transaction_type }
                query2 = { 'recipient.user': user._id }
                
            }
            else {
                query = { 'sender.transaction_type': transaction_type }, { 'recipient.transaction_type': transaction_type }
                query2 = { 'sender.user': user._id }, { 'recipient.user': user._id }
            }
            transactions = await Transaction.paginate({ 
                $and: [
                    {
                        $and: [ query2 ],
                        $or: [ query ],
                    }
                ]
            }, pageOptions)
        }
        return responseHandler.sendSuccess(res, {
            message: 'Wallet History',
            data: { transactions: transactions.docs, pagination: Paginator.build(transactions) }
        })
    } catch(error) {
        return responseHandler.internalServerError(res, {
            message: error.message
        })
    }
}

exports.getWalletInfo = async(req, res) => {
    try {
        let user = req.user
        const wallet = await User.findById(user._id)
        return responseHandler.sendSuccess(res, {
            message: 'Wallet Info',
            data: {wallet: wallet.wallet_balance, cards: wallet.cards}
        })
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.removeCard = async(req, res) => {
    try {
        const user = req.user
        const {cardId} = req.body
        
        const remove = await User.findByIdAndUpdate(user._id, {
            $pull: { cards: { _id: cardId }}
        }, {new: true, projection: 'cards'})

        if(remove) {
            return responseHandler.sendSuccess(res, {
                message: 'Card Removed',
                data: remove
            });
        }
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.verifyAccountDetails = async (req, res) => {
    const user = req.user
    if(user.kyc.bvn) {
        return responseHandler.sendError(res, {
            message: 'Account Already Verified',
            status: 400
        })
    }
    const {bvn, bank, account_number} = req.body
    const verify = await verifyBvn({
        bvn,
        bank_code: bank, 
        account_number
    })
    if (verify && verify.status) {
        const data = verify.data
        if (data && data.account_number && !data.is_blacklisted) {
            //resolve account number
            const resolve = await verifyAccountNumber('account_number=' + account_number + '&bank_code=' + bank)
            if(resolve && resolve.data && resolve.status) {
                await User.findByIdAndUpdate(user._id, {
                    $set: {
                        kyc: {
                            bvn,bank, account_number,
                            account_name: resolve.data.account_name
                        }
                    }
                })
                await User.findByIdAndUpdate(user._id, {
                    $addToSet: {
                        banks: {
                            bank, account_number,
                            account_name: resolve.data.account_name
                        }
                    }
                })
                return responseHandler.sendSuccess(res, {
                    message: 'Account Verified successfully.',
                    data: {
                        account: resolve.data,
                        bvnData: verify.data
                    }
                })
            }
        return responseHandler.sendError(res, {
            message: 'Account number not resolved',
            status: 400
        })
        }
    }
    return responseHandler.sendError(res, {
        message: 'BVN not verified',
        status: 400
    })
}

exports.verifyPayment = async (req, res) => {
    const user = req.user
    const {ref} = req.body
    let reference = await Payment.getTransactionReference(ref)
    if (!reference) {
        return responseHandler.sendError(res, {
            message: 'Not payment transaction found.',
            status: 404
        })
    }

    if (reference.status.transaction !== 'open') {
        return responseHandler.sendError(res, {
            message: `This transaction ${reference.status.transaction} already.`,
            status: 400
        })
    }
    const payment = await paystack.get('transaction/verify/'+ref)
        .then(({data})=> data)
        .catch(({response}) => response)
        
    if (payment.status) {
        const paymentData = payment.data
        if (paymentData.status === 'success') {
            let card
            //card authorization
            const { authorization, customer } = payment.data
            if (authorization.channel === 'card') {
                card = {
                    first6: authorization.bin,
                    last4: authorization.last4,
                    reusable: authorization.reusable,
                    country: authorization.country,
                    card_type: authorization.card_type,
                    token: authorization.authorization_code,
                    expiry: `${authorization.exp_month}/${authorization.exp_year}`,
                    customer: {
                        email: customer.email,
                        name: `${customer.first_name} ${customer.last_name}`,
                        phone_number: customer.phone
                    }
                }

            }
            await User.findByIdAndUpdate(user._id, {
                $inc: {wallet_balance: Number(paymentData.amount)/100},
                $addToSet: {cards: card}
            })

            reference = await Payment.findByIdAndUpdate(reference._id, {
                currency: paymentData.currency,
                message: paymentData.message || paymentData.gateway_response,
                amount: Number(paymentData.amount)/100,
                status: {
                    transaction: 'closed',
                    payment: paymentData.status,
                }
            }, {new: true}).lean()
            //record the wallet transaction
            await Transaction.create({
                sender: {
                    user: null,
                    transaction_type: 'received'
                },
                recipient: {
                    user: user._id,
                    transaction_type: 'top-up'
                },
                amount: Number(paymentData.amount)/100
            });
            return paymentData.status === 'success' ?
                responseHandler.sendSuccess(res, {
                    message: 'Payment Verified successfully.',
                    data: payment.data
                }) :
                responseHandler.sendError(res, {
                    message: 'Payment failed.',
                    data: payment.data.message
                })
        }
        responseHandler.sendError(res, {
            message: 'Payment failed.',
            data: payment.data.message
        })
    }
    return  responseHandler.sendError(res, {
        message: 'Some went wrong with payment verification.',
        status: 400
    })
}

exports.mySavedBanks = async (req, res) => {
    const user = req.user
    const savedBanks = await User.findById(user._id).select('banks');
    return responseHandler.sendSuccess(res, {
        message: 'Saved Banks.',
        data: savedBanks
    });
}

exports.verifyBankAccount = async (req, res) => {
    const user = req.user
    const { save } = req.query
    const {bank, account_number} = req.body
    const resolve = await verifyAccountNumber('account_number=' + account_number + '&bank_code=' + bank)
    if(resolve && resolve.data && resolve.status) {
        if(save == 1) {
            await User.findByIdAndUpdate(user._id, {
                $addToSet: {
                    banks: {
                        bank, account_number,
                        account_name: resolve.data.account_name
                    }
                }
            })
        }
        return responseHandler.sendSuccess(res, {
            message: 'Account Verified successfully.',
            data: {
                account: resolve.data,
            }
        })
    }
    return responseHandler.sendError(res, {
        message: 'Account number not resolved',
        status: 400
    })
}

exports.withdrawMoney = async (req, res) => {
    const user = req.user
    const { amount, bank, account_number, account_name } = req.body
    if(amount > user.wallet_balance) {
        return responseHandler.sendError(res, {
            message: `You can only make a withdrawal of ${user.wallet_balance} from your balance`,
            status: 400
        })
    }
    
    //hit paystack endpoint to arrange withdrawals
    const params = {
        type: 'nuban',
        name: account_name,
        account_number: account_number,
        bank_code: bank,
        currency: "NGN"
    }
    const payment = await paystack.post('transferrecipient', params)
        .then(({data})=> data)
        .catch(({response}) => response)
        
    if(payment.status) {
        //initiate the transfer
        const transfer = await paystack.post('transfer', { source: 'balance', amount: amount * 100, recipient: payment.data.recipient_code, reason: `Withdrawal of ${amount}` })
            .then(({data})=> data)
            .catch(({response}) => response)

        console.log(transfer)
        
        if(transfer.status && transfer.data.status === 'pending') {
            //deduct amount from wallet
            await User.findByIdAndUpdate(user._id, {
                $inc: {wallet_balance: -Number(amount)},
            })
            const withdraw = await Transaction.create({
                sender: {
                    user: null,
                    transaction_type: 'received'
                },
                recipient: {
                    user: user._id,
                    transaction_type: 'cashout'
                },
                amount: amount,
                status: 'pending',
                transfer_code: transfer.data.transfer_code
            });
            return responseHandler.sendSuccess(res, {
                message: 'Withdrawal in Progress.',
                data: withdraw
            })
        }
        return responseHandler.sendError(res, {
            message: 'Failed to Initiate Transfer Request',
            status: 400
        })
    }
    return responseHandler.sendError(res, {
        message: 'Failed to Place Withdrawal Request',
        status: 400
    })
}

exports.transferWebhook = async(req, res) => {
    const { event, data } = req.body
    let ref = data.reference
    try {
        if(event == 'charge.success') {
            let reference = await Payment.getTransactionReference(ref)
            if (!reference) {
                return responseHandler.sendError(res, {
                    message: 'Not payment transaction found.',
                    status: 404
                })
            }

            if (reference.status.transaction !== 'open') {
                return responseHandler.sendError(res, {
                    message: `This transaction ${reference.status.transaction} already.`,
                    status: 400
                })
            }
            const payment = await paystack.get('transaction/verify/'+ref)
                .then(({data})=> data)
                .catch(({response}) => response)
                
            if (payment.status) {
                const paymentData = payment.data
                if (paymentData.status === 'success') {
                    let card
                    //card authorization
                    const { authorization, customer } = payment.data
                    if (authorization.channel === 'card') {
                        card = {
                            first6: authorization.bin,
                            last4: authorization.last4,
                            reusable: authorization.reusable,
                            country: authorization.country,
                            card_type: authorization.card_type,
                            token: authorization.authorization_code,
                            expiry: `${authorization.exp_month}/${authorization.exp_year}`,
                            customer: {
                                email: customer.email,
                                name: `${customer.first_name} ${customer.last_name}`,
                                phone_number: customer.phone
                            }
                        }

                    }
                    await User.findByIdAndUpdate(reference.owner, {
                        $inc: {wallet_balance: Number(paymentData.amount)/100},
                        $addToSet: {cards: card}
                    })

                    reference = await Payment.findByIdAndUpdate(reference._id, {
                        currency: paymentData.currency,
                        message: paymentData.message || paymentData.gateway_response,
                        amount: Number(paymentData.amount)/100,
                        status: {
                            transaction: 'closed',
                            payment: paymentData.status,
                        }
                    }, {new: true}).lean()
                    //record the wallet transaction
                    await Transaction.create({
                        sender: {
                            user: null,
                            transaction_type: 'received'
                        },
                        recipient: {
                            user: reference.owner,
                            transaction_type: 'top-up'
                        },
                        amount: Number(paymentData.amount)/100
                    });
                    return paymentData.status === 'success' ?
                        responseHandler.sendSuccess(res, {
                            message: 'Payment Verified successfully.',
                            data: payment.data
                        }) :
                        responseHandler.sendError(res, {
                            message: 'Payment failed.',
                            data: payment.data.message
                        })
                }
                responseHandler.sendError(res, {
                    message: 'Payment failed.',
                    data: payment.data.message
                })
            }
            return  responseHandler.sendError(res, {
                message: 'Some went wrong with payment verification.',
                status: 400
            })
        }

        if(event === 'transfer.success') {
            //find the transfer_code from transactions
            const transfer_code = data.transfer_code
            const transfer = await Transaction.findOne({transfer_code});
            if(transfer.status === 'pending') {
                //update transfer to success
                const transaction = await Transaction.findByIdAndUpdate(transfer._id, {
                    status: 'success'
                })
                return responseHandler.sendSuccess(res, {
                    message: 'Transaction Successful.',
                    data: transaction
                })
            }
            return responseHandler.sendError(res, {
                message: 'Transaction can no longer be approved',
                status: 400
            })
        }
        
        if(event === 'transfer.failed') {
            //find the transfer_code from transactions
            const transfer_code = data.transfer_code
            const transfer = await Transaction.findOne({transfer_code});
            if(transfer.status === 'pending') {
                //update transfer to revered
                const transaction = await Transaction.findByIdAndUpdate(transfer._id, {
                    status: 'failed'
                })
                //return amount to user
                await Transaction.create({
                    sender: {
                        user: null,
                        transaction_type: 'sent'
                    },
                    recipient: {
                        user: transfer.recipient.user,
                        transaction_type: 'received'
                    },
                    amount: transfer.amount,
                    status: 'reversed'
                });
                await User.findByIdAndUpdate(transfer.recipient.user, {
                    $inc: {wallet_balance: transfer.amount},
                })
                return responseHandler.sendSuccess(res, {
                    message: 'Transaction Successful.',
                    data: transaction
                })
            }
            return responseHandler.sendError(res, {
                message: 'Transaction can no longer be approved',
                status: 400
            })
        }

        if(event === 'transfer.reversed') {
            //find the transfer_code from transactions
            const transfer_code = data.transfer_code
            const transfer = await Transaction.findOne({transfer_code});
            if(transfer.status === 'pending') {
                //update transfer to revered
                const transaction = await Transaction.findByIdAndUpdate(transfer._id, {
                    status: 'reversed'
                })
                //return amount to user
                await Transaction.create({
                    sender: {
                        user: null,
                        transaction_type: 'sent'
                    },
                    recipient: {
                        user: transfer.recipient.user,
                        transaction_type: 'reversed'
                    },
                    amount: transfer.amount,
                    status: 'reversed'
                });
                await User.findByIdAndUpdate(transfer.recipient.user, {
                    $inc: {wallet_balance: Number(transfer.amount)},
                })
                return responseHandler.sendSuccess(res, {
                    message: 'Transaction Successful.',
                    data: transaction
                })
            }
            return responseHandler.sendError(res, {
                message: 'Transaction can no longer be approved',
                status: 400
            })
        }
    } catch(error) {
        return responseHandler.internalServerError(res)
    }
}

exports.bankList = async (req, res) => {
    const user = req.user
    let allBanks = new BankList
    return responseHandler.sendSuccess(res, {
        message: 'All Banks.',
        data: allBanks.allBanks
    });
}