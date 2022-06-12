const app = require('./core/express')
const db = require('./core/db')
app.startAPI()

//connect db
db.connect()

