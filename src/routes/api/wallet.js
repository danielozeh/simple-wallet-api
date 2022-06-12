const express = require('express')
const router = express.Router()

const validate = require('../../middlewares/validate')
const walletController = require('../../controllers/wallet')
const auth = require('../../middlewares/authenticate')
const { giftMoney, verifyPayment, verifyAccountDetails, requestMoney, verifyBankAccount, withdrawMoney, addBeneficiary } = require('../../validations/wallet')

router.post('/transaction/reference/generate', auth, walletController.generateTransactionReference);
router.post('/money/send', auth, validate(giftMoney), auth, walletController.sendMoney)
router.get('/transactions', auth, walletController.getMyWalletHistory);
router.get('/', auth, walletController.getWalletInfo);
router.post('/payment/verify', auth, validate(verifyPayment), auth, walletController.verifyPayment);
router.post('/account/verify', auth, validate(verifyAccountDetails), walletController.verifyAccountDetails)
router.post('/money/request', auth, validate(requestMoney), walletController.requestMoney);
router.put('/money/request/accept/:transactionId', auth, walletController.acceptMoneyRequest);
router.put('/money/request/decline/:transactionId', auth, walletController.rejectMoneyRequest);
router.get('/saved-banks', auth, walletController.mySavedBanks)
router.post('/bank/verify', auth, validate(verifyBankAccount), walletController.verifyBankAccount);
router.post('/money/withdraw', auth, validate(withdrawMoney), walletController.withdrawMoney)
router.post('/transfer-webhook', walletController.transferWebhook)
router.get('/bank/list', auth, walletController.bankList)
router.post('/beneficiary', auth, validate(addBeneficiary), walletController.addBeneficiary)
router.delete('/beneficiary/:beneficiaryId', auth, walletController.removeBeneficiary)
module.exports = router