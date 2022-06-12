const express = require('express')

const router = express.Router()
const api_version = '/v1'

const authRoutes = require('./api/auth')
const userRoutes = require('./api/user');
const walletRoutes = require('./api/wallet')

router.get('/', (req, res) => {
    return res.send('API is Running...')
})
router.use(api_version + '/auth', authRoutes)
router.use(api_version + '/user', userRoutes);
router.use(api_version + '/wallet', walletRoutes);

module.exports = router
