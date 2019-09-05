const express = require('express');
const mdAutenticacion = require('../middlewares/autenticacion');

const app = express();

const Medico = require('../models/medico');

//==========================
//Obtener todos los medicos
//==========================
app.get('/', (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec((err, medicos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error cargando medicos",
                    errors: err
                });
            }

            Medico.countDocuments({}, (err, conteo) => {
                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: conteo
                });
            });


        });
});

//==========================
// Obtener un solo médico
//==========================

app.get('/:id',(req,res)=>{

const id=req.params.id;
Medico.findById(id)
.populate('usuario','nombre email img')
.populate('hospital')
.exec((err,medico)=>{

  if (err) {
      return res.status(500).json({
          ok: false,
          mensaje: "Error al buscar medico",
          errors: err
      });
  }

  if (!medico) {
      return res.status(400).json({
          ok: false,
          mensaje: `El medico con el id: ${id} no existe`,
          errors: { message: 'No existe un medico con ese ID' }
      });
  }

  res.status(200).json({
    ok:true,
    medico:medico
  });

})

});

//==========================
// Crear un nuevo medico
//==========================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    const body = req.body;
    const medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital
    });

    medico.save((err, medicoGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear medico",
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            medico: medicoGuardado
        });

    });
});

//==========================
// Actualizar un medico
//==========================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar medico",
                errors: err
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: `El medico con el id: ${id} no existe`,
                errors: { message: 'No existe un medico con ese ID' }
            });
        }

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        medico.hospital = body.hospital

        medico.save((err, medicoGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error al actualizar medico",
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });

        });
    });
});

//================================
// ? Elminar un medico por el id
//================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    const id = req.params.id;
    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al borrar medico",
                errors: err
            });
        }

        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: `No existe un medico con el id: ${id}`,
                errors: { message: "No existe un medico con ese id" }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });

    });

});

module.exports = app;
