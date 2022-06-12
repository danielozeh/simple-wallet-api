const express = require('express')
const router = express.Router()

const authController = require('../../controllers/authentications')
const validate = require('../../middlewares/validate')
const auth = require('../../middlewares/authenticate')
const {register, login, resendOTP, verifyEmail, forgotPassword, resetPassword} = require('../../validations/authentications')

router.post('/register', validate(register), authController.register)
router.post('/login', validate(login), authController.login)
router.post('/code/resend', validate(resendOTP), authController.resendEmail)
router.post('/email/verify', validate(verifyEmail), authController.verifyEmail)
router.post('/password/forgot', validate(forgotPassword), authController.forgotPassword)
router.post('/password/reset', validate(resetPassword), authController.resetPassword)

module.exports = router
