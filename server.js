/******************************/
/* set up static file */
let static = require ('node-static');

/* set up http file */
let http = require('http');

/* assume we are running */
let port = process.env.PORT;
let directory = __dirname + '/public';

/* if not */
if ((typeof port == 'undefined') || (port === null)) {
    port = 8080;
    directory = './public';
}

/* set up static fil server */
let file = new static.Server(directory);

let app = http.createServer(
    function(request,response){
        request.addListener('end',
            function(){
                file.serve(request,response);
            }
        ).resume();
    }
).listen(port);

console.log('The server is running');

/* Set up registry */
let players = [];


/******************************/
/* set up static file */

const { Server } = require("socket.io");
const io = new Server(app);

io.on('connection', (socket) => {

	/* output a log */
	function serverLog(...messages){
		io.emit('log',['**** Message from the server:\n']);
		messages.forEach((item) => {
			io.emit('log',['****\t'+item]);
			console.log(item);
		});
    }

    serverLog('a page connected to the server: '+socket.id);






















/* join room */

    socket.on('join_room', (payload) => {
        serverLog('Server received a command','\'join_room\'',JSON.stringify(payload));
        if(( typeof payload == 'undefined') || (payload === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a payload';
         socket.emit('join_room_response',response);
         serverLog('join_room command failed', JSON.stringify(response));
         return;
        }
        let room = payload.room;
        let username = payload.username;
        if(( typeof room == 'undefined') || (room === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a valid room to join';
         socket.emit('join_room_response',response);
         serverLog('join_room command failed', JSON.stringify(response));
         return;
        }
        if(( typeof username == 'undefined') || (username === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a valid username to join ';
         socket.emit('join_room_response',response);
         serverLog('join_room command failed', JSON.stringify(response));
         return;
        }

        socket.join(room);

        io.in(room).fetchSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.includes(socket)){
                response = {};
                response.result = 'fail';
                response.message = 'Server interal error';
                socket.emit('join_room_response',response);
                serverLog('join_room command failed', JSON.stringify(response));
            }
            else{
                players[socket.id] = {
                    username: username,
                    room: room
                }
                /* Announce to everyone in the room */
                for (const member of sockets) {
                    response = {
                        result: 'success',
                        socket_id: member.id,
                        room: players[member.id].room,
                        username: players[member.id].username,
                        count: sockets.length,
                    }
                    /* Tell everyone new user has join */
                    io.of('/').to(room).emit('join_room_response', response);
                    serverLog('join_room succeeded', JSON.stringify(response));
                    if (room !== "Lobby") {
                        send_game_update(socket, room, 'initial update');
                    }
                }
            }    
        });
	});

    







    socket.on('invite', (payload) => {
        serverLog('Server received a command', '\'invite\'', JSON.stringify(payload));

        if ((typeof payload == 'undefined') || (payload === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a payload';
         socket.emit('invite_response',response);
         serverLog('invite command failed', JSON.stringify(response));
         return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user === "")) {
         response = {
            result:  'fail',
            message : 'client did not send a valid user to invite to play'
         }
         socket.emit('invite_response', response);
         serverLog('invite command failed', JSON.stringify(response));
         return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result: 'fail',
                message : 'The user that was invited is not in a room'
            }
            socket.emit('invite_response', response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username === "")) {
             response = {
                result: 'fail',
                message : 'The user that was invited does not have a name registed'
            }
            socket.emit('invite_response', response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }

        /* Make sure the invited palyer is present */
        io.in(room).allSockets().then((sockets) => {
            /* invite is not in the room */
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)) {
                response = {
                    result: 'fail',
                    message : 'The user that was invited is no longer in the room'
                }
                socket.emit('invite_response', response);
                serverLog('invite command failed', JSON.stringify(response));
                return;
            }
            /* Invitee is in the room */
            else{
                response = {
                    result: 'success',
                    socket_id: requested_user
                }
                socket.emit("invite_response", response);

                 response = {
                    result: 'success',
                    socket_id: socket.id
                }
                socket.to(requested_user).emit("invited", response);
                serverLog('invite command succeeded', JSON.stringify(response));
            }   
        });
	});

    socket.on('uninvite', (payload) => {
        serverLog('Server received a command', '\'uninvite\'', JSON.stringify(payload));

        if ((typeof payload == 'undefined') || (payload === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a payload';
         socket.emit('uninvited', response);
         serverLog('uninvite command failed', JSON.stringify(response));
         return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user === "")) {
         response = {
            result:  'fail',
            message : 'client did not send a valid user to uninvite'
         }
         socket.emit('uninvited', response);
         serverLog('uninvite command failed', JSON.stringify(response));
         return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result: 'fail',
                message : 'The user that was uninvited is not in a room'
            }
            socket.emit('uninvited', response);
            serverLog('uninvited command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username === "")) {
             response = {
                result: 'fail',
                message : 'The user that was uninvited does not have a name registed'
            }
            socket.emit('uninvited', response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }

        /* Make sure the invited palyer is present */
        io.in(room).allSockets().then((sockets)=>{
            /* uninvitee is not in the room */
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result: 'fail',
                    message : 'The user that was uninvited is no longer in the room'
            }
            socket.emit('uninvited', response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
            }
            /* unInvitee is in the room */
            else{
                response = {
                    result: 'success',
                    socket_id: requested_user
                }
                socket.emit("uninvited", response);

                 response = {
                    result: 'success',
                    socket_id: socket.id
                }
                socket.to(requested_user).emit("uninvited", response);
                serverLog('uninvite command succeeded', JSON.stringify(response));
            }   
        });
	});    
    socket.on('game_start', (payload) => {
        serverLog('Server received a command', '\'game_start\'', JSON.stringify(payload));
        /* Check that the data is coming from the client is good */
        if ((typeof payload == 'undefined') || (payload === null)) {
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a payload';
         socket.emit('game_start_response', response);
         serverLog('game_start command failed', JSON.stringify(response));
         return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user === "")) {
         response = {
            result:  'fail',
            message : 'client did not send a valid user to engage in play'
         }
         socket.emit('game_start_response', response);
         serverLog('game_start command failed', JSON.stringify(response));
         return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result: 'fail',
                message : 'The user that was engaged to play is not in a room'
            }
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username === "")) {
             response = {
                result: 'fail',
                message : 'The user that was engage to play does not have a name registed'
            }
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }

        /* Make sure the invited palyer to engage is present */
        io.in(room).allSockets().then((sockets) => {
            /* Engaged player is not in the room */
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)) {
                response = {
                    result: 'fail',
                    message : 'The user that was engage to play is no longer in the room'
            }
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
            }
            /* Engaged player is in the room */
            else {
                let game_id = Math.floor(1 + Math.random() * 0x100000).toString(16);
                response = {
                    result: 'success',
                    game_id: game_id,
                    socket_id: requested_user
                }
                socket.emit("game_start_response", response);
                socket.to(requested_user).emit("game_start_response", response);
                serverLog('game_start command succeeded', JSON.stringify(response));
            }   
        });
	});

    
    socket.on('disconnect', () => {
	    serverLog('a page disconnected from the server: ' + socket.id);
        if((typeof players[socket.id] != 'undefined') && (players[socket.id] != null)){
            let payload = {
                username: players[socket.id].username,
                room: players[socket.id].room,
                count: Object.keys(players).length -1,
                socket_id: socket.id
            };
            let room = players[socket.id].room;
            delete players[socket.id];
            /* Tell everyone who left the room */
            io.of("/").to(room).emit('player_disconnected',payload);
            serverLog('player_disconneted succeeded ',JSON.stringify(payload));
        }
	});


