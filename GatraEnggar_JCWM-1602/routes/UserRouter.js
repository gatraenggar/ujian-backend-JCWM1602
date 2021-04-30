const express = require('express')
const Router = express.Router()
const { register, login, deactiveAccount, activateAccount, closeAccount} = require('./../controllers/UserControllers')

Router.post('/register', register)
Router.post('/login', login)
Router.patch('/deactive', deactiveAccount)
Router.patch('/activate', activateAccount)
Router.patch('/close', closeAccount)

module.exports = Router