const jwt = require('jsonwebtoken');
const SEED = require('../config/config').SEED;

//================================
// ? Verificar token - Middleware
//================================

exports.verificaToken = (req, res, next) => {
    const token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: "Token incorrecto",
                errors: err
            });
        }

        req.usuario = decoded.usuario;
        next();
    });
};

//================================
// ? Verificar ADMIN - Middleware
//================================

exports.verificaADMIN_ROLE = (req, res, next) => {

  const usuario=req.usuario;
  console.log(usuario.role);
  if(usuario.role==='ADMIN_ROLE'){
    next();
    return;
  }else{
    return res.status(401).json({
        ok: false,
        mensaje: "Token incorrecto - No es administrador",
        errors: {message:"no es administrador, no puede hacer eso"}
    });
  }
};

//================================
// ? Verificar ADMIN o mismo usuario - Middleware
//================================

exports.verificaADMIN_ROLE_o_MismoUsuario = (req, res, next) => {

  const usuario=req.usuario;
  const id = req.params.id;

  console.log(usuario.role);
  if(usuario.role==='ADMIN_ROLE' || usuario._id ===id){
    next();
    return;
  }else{
    return res.status(401).json({
        ok: false,
        mensaje: "Token incorrecto - No es administrador ni es el mismo usuario",
        errors: {message:"no es administrador, no puede hacer eso"}
    });
  }
};
