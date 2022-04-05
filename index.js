// SERVIDOR

//modulo de nodejs que permite trabajar con las rutas
const path = require('path');

//requerir express
const express = require('express');

//inicializar express
const app = express();

//settings... | : 124... ` : 96... ~ : 126
app.set('port', process.env.PORT || 3000);


//Files from frontend folder
//console.log(path.join(__dirname, 'frontend'));

//Send the folder frontend to the browser
app.use(express.static(path.join(__dirname, 'frontend')));


//start server (servidor realizado). Guardar esto en la constante server
const server = app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});


// websockets
//Bidirectional connection (modulo socketio)
const socketio = require('socket.io')
//Escuchar el servidor mediante la variable server (aqui ya socketio esta configurado)
const io = socketio(server);




var players = {},
unmatched;


//escuchar evento "connection" con su metodo "on"
io.on('connection', (socket) =>  {
    console.log('new connecion', socket.id);
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
        // The socket that is associated with this player
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


// eventos on (escuchar) y emit (enviar)

