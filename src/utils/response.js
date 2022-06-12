
class Response {
    response(res, message, status, success, data) {
        return res.status(status).send({
            success, message, data
        }).end()
    }
    internalServerError(res, message  = 'Whoops... An Error Occured', data = []) {
        return this.response(res, message, 500, false, data)
    }
    sendError(res, {message, status = 400, data = null}) {
        return this.response(res, message, status, false, data)
    }

    sendSuccess(res, {message, status = 200, data = null}) {
        return this.response(res, message, status, true, data)
    }
}

const response = ()  => {
    return new Response()
}
module.exports = response()
