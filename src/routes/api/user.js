const express = require('express')
const router = express.Router()

const userController = require('../../controllers/user')
const validate = require('../../middlewares/validate')
const auth = require('../../middlewares/authenticate')
const {checkEmail} = require('../../validations/authentications')

router.get('/', auth, userController.me)
router.put('/', auth, userController.editMe)
router.post('/find', userController.findUser)
router.post('/email/find', validate(checkEmail), userController.checkEmail)

module.exports = router