/* send chat message command handler */
    socket.on('send_chat_message', (payload) => {
        serverLog('Server received a command','\'send_chat_message\'',JSON.stringify(payload));
        if(( typeof payload == 'undefined') || (payload === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a payload';
         socket.emit('send_chat_message',response);
         serverLog('send_chat_message command failed', JSON.stringify(response));
         return;
        }
        let room = payload.room;
        let username = payload.username;
        let message = payload.message;
        if(( typeof room == 'undefined') || (room === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a valid room to message';
         socket.emit('send_chat_message_response',response);
         serverLog('send_chat_message command failed', JSON.stringify(response));
         return;
        }
        if(( typeof username == 'undefined') || (username === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a valid username as a message souce ';
         socket.emit('send_chat_message_response',response);
         serverLog('send_chat_message command failed', JSON.stringify(response));
         return;
        }
        if(( typeof message == 'undefined') || (message === null)){
         response = {};
         response.result = 'fail';
         response.message = 'client did not send a valid message';
         socket.emit('send_chat_message_response',response);
         serverLog('send_chat_message command failed', JSON.stringify(response));
         return;
        }

        /* Handle the command */
        let response = {};
        response.result = 'success';
        response.username = username;
        response.room = room;
        response.message = message;
        /* Tell everyone in the room what the message is */
        io.of('/').to(room).emit('send_chat_message_response',response);
        serverLog('send_chat_message command succeeded', JSON.stringify(response));
	});


    socket.on('play_token', (payload) => {
        serverLog('Server received a command','\'play_token\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('play_token_response', response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }
        let player = players[socket.id];
        if ((typeof player == 'undefined') || (player === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'play_token came from an unregistered player';
             socket.emit('play_token_response', response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let username = player.username;
        if ((typeof username == 'undefined') || (username === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'play_token command did not come from a registered username';
            socket.emit('play_token_response', response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let game_id = player.room;  
        if ((typeof game_id == 'undefined') || (game_id === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid game';
            socket.emit('play_token_response', response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let row = payload.row;
        if ((typeof row == 'undefined') || (row === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid row';
            socket.emit('play_token_response', response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let column = payload.column;
        if ((typeof column == 'undefined') || (column === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid column';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let color = payload.color;
        if ((typeof color == 'undefined') || (color === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid color';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let game = game[game_id];
        if ((typeof game == 'undefined') || (game === null)) {
            response = {};
             response.result = 'fail';
            response.message = 'There was no valid game';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let response = {
            result: 'success'
        }
        socket.emit('play_token_response', response);

        /* Execute the move */
        if (color === 'white') {
            game.board[row][column] = 'w';
            game.whose_turn = 'black';
        }
        else if (color === 'black') {
            game.board[row][column] = 'b';
            game.whose_turn = 'white';
        }

        send_game_update(socket, game_id, 'played a token');
	});
}); 



/* Code related game state */

let games = [];

function create_new_game() {
    let new_game = {};
    new_game.player_white = {};
    new_game.player_white.socket = "";
    new_game.player_white.username = "";
    new_game.player_black = {};
    new_game.player_black.socket = "";
    new_game.player_black.username = "";

    var d = new Date();
    new_game.last_move_time = d.getTime();

    new_game.whose_turn = 'white';

    new_game.board = [
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', 'w', 'b', ' ', ' ', ' '],
        [' ', ' ', ' ', 'b', 'w', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
    ];
    
    return new_game;

}


function send_game_update(socket, game_id, message) {
    /* check to see if a game with game_id exist */
    if ((typeof games[game_id] == 'undefined') || (games[game_id] === null)) {
        console.log("No game exists with game id:" + game_id + ". Making a new game for " + socket.id);
        games[game_id] = create_new_game();
    }

    io.of('/').to(game_id).allSockets().then((sockets) => {

        const iterator = sockets[Symbol.iterator]();
        if (sockets.size >= 1) {
            let first = iterator.next().value;
            if ((games[game_id].player_white.socket != first) &&
                (games[game_id].player_black.socket != first)) {
                /* player does not have color */
                if (games[game_id].player_white.socket === "") {
                    /* this player sould be white */
                    console.log("White is assigned to: " + first);
                    games[game_id].player_white.socket = first;
                    games[game_id].player_white.username = players[first].username;
                }
                else if (games[game_id].player_black.socket === "") {
                    /* this player sould be black */
                    console.log("Black is assigned to: " + first);
                    games[game_id].player_black.socket = first;
                    games[game_id].player_black.username = players[first].username;
                }
                else {
                    /* this player shoud be kciked out */
                    console.log("Kicking " + first + " out of game: " + game_id);
                    io.in(first).socketsLeave([game_id]);
                }
            }
        }
        if(sockets.size >= 2) {
            let second = iterator.next().value;
            if ((games[game_id].player_white.socket != second) &&
               (games[game_id].player_black.socket != second)) {
                /* player does not have color */
                if (games[game_id].player_white.socket === "") {
                    /* this player sould be white */
                    console.log("White is assigned to: " + second);
                    games[game_id].player_white.socket = second;
                    games[game_id].player_white.username = players[second].username;
                }
                else if (games[game_id].player_black.socket === "") {
                    /* this player sould be black */
                    console.log("Black is assigned to: " + second);
                    games[game_id].player_black.socket = second;
                    games[game_id].player_black.username = players[second].username;
                }
                else {
                    /* this plauer shoud be kciked out */
                    console.log("Kicking " + second + " out of game: " + game_id);
                    io.in(second).socketsLeave([game_id]);
                }
            }
        }

        /* send game update */ 
        let payload = {
            result: 'success',
            game_id: game_id,
            game: games[game_id],
            message: message
        }
        io.of("/").to(game_id).emit('game_update', payload);
    })


    /* check if the game is over */

    let count = 0;
    for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 8; column++) {
            if (games[game_id].board[row][column] != ' ') {
                count++;
            }
        }
    } 
    if (count === 64) {
        let payload = {
            result: 'success',
            game_id: game_id,
            game: games[game_id],
            who_won: 'everyone'
        }
        io.in(game_id).emit('game_over', payload);
   
        /* Delete old games after one hour */
      
        setTimeout(
            ((id) => {
                return (() => {
                    delete game[id];
                });
            })(game_id), 60 * 60 * 1000
        );
      
    }  
}





