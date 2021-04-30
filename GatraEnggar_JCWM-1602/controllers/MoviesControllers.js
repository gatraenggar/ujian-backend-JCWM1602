const db = require('./../connection/Connection')
const validator = require('validator')
const util = require('util')
const query = util.promisify(db.query).bind(db)
const jwt = require('jsonwebtoken')
const { resolveTxt } = require('dns')

const getAllMovies = async (req, res) => {
    try {
        const moviesFromDB = await query('SELECT * FROM schedules s JOIN movies m ON s.movie_id = m.id JOIN locations l ON s.location_id = l.id JOIN show_times st ON s.time_id = st.id JOIN movie_status ms ON m.status = ms.id')
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        // res.status(200).send(moviesFromDB)

        const allMovies = moviesFromDB.map((val) => {
            return {
                "name": val.name,
                "release_date": val.release_date,
                "release_month": val.release_month,
                "release_year": val.release_year,
                "duration_min": val.duration_min,
                "genre": val.genre,
                "description": val.description,
                "status": val.status,
                "location": val.location,
                "time": val.time
            }
        })

        res.status(200).json(allMovies)
    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const getMovieByStatus = async (req, res) => {
    try {
        let queryReq = Object(req.query)
        console.log(queryReq)

        const moviesFromDB = await query('SELECT * FROM schedules s JOIN movies m ON s.movie_id = m.id JOIN locations l ON s.location_id = l.id JOIN show_times st ON s.time_id = st.id JOIN movie_status ms ON m.status = ms.id')
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        let dataToShow = []

        if (queryReq.status && queryReq.location && queryReq.time) {
            moviesFromDB.forEach(val => {
                if (val.status === queryReq.status.replace('%', ' ') && val.location === queryReq.location && val.time === queryReq.time.replace('%', ' ')) {
                    dataToShow.push({
                        name: val.name,
                        release_date: val.release_date,
                        release_month: val.release_month,
                        release_year: val.release_year,
                        duration_min: val.duration_min,
                        genre: val.genre,
                        description: val.description,
                        status: val.status,
                        location: val.location,
                        time: val.time
                    })
                }
            })

            res.status(200).send(dataToShow)
        } else {
            console.log('else')
            if (queryReq.status && !queryReq.location && !queryReq.time) {
                if (queryReq.status.includes('%')) {
                    queryReq.status = queryReq.status.replace('%', ' ')
                }

                moviesFromDB.forEach(val => {
                    if (val.status === queryReq.status.replace('%', ' ')) {
                        dataToShow.push({
                            name: val.name,
                            release_date: val.release_date,
                            release_month: val.release_month,
                            release_year: val.release_year,
                            duration_min: val.duration_min,
                            genre: val.genre,
                            description: val.description,
                            status: val.status,
                            location: val.location,
                            time: val.time
                        })
                    }
                })
                res.status(200).send(dataToShow)

            } else if (queryReq.location && !queryReq.status && !queryReq.time) {
                moviesFromDB.forEach(val => {
                    if (val.location.toUpperCase() === queryReq.location.toUpperCase()) {
                        dataToShow.push({
                            name: val.name,
                            release_date: val.release_date,
                            release_month: val.release_month,
                            release_year: val.release_year,
                            duration_min: val.duration_min,
                            genre: val.genre,
                            description: val.description,
                            status: val.status,
                            location: val.location,
                            time: val.time
                        })
                    }
                })
                res.status(200).send(dataToShow)

            } else if (queryReq.time && !queryReq.status && !queryReq.location) {
                moviesFromDB.forEach(val => {
                    if (val.time.toUpperCase() === queryReq.time.replace('%', ' ').toUpperCase()) {
                        dataToShow.push({
                            name: val.name,
                            release_date: val.release_date,
                            release_month: val.release_month,
                            release_year: val.release_year,
                            duration_min: val.duration_min,
                            genre: val.genre,
                            description: val.description,
                            status: val.status,
                            location: val.location,
                            time: val.time
                        })
                    }
                })
                res.status(200).send(dataToShow)

            } else {
                res.status(200).send(dataToShow)
            }
        }
    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const addMovie = async (req, res) => {
    try {
        const token = req.body.token
        const newMovie = req.body

        if (!token) throw { message: 'Token tidak boleh kosong' }

        let userData

        jwt.verify(token, process.env.JWT, (err, dataResult) => {
            try {
                if (err) throw err

                userData = dataResult

            } catch (error) {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            }
        })

        const checkDataInDB = await query('SELECT * FROM users WHERE uid = ?', userData.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        // console.log(checkDataInDB)

        if (checkDataInDB.length !== 1 || checkDataInDB[0].status !== 1) throw { message: 'Akun tidak ditemukan' }

        if (checkDataInDB[0].role !== 1) throw { message: 'Hanya admin yg boleh' }

        const movieDataToPost = {
            name: newMovie.name,
            genre: newMovie.genre,
            release_date: newMovie.release_date,
            release_month: newMovie.release_month,
            release_year: newMovie.release_year,
            duration_min: newMovie.duration_min,
            description: newMovie.description
        }

        const addMovieToDB = await query('INSERT INTO movies SET ?', movieDataToPost)

        // console.log(addMovieToDB)

        const postResult = await query('SELECT * FROM movies WHERE name = ?', newMovie.name)

        res.status(201).send(postResult)
    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const editStatus = async (req, res) => {
    try {
        const token = req.body.token

        if (!token) throw { message: 'Token tidak boleh kosong' }

        let userData

        jwt.verify(token, process.env.JWT, (err, dataResult) => {
            try {
                if (err) throw err

                userData = dataResult

            } catch (error) {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            }
        })

        const checkDataInDB = await query('SELECT * FROM users WHERE uid = ?', userData.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        // console.log(checkDataInDB)

        if (checkDataInDB.length !== 1 || checkDataInDB[0].status !== 1) throw { message: 'Akun tidak ditemukan' }

        if (checkDataInDB[0].role !== 1) throw { message: 'Hanya admin yg boleh' }

        const movieID = req.params.id

        if (!movieID) throw { message: 'Movie ID tidak ditemukan' }

        const newStatus = req.body.status

        await query('UPDATE movies SET status = ?', newStatus)

        res.status(201).send({
            id: movieID,
            message: 'Status has been changed'
        })
    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const addSchedule = async (req, res) => {
    try {
        const token = req.body.token

        if (!token) throw { message: 'Token tidak boleh kosong' }

        let userData

        jwt.verify(token, process.env.JWT, (err, dataResult) => {
            try {
                if (err) throw err

                userData = dataResult

            } catch (error) {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            }
        })

        const checkDataInDB = await query('SELECT * FROM users WHERE uid = ?', userData.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        if (checkDataInDB.length !== 1 || checkDataInDB[0].status !== 1) throw { message: 'Akun tidak ditemukan' }

        if (checkDataInDB[0].role !== 1) throw { message: 'Hanya admin yg boleh' }

        const movieID = req.params.id

        if (!movieID) throw { message: 'Movie ID tidak ditemukan' }

        const scheduleToPost = {
            movie_id: Number(movieID),
            location_id: req.body.location_id,
            time_id: req.body.time_id
        }

        await query('INSERT INTO schedules SET ?', scheduleToPost)

        res.status(201).send({
            id: movieID,
            message: 'Schedule has been added'
        })
    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

module.exports = {
    getAllMovies, getMovieByStatus, addMovie, editStatus, addSchedule
}