const socket = io()

//Elementos del DOM (de html). Nota: document es una variable de js
let message = document.getElementById('message');
let username = document.getElementById('username');
let btn = document.getElementById('send');
let output = document.getElementById('output');
let actions = document.getElementById('actions');

btn.addEventListener('click', function () {
    socket.emit('chat:message', {
        username: username.value,
        message: message.value
    });
});

console.log({
    username: username.value,
    message: message.value
});

//emite el nombre del usuario cuando el usuario está escribiendo
message.addEventListener('keypress', function (){
    socket.emit('chat:typing', username.value);
});

//muestra en div output el username y el mensaje en todas las ventanas
socket.on('chat:message', function(data) {
    actions.innerHTML = ``;
    console.log(data)
    output.innerHTML +=` <p>
    <strong>${data.username}</strong>: ${data.message}
    </p> `
});

socket.on('chat:typing', function (data) {
    actions.innerHTML = `<p><en>${data} is typing a message...</en></p>`
});

var symbol;
$(function () {
    $(".board button").attr("disabled", true);
    $(".board> button").on("click", makeMove);
    // Event is called when either player makes a move
    socket.on("move.made", function (data) {
        // Render the move
        $("#" + data.position).text(data.symbol);
        // If the symbol is the same as the player's symbol,
        // we can assume it is their turn
        
        myTurn = data.symbol !== symbol;
        
        // If the game is still going, show who's turn it is
        if (!isGameOver()) {
            if (gameTied()) {
                $("#messages").text("¡Juego empatado!");
                $(".board button").attr("disabled", true);
            } else {
                renderTurnMessage();
            }
            // If the game is over
        } else {
            // Show the message for the loser
            if (myTurn) {
                $("#messages").text("Juego terminado. Perdiste...");
                // Show the message for the winner
            } else {
                $("#messages").text("Juego terminado. ¡Ganaste!");
            }
            // Disable the board
            $(".board button").attr("disabled", true);
        }
    });
    
    // Set up the initial state when the game begins
    socket.on("game.begin", function (data) {
        // The server will asign X or O to the player
        symbol = data.symbol;
        // Give X the first turn
        myTurn = symbol === "X";
        renderTurnMessage();
    });
    
    // Disable the board if the opponent leaves
    socket.on("opponent.left", function () {
        $("#messages").text("Contrincante desconectado.");
        $(".board button").attr("disabled", true);
    });
});

function getBoardState() {
    var obj = {};
    // We will compose an object of all of the Xs and Ox
    // that are on the board
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
        // One of the rows must be equal to either of these
        // value for
        // the game to be over
        matches = ["XXX", "OOO"],
        // These are all of the possible combinations
        // that would win the game
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
        
        // to either 'XXX' or 'OOO'
        for (var i = 0; i < rows.length; i++) {
            if (rows[i] === matches[0] || rows[i] === matches[1]) {
                return true;
            }
        }
    }
    
    function renderTurnMessage() {
        // Disable the board if it is the opponents turn
        if (!myTurn) {
            $("#messages").text("No es tu turno.");
            $(".board button").attr("disabled", true);
            // Enable the board if it is your turn
        } else {
            $("#messages").text("Viene tu turno.");
            $(".board button").removeAttr("disabled");
        }
    }
    
    function makeMove(e) {
        e.preventDefault();
        // It's not your turn
        if (!myTurn) {
            return;
        }
        // The space is already checked
        if ($(this).text().length) {
            return;
        }
        
        // Emit the move to the server
        socket.emit("make.move", {
            symbol: symbol,
            position: $(this).attr("id"),
        });
    }