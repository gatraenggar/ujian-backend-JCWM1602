const express = require('express')
const cors = require('cors')
const bodyparser = require('body-parser')
const userRouter = require('./routes/UserRouter')
const moviesRouter = require('./routes/MoviesRouter')

require('dotenv').config()

// main app
const app = express()

// apply middleware
app.use(cors())
app.use(bodyparser.json())

app.use('/user', userRouter)
app.use('/movies', moviesRouter)

// main route
const response = (req, res) => res.status(200).send('<h1>REST API JCWM1602</h1>')
app.get('/', response)

// bind to local machine
const PORT = process.env.PORT || 2000
app.listen(PORT, () => console.log(`CONNECTED : port ${PORT}`))