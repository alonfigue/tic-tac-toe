// index.js es el SERVIDOR


//Modulo de nodejs que permite trabajar con las rutas
const path = require('path');

//requerir express (framwork de nodejs) y dotenv para usar variables de entorno (PORT)
const express = require('express');
require('dotenv').config

//inicializando express
const app = express();

//código ASCII, |:124, `:96, ~:126
app.set('port', process.env.PORT || 5000);

//Send the folder frontend to the browser. Esta es la ruta que app usa para desplegar lo que se encuentra en la carpeta "folder"
app.use(express.static(path.join(__dirname, 'frontend')));
//console.log(path.join(__dirname, 'frontend'));

//start server (servidor realizado). Guardando esto en la constante server
const server = app.listen(app.get('port'), () => {
    console.log('Servidor escuchando en el puerto', app.get('port'));
});

// websockets
//Bidirectional connection (modulo socketio)
const socketio = require('socket.io')

//Escuchar el servidor mediante la constante creada llamada server (aqui ya socketio esta configurado)
const io = socketio(server);



//creando variables para el juego de la vieja
var players = {},
unmatched;


// eventos on (escuchar) y emit (enviar)
//escuchar evento "connection" con su metodo "on"
io.on('connection', (socket) =>  {
    console.log('- ID of new connection:', socket.id);
    joinGame(socket);
    
    socket.on('chat:message', (data) => {
        io.sockets.emit('chat:message', data);
        console.log(data);
    });
    
    socket.on('chat:typing', (data) =>{
        socket.broadcast.emit('chat:typing', data)
        //console.log(data);
    })
    

    if (getOpponent(socket)) {
        socket.emit("game.begin", {
            symbol: players[socket.id].symbol,
        });
        getOpponent(socket).emit("game.begin", {
            symbol: players[getOpponent(socket).id].symbol,
        });
    }
    
    
    socket.on("make.move", function (data) {
        if (!getOpponent(socket)) {
            return;
        }
        socket.emit("move.made", data);
        getOpponent(socket).emit("move.made", data);
    });
    
    socket.on("disconnect", function () {
        if (getOpponent(socket)) {
            getOpponent(socket).emit("opponent.left");
        }
    });
});


function joinGame(socket) {
    players[socket.id] = {
        opponent: unmatched,
        
        symbol: "X",
        // El socket que se encuentra asociado a este jugador
        socket: socket,
    };
    if (unmatched) {
        players[socket.id].symbol = "O";
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        unmatched = socket.id;
    }
}

function getOpponent(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}