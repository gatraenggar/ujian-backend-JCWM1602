const express = require('express')
const Router = express.Router()
const { getAllMovies, getMovieByStatus, addMovie, editStatus, addSchedule } = require('./../controllers/MoviesControllers')

Router.get('/get/all', getAllMovies)
Router.get('/get', getMovieByStatus)
Router.post('/add', addMovie)
Router.patch('/edit/:id', editStatus)
Router.patch('/set/:id', addSchedule)

module.exports = Router