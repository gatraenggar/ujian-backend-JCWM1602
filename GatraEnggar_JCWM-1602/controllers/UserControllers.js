const db = require('./../connection/Connection')
const validator = require('validator')
const util = require('util')
const query = util.promisify(db.query).bind(db)
const jwt = require('jsonwebtoken')
const { urlencoded } = require('body-parser')

const register = async (req, res) => {
    try {
        const data = req.body

        if (!data.username || !data.email || !data.password) throw { message: 'Data harus lengkap' }

        if (data.username.length < 6) throw { message: 'Username minimal 6 karakter' }

        if (!validator.isEmail(data.email)) throw { message: 'Email tidak valid' }

        if (data.password.length < 6) throw { message: 'Password minimal 6 karakter' }

        // let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        // if (regex.includes(data.password)) throw { message: 'Karakter tidak valid' }

        let validChars = 'qwertyuiopasdfghjklzxcvbnm'.split('')
        let noChars = true
        for(let i = 0; i < validChars.length; i++){
            for(let j = 0; j < data.password.length; j++){
                if(validChars[i] === data.password[j]){
                    noChars = false
                    j = data.password.length
                    i = validChars.length
                }
            }
        }
        if(noChars) throw { message: 'Karakter tidak valid' }

        let validNumbers = '1234567890'.split('')
        let noNumbers = true
        for(let i = 0; i < validNumbers.length; i++){
            for(let j = 0; j < data.password.length; j++){
                if(validNumbers[i] === data.password[j]){
                    noNumbers = false
                    j = data.password.length
                    i = validNumbers.length
                }
            }
        }
        if(noNumbers) throw { message: 'Karakter tidak valid' }

        let validSymbols = "`~!@#$%^&*()_+|}{:?><,./;'[]"
        let noSymbols = true
        for(let i = 0; i < validSymbols.length; i++){
            for(let j = 0; j < data.password.length; j++){
                if(validSymbols[i] === data.password[j]){
                    noSymbols = false
                    j = data.password.length
                    i = validSymbols.length
                }
            }
        }
        if(noSymbols) throw { message: 'Karakter tidak valid' }

        const dataToPost = {
            uid: Date.now().toString().slice(0, 8),
            username: data.username,
            email: data.email,
            password: data.password,
        }

        const checkDataInDB = await query('SELECT * FROM users WHERE email = ?', dataToPost.email)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        if (checkDataInDB.length === 1) throw { message: 'Akun sudah terdaftar' }

        await query('INSERT INTO users SET ?', dataToPost)
            .catch(error => {
                res.status(500).json({
                    error: true,
                    message: error.message
                })
            })

        const dataFromDB = await query('SELECT * FROM users WHERE uid = ?', dataToPost.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        jwt.sign({ uid: dataFromDB[0].uid, role: dataFromDB[0].role }, process.env.JWT, (err, tokenResult) => {
            if (err) throw err

            res.status(201).json({
                id: dataFromDB[0].id,
                uid: dataFromDB[0].uid,
                username: dataFromDB[0].username,
                email: dataFromDB[0].email,
                token: tokenResult
            })
        })

    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const login = async (req, res) => {
    try {
        const data = req.body

        if (!data.user || !data.password) throw { message: 'Data harus lengkap' }

        const dataFromDB = await query('SELECT * FROM users WHERE username = ? OR email = ?', [data.user, data.user])
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        if (dataFromDB.length !== 1 || dataFromDB[0].status !== 1) throw { message: 'Akun tidak ditemukan' }

        if (dataFromDB[0].password === data.password) {
            jwt.sign({ uid: dataFromDB[0].uid, role: dataFromDB[0].role }, process.env.JWT, (err, tokenResult) => {
                if (err) throw err

                res.status(200).json({
                    id: dataFromDB[0].id,
                    uid: dataFromDB[0].uid,
                    username: dataFromDB[0].username,
                    email: dataFromDB[0].email,
                    role: dataFromDB[0].role,
                    token: tokenResult
                })
            })
        }
    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const deactiveAccount = async (req, res) => {
    try {
        const token = req.body.token
        let data

        jwt.verify(token, process.env.JWT, (err, dataResult) => {
            try {
                if (err) throw err

                data = dataResult

            } catch (error) {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            }
        })

        const checkDataInDB = await query('SELECT * FROM users WHERE uid = ?', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        console.log(checkDataInDB)

        if (checkDataInDB.length !== 1 || checkDataInDB[0].status !== 1) throw { message: 'Akun tidak ditemukan' }

        await query('UPDATE users SET status = 2 WHERE uid = ?', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        const updateResult = await query('SELECT uid, status.status FROM users JOIN status ON users.status = status.id WHERE uid = ?;', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })
        console.log(updateResult)

        res.status(200).json({
            uid: updateResult[0].uid,
            status: updateResult[0].status,
        })

    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const activateAccount = async (req, res) => {
    try {
        const token = req.body.token
        let data

        jwt.verify(token, process.env.JWT, (err, dataResult) => {
            try {
                if (err) throw err

                data = dataResult

            } catch (error) {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            }
        })

        const checkDataInDB = await query('SELECT * FROM users WHERE uid = ?', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        console.log(checkDataInDB)

        if (checkDataInDB.length !== 1) throw { message: 'Akun tidak ditemukan' }

        if (checkDataInDB[0].status !== 2) throw { message: 'Hanya akun yang not-active yg bisa diaktifkan kembali' }

        await query('UPDATE users SET status = 1 WHERE uid = ?', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        const updateResult = await query('SELECT uid, status.status FROM users JOIN status ON users.status = status.id WHERE uid = ?;', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })
        console.log(updateResult)

        res.status(200).json({
            uid: updateResult[0].uid,
            status: updateResult[0].status,
        })

    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

const closeAccount = async (req, res) => {
    try {
        const token = req.body.token
        let data

        jwt.verify(token, process.env.JWT, (err, dataResult) => {
            try {
                if (err) throw err

                data = dataResult

            } catch (error) {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            }
        })

        const checkDataInDB = await query('SELECT * FROM users WHERE uid = ?', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        console.log(checkDataInDB)

        if (checkDataInDB.length !== 1) throw { message: 'Akun tidak ditemukan' }

        if (checkDataInDB[0].status === 3) throw { message: 'Akun ini sudah di-closed' }

        await query('UPDATE users SET status = 3 WHERE uid = ?', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })

        const updateResult = await query('SELECT uid, status.status FROM users JOIN status ON users.status = status.id WHERE uid = ?;', data.uid)
            .catch(err => {
                res.status(500).json({
                    error: true,
                    message: err.message
                })
            })
        console.log(updateResult)

        res.status(200).json({
            uid: updateResult[0].uid,
            status: updateResult[0].status,
        })

    } catch (error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
}

module.exports = {
    register, login, deactiveAccount, activateAccount, closeAccount
}