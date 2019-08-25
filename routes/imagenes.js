const express = require('express');

const app = express();
const path = require('path');
const fs = require('fs');

//Rutas
app.get('/:tipo/:img', (req, res) => {

    const tipo = req.params.tipo;
    const img = req.params.img;

    var pathImagen = path.resolve(__dirname, `../uploads/${tipo}/${img}`);
    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        const pathNoImage = path.resolve(__dirname, '../assets/no-image.jpg');
        res.sendFile(pathNoImage);
    }
});

module.exports = app;