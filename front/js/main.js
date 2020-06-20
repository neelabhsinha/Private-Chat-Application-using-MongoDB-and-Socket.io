socket = io ();
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix:true
});

let fromUser="John";
let toUser="Maria";
//socket.emit('userDetails',{fromUser,toUser});

function storeDetails() {
    fromUser = document.getElementById('from').value;
    toUser = document.getElementById('to').value;
    element = document.querySelectorAll(".chat-messages");
    socket.emit('userDetails',{fromUser,toUser}); //emits details of established chat
}

function storeTo() {
    
    //console.log(toUser);
}



//Submit message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault(); //Prevents default logging to a file
    const msg = e.target.elements.msg.value;
    final = {
        'fromUser':fromUser,
        'toUser':toUser,
        'msg':msg
    };
    socket.emit('chatMessage',final); //emits chat message along with sender and reciever to server
    document.getElementById('msg').value=" ";
});

socket.on('output',(data) =>{
    console.log(data);
});

socket.on('output',(data) => { //recieves the entire chat history upon logging in between two users and displays them
    for(var i=0; i<data.length;i++) {
        outputMessage(data[i]);
    }
    chatMessages.scrollTop=chatMessages.scrollHeight;
});

socket.on('message',(data) => { //recieves a message and displays it
        outputMessage(data);
        console.log(data);
    chatMessages.scrollTop=chatMessages.scrollHeight;
});

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML=`<p class="meta">${message.from}<span> ${message.time}, ${message.date}</span></p>
    <p class ="text">
        ${message.message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}