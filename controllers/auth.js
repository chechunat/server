//Aqui haremos el EndPoint para poder refrescar el accessToken

const jwt = require('../services/jwt');
const moment = require('moment'); //Paquete moment
const User = require('../models/user'); //Modelo de usuarios

//Funcion para ver si el token ha expirado

function willExpireToken(token){
    const {exp} = jwt.decodedToken(token); 
    const currentDate = moment().unix(); //Fecha actual usando moment

    //Si es mas grande ha caducado...
    if(currentDate > exp) {
        return true;
    }

    return false;
}

//Funcion para refrescar el accessToken
function refreshAccessToken(req, res) {
    const {refreshToken} = req.body;
    const isTokenExpired = willExpireToken(refreshToken);

    if(isTokenExpired) {
        res.status(404).send({message: "El refreshToken ha expirado."});
    } else {
        const { id } = jwt.decodedToken(refreshToken);
        User.findOne({_id: id}, (err, userStored) => {
            if(err) {
                res.status(500).send({ message: "Error del servidor." });
            } else {
                if (!userStored) {
                    res.status(404).send({ message: "Usuario no encontrado. "});
                } else {
                    res.status(200).send({ 
                        accessToken: jwt.createAccessToken(userStored),
                        refreshToken: refreshToken
                    })
                }
            }
        });
    }
}

module.exports = {
    refreshAccessToken
};
