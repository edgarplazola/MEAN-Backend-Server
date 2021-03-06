const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SEED = require('../config/config').SEED;
const CLIENT_ID = require('../config/config').CLIENT_ID;

const app = express();
const Usuario = require('../models/usuario');

//2lTocsUVL3b2zTVbp_e4mAra
const {
  OAuth2Client
} = require('google-auth-library');

const client = new OAuth2Client(CLIENT_ID);

const mdAutenticacion = require('../middlewares/autenticacion')


//================================
// ? Renovar token
//================================
app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {

  const token = jwt.sign({
    usuario: req.usuario
  }, SEED, {
    expiresIn: 14400
  }); //4 horas

  res.status(200).json({
    ok: true,
    usuario: req.usuario,
    token: token
  });

});

//================================
// ? Cuerpo del login - Google
//================================

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  });

  const payload = ticket.getPayload();
  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    nombre: true
  }
}

app.post('/google', async (req, res) => {

  let token = req.body.token;

  let googleUser = await verify(token)
    .catch(e => {
      res.status(403).json({
        ok: false,
        mensaje: "Token no válido"
      });
    });

  Usuario.findOne({
    email: googleUser.email
  }, (err, usuarioDB) => {
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
        const token = jwt.sign({
          usuario: usuarioDB
        }, SEED, {
          expiresIn: 14400
        }); //4 horas

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          id: usuarioDB._id,
          token: token,
          menu: obtenerMenu(usuario.role)
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

        const token = jwt.sign({
          usuario: usuarioDB
        }, SEED, {
          expiresIn: 14400
        }); //4 horas

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          id: usuarioDB._id,
          token: token,
          menu: obtenerMenu(usuarioDB.role)
        });
      });
    }
  });
});


//================================
// ? Cuerpo del login - Normal
//================================
app.post('/', (req, res) => {

  const body = req.body;

  Usuario.findOne({
    email: body.email
  }, (err, usuarioDB) => {

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
    // 14400 s = 4 horas
    // 86400 s = 1 día
    // 31540000 s = 1 año
    const token = jwt.sign({
      usuario: usuarioDB
    }, SEED, {
      expiresIn: 86400
    });

    res.status(200).json({
      ok: true,
      usuario: usuarioDB,
      id: usuarioDB._id,
      token: token,
      menu: obtenerMenu(usuarioDB.role)
    });

  });
});

function obtenerMenu(ROLE) {

  const menu = [{
      titulo: 'Principal',
      icono: 'mdi mdi-gauge',
      submenu: [{
          titulo: 'DashBoard',
          url: '/dashboard'
        },
        {
          titulo: 'ProgressBar',
          url: '/progress'
        },
        {
          titulo: 'Gráficas',
          url: '/graficas1'
        },
        {
          titulo: 'Promesas',
          url: '/promesas'
        },
        {
          titulo: 'RXJS',
          url: '/rxjs'
        }
      ]
    },
    {
      titulo: 'Mantenimientos',
      icono: 'mdi mdi-folder-lock-open',
      submenu: [
        //{ titulo: 'Usuarios', url: '/usuarios' },
        {
          titulo: 'Hospitales',
          url: '/hospitales'
        },
        {
          titulo: 'Médicos',
          url: '/medicos'
        }
      ]
    }
  ];

  if (ROLE === 'ADMIN_ROLE') {
    menu[1].submenu.unshift({
      titulo: 'Usuarios',
      url: '/usuarios'
    });
  }

  return menu;

}

module.exports = app;
