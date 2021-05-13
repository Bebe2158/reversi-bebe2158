function getIRIParameterValue(requestedKey){
    Let pageIRI = window.location.search.substring(1);
    let pageIRIVariables = pageIRI.split('&');
    for(let i = 0; i < pageIRIVariables.length; i++){
        let data = pageIRIVariables[i].split('=');
        let key = data[0];
        let value = data[1];
        if (key === requestedKey){
            return value;
        }
    }
}

let username = decodeURI(getIRIParameterValue('username'));
if ((typeof username == 'underfined')) || (username === null)){
    username = "Anonymous_"+Math.floor(Math.random()*1000);
}

let chatRoom = 'lobby';

/* set to sokcet io */


$('#messages').prepend('<b>'+username+':</b>');


let socket = io();
socket.on('log',function(array) {
    console.log.apply(console,array);
});

socket.on('join_room', (payload) =>){
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Sever did not send');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newString = '<p class=\'join_room_response\'>'+payload.username+' join the '+payload.room+'. (There are '+payload.count+' users in this room)</p>';
    $('#message').prepend(newStrin);
})

function sendChatMessage(){
    let request = {};
    request.room = chatRoom;
    request.username = username;
    request.message = $('#chatMessage').val();
    console.log('**** Clinet log message, sending \'send_chat_message\' command: '+JASON.stringify(request));
    socket.emit('send_chat_message',request);
}

socket.on('send_chat_message_response', (payload) =>){
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Sever did not send');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newString = '<p class=\'chat_message\'><b>'+payload.username+'</b>: '+payload.message+')</p>';
    $('#message').prepend(newStrin);

/* request to join chat room */
$( () => {
    let request = {};
    request.room = chatRoom;
    request.username = username;
    console.log('**** Clinet log message, sending \'join_room\' command: '+JASON.stringify(request));
    socket.emit('join_room', request);
});


