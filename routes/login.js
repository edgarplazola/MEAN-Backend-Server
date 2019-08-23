const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SEED = require('../config/config').SEED;

const app = express();
const Usuario = require('../models/usuario');

//================================
// ? Cuerpo del login
//================================
app.post('/', (req, res) => {

    const body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuario",
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: "Credenciales incorrectas - email"
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Credenciales incorrectas - password"
            });
        }

        //================================
        // ? Generando el token
        //================================
        usuarioDB.password = ':)';
        const token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); //4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            id: usuarioDB._id,
            token: token
        });

    });
});

module.exports = app;