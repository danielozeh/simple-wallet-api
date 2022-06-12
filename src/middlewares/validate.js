const responseHandler = require('../utils/response')
const validate =  (joi, body = 'body') => {
    return async (req, res, next) => {
        try {
            const {error} = await joi.validateAsync(req[body], {abortEarly: false, allowUnknown: true})
            const valid = error == null
            if (valid) {
                next()
            } else {
                const {details} = error
                const message = details.map(i => i.message && i.message.replace(/['"]/g, '').replace(/mongo/g, '')).join(' and ')
                return responseHandler.sendError(res, {message, status: 400})
            }
        }catch (e) {
            const {details} = e
            return responseHandler.sendError(res, {
                message: details.map(i => i.message && i.message.replace(/['"]/g, '').replace(/mongo/g, '')).join(' and '),
                status: 400
            })
        }
    }
}

module.exports = validate;
