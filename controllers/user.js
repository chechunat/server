const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt-node');
const jwt = require('../services/jwt');
const User = require('../models/user');
const user = require('../models/user');
const { exists } = require('../models/user');

function signUp(req, res) {
    const user = new User();

    const{ name, lastname, email, password, repeatPassword } = req.body;
    user.name = name;
    user.lastname = lastname;
    user.email = email.toLowerCase();
    user.role = "admin";
    user.active = false;

    if (!password || ! repeatPassword) {
        res.status(404).send({message: "Las contraseñas son obligatorias."});
    } else if (password !== repeatPassword) {
        res.status(404).send({message: "Las contraseñas no son iguales."});
    } else {
        bcrypt.hash(password,null,null,function(err, hash){
            if(err) {
                res.status(500).send({message:"Error al encriptar la contraseña."});
            } else {
                user.password = hash;
                
                user.save((err, userStored) => {
                    if(err){
                        res.status(500).send({message: "El usuario ya existe"});
                    } else if (!userStored) {
                        res.status(404).send({message: err});
                    } else {
                        res.status(200).send({user : userStored});
                    }
                })
            }
        })
        
    }
}

function signIn(req, res){
    const params = req.body;
    const email = params.email.toLowerCase();
    const password = params.password;

    User.findOne({email}, (err, userStored)=>{
        if (err){
            res.status(500).send({message: "Error del servidor."});
        } else {
            if(!userStored) {
                res.status(404).send({message: "Usuario no encontrado."});
            } else {
                bcrypt.compare(password, userStored.password, (err, check) => {
                    if (err) {
                        res.status(500).send({message: "Error del servidor."});
                    } else if(!check) {
                        res.status(404).send({message: "Contraseña incorrecta."});
                        } else {
                            if(!userStored.active) {
                                res.status(200).send({code: 200, message: "El usuario no está activo."});
                            } else {
                                res.status(200).send({
                                    accessToken: jwt.createAccessToken(userStored),
                                    refreshToken: jwt.createRefreshToken(userStored)
                                });
                            }
                        }
                });
            }
        }
    })
}

function getUsers(req, res){
    user.find().then(users => {
        if(!users) {
            res.status(404).send({ message: "No se ha encontrado ningún usuario"});
        } else {
            res.status(200).send({ users });
        }
    })        
}

function getUsersActive(req, res){
    const query = req.query;

    user.find({ active: query.active }).then(users => {
        if(!users) {
            res.status(404).send({ message: "No se ha encontrado ningún usuario"});
        } else {
            res.status(200).send({ users });
        }
    })        
}

function uploadAvatar(req, res) {
    const params = req.params;    

    User.findById({ _id: params.id}, (err, userData) => {
        if (err) {
            res.status(500).send({ message: "Error del servidor." });
        } else {
            if (!userData) {
                res.status(404).send({ message: "No se ha encontrado ningún usuario."});
            } else {
                let user = userData;
                
                if(req.files) {
                    let filePath = req.files.avatar.path.split("\\").join("/");
                    let fileSplit = filePath.split("/");
                    let fileName = fileSplit[2];
                    let extSplit = fileName.split(".");
                    let fileExt = extSplit[1];

                    if (fileExt !== "png" && fileExt !== "jpg") {
                        res.status(400).send({
                            message: 
                            "Extensión de la imagen invalida. (Debe ser png o jpg)"
                        });                    
                    } else {
                        user.avatar = fileName;
                        User.findByIdAndUpdate({ _id: params.id }, user, (err, userResult) => {
                            if(err) {
                                res.status(500).send({ message: "Error del servidor."});
                            } else {
                                if(!userResult) {
                                    res.status(404).send({ message: "No se ha encontrado ningún usuario."});
                                } else {
                                    res.status(200).send({ avatarName: fileName });
                                }
                            }
                        });
                    }
                    
                    

                }
            }
            
        }        
    });             
  
}

function getAvatar(req, res) {
    const avatarName = req.params.avatarName;
    const filePath = "./uploads/avatar/" + avatarName;

    fs.exists(filePath, exists => {
        if(!exists) {
            res.status(404).send({ message: "El avatar que buscas no existe."});
        } else {
            res.sendFile(path.resolve(filePath));
        }
    })
}

async function updateUser(req, res) {

    const userData = req.body;
    userData.email = req.body.email.toLowerCase();
    const params = req.params;

    if(userData.password) {
        await bcrypt.hash(userData.password, null, null, (err, hash) =>{
            if(err) {
                res.status(500).send({message: "Error al encriptar la contraseña."});
            } else {
                userData.password = hash;
            }
        });
    };

    User.findByIdAndUpdate({ _id: params.id}, userData, (err, userUpdate) => {
        if(err) {
            res.status(500).send({ message: "Error del servidor."});
        } else {
            if(!userUpdate) {
                res.status(404).send({message: "No se ha encontrado ningún usuario."});
            } else {
                res.status(200).send({ message: "Usuario actualizado correctamente."});
            }
        }
    });
    
}

function activateUser(req, res) {
    const { id } = req.params;
    const { active } = req.body;

    console.log(id);
    console.log(active);
    
    
    User.findByIdAndUpdate(id, { active }, (err, userStored) =>{
        if(err) {
            res.status(500).send({ message: "Error del servidor." });
        } else {
            if(!userStored) {
                res.status(404).send({ message: "No se ha encontrado el usuario."});
            } else {
                if(active === true) {
                    res.status(200).send({ message: "Usuario activado correctamente."});
                } else {
                    res.status(200).send({ message: "Usuario desactivado correctamente."});
                }
            }
        }
    });
    
}

function deleteUser(req, res) {
    const { id } = req.params;

    user.findByIdAndRemove(id, (err, userDeleted) =>{
        if (err) {
            res.status(500).send({message:"Error del servidor."});
        } else {
            if(!userDeleted) {
                res.status(404).send({message:"Usuario no encontrado."});
            } else {
                res.status(200).send({message:"El usuario ha sido eliminado correctamente."});
            }
        }
    })
    
}

function signUpAdmin(req, res) {
    const user = new User();

    const {name, lastname, email, role, password } = req.body;

    user.name = name;
    user.lastname = lastname;
    user.email = email.toLowerCase();
    user.role = role;
    user.active = true;

    if(!password) {
        res.status(500).send({message:"La contraseña es obligatoria. "});
    } else if (password.length < 6 ){
        res.status(500).send({message:"La contraseña tiene ser de 6 carácteres como mínimo. "});
    } else {    
            bcrypt.hash(password,null,null,(err, hash) =>{
                if(err) {
                    res.status(500).send({message:"Error al encriptar la contraseña."})
                } else {
                    user.password = hash;

                    user.save((err, userStored) =>{
                        if(err) {
                            res.status(500).send({message: "Usuario ya existe."});
                        } else {
                            if (!userStored) {
                                res.status(500).send({message: "Error al crear el nuevo usuario."});
                            } else {
                                res.status(200).send({ message: "Usuario creado correctamente. " });
                            }
                        }
                    })
                }
            })
        }
    }

module.exports = {
    signUp,
    signIn,
    getUsers,
    getUsersActive,
    uploadAvatar,
    getAvatar,
    updateUser,
    activateUser,
    deleteUser,
    signUpAdmin
};

