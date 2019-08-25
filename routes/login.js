const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SEED = require('../config/config').SEED;
const CLIENT_ID = require('../config/config').CLIENT_ID;

const app = express();
const Usuario = require('../models/usuario');

//2lTocsUVL3b2zTVbp_e4mAra
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

//================================
// ? Cuerpo del login - Google
//================================

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        nombre: true
    }
}
verify().catch(console.error);

app.post('/google', async (req, res) => {

    let token = req.body.token;

    let googleUser = await verify(token)
        .catch(e => {
            res.status(403).json({
                ok: false,
                mensaje: "Token no válido"
            });
        });

    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuario",
                errors: err
            });
        }

        if (usuarioDB) {
            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Debe de usar su autenticación normal"
                });
            } else {
                const token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); //4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    id: usuarioDB._id,
                    token: token
                });
            }
        } else {
            const usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';

            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: "Error al buscar usuario",
                        errors: err
                    });
                }

                const token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); //4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    id: usuarioDB._id,
                    token: token
                });
            });
        }
    });

    // res.status(200).json({
    //     ok: true,
    //     mensaje: "OK!",
    //     googleUser: googleUser
    // });

});


//================================
// ? Cuerpo del login - Normal
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