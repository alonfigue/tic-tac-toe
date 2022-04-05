const socket = io()

//Elementos del DOM (de html). Nota: document es una variable de js
let username = document.getElementById('username');
let message = document.getElementById('message');
let btn = document.getElementById('send');
let output = document.getElementById('output');
let actions = document.getElementById('actions');

btn.addEventListener('click', function () {
    socket.emit('chat:message', {
        username: username.value,
        message: message.value
    });
});

//Cuando se envía un mensaje pulsando el botón, se imprime en consola un objeto con Usuario y Mensaje
console.log({
    username: username.value,
    message: message.value
});

//emite el nombre del usuario cuando el usuario está escribiendo
message.addEventListener('keypress', function (){
    socket.emit('chat:typing', username.value);
});

//muestra en div output el usuario con su mensaje en todas las ventanas
socket.on('chat:message', function(data) {
    actions.innerHTML = ``;
    console.log(data)
    output.innerHTML +=` <p>
    <strong>${data.username}</strong>: ${data.message}
    </p> `
});

socket.on('chat:typing', function (data) {
    actions.innerHTML = `<p><en>${data} está escribiendo un mensaje...</en></p>`
});

//Variable para el juego de la vieja (símbolo X or O)
var symbol;

$(function () {
    $(".board button").attr("disabled", true);
    $(".board> button").on("click", makeMove);
    // Evento es llamado cuando cuando cualquiera de los jugadores hace un movimiento
    socket.on("move.made", function (data) {
        // Hacer el movimiento
        $("#" + data.position).text(data.symbol);
        // Si el símbolo es el mismo que el símbolo del jugador, podemos asumir que es su turno.
        
        myTurn = data.symbol !== symbol;
        
        // Mostrar de quién es el turno, cuando el juego no ha culminado
        if (!isGameOver()) {
            if (gameTied()) {
                $("#messages").text("¡Juego empatado!");
                $(".board button").attr("disabled", true);
            } else {
                renderTurnMessage();
            }
            // Cuando el juego termina
        } else {
            // Mensaje para el perdedor
            if (myTurn) {
                $("#messages").text("Juego terminado. Perdiste...");
                // Mensaje para el ganador
            } else {
                $("#messages").text("Juego terminado. ¡Ganaste!");
            }
            // Desabilitar el board o tabla de juego
            $(".board button").attr("disabled", true);
        }
    });
    
    // Estado inicial cuando el juego inicia
    socket.on("game.begin", function (data) {
        // El servidor asignará un símbolo a cada jugador (X or O)
        symbol = data.symbol;
        // Entregar la X al jugaador con primer turno
        myTurn = symbol === "X";
        renderTurnMessage();
    });
    
    // Desabilitar tabla o board si uno de los jugadores se desconecta
    socket.on("opponent.left", function () {
        $("#messages").text("Contrincante desconectado.");
        $(".board button").attr("disabled", true);
    });
});

function getBoardState() {
    var obj = {};
    // Componiendo un objeto de todas las equis y os que se encuentran en la tabla
    $(".board button").each(function () {
        obj[$(this).attr("id")] = $(this).text() || "";
    });
    return obj;
}

function gameTied() {
    var state = getBoardState();
    
    if (
        state.a0 !== "" &&
        state.a1 !== "" &&
        state.a2 !== "" &&
        state.b0 !== "" &&
        state.b1 !== "" &&
        state.b2 !== "" &&
        state.b3 !== "" &&
        state.c0 !== "" &&
        state.c1 !== "" &&
        state.c2 !== ""
        ) {
            return true;
        }
    }
    
    function isGameOver() {
        var state = getBoardState(),
        // Una de las filas debe de ser igual a alguno de estos para acabar el juego
        matches = ["XXX", "OOO"],
        // Estas son las posibles combinaciones para ganar el juego (fila, columna o diagonal) - por convención se elige las letras a, b y c y
        //números 0, 1 y 2
        rows = [
            state.a0 + state.a1 + state.a2,
            state.b0 + state.b1 + state.b2,
            state.c0 + state.c1 + state.c2,
            state.a0 + state.b1 + state.c2,
            state.a2 + state.b1 + state.c0,
            state.a0 + state.b0 + state.c0,
            state.a1 + state.b1 + state.c1,
            state.a2 + state.b2 + state.c2,
        ];
        
        // para ambos: XXX or OOO
        for (var i = 0; i < rows.length; i++) {
            if (rows[i] === matches[0] || rows[i] === matches[1]) {
                return true;
            }
        }
    }
    
    function renderTurnMessage() {
        // Desabilitar la tabla si es el turno del contrincante
        if (!myTurn) {
            $("#messages").text("No es tu turno.");
            $(".board button").attr("disabled", true);
            // Habilitar la tabla si es tu turno
        } else {
            $("#messages").text("Viene tu turno.");
            $(".board button").removeAttr("disabled");
        }
    }
    
    function makeMove(e) {
        e.preventDefault();
        // No es tu turno
        if (!myTurn) {
            return;
        }
        // El espacio del cuadro ya está seleccionado
        if ($(this).text().length) {
            return;
        }
        
        // Enviar movimiento elegido al servidor con el uso del evento de socket.io "emit"
        socket.emit("make.move", {
            symbol: symbol,
            position: $(this).attr("id"),
        });
    }