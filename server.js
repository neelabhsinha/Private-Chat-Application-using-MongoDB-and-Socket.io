const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/chatMessage');
const mongoClient = require('mongodb').MongoClient;

const dbname = 'chatApp';
const chatCollection = 'chats'; //collection to store all chats
const userCollection = 'onlineUsers'; //collection to maintain list of currently online users

const port = 5000;
const database = 'mongodb://localhost:27017/';
const app = express();

const server=http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log('New User Logged In with ID '+socket.id);
    
    //Collect message and insert into database
    socket.on('chatMessage', (data) =>{ //recieves message from client-end along with sender's and reciever's details
        var dataElement = formatMessage(data);
        mongoClient.connect(database, (err,db) => {
            if (err)
                throw err;
            else {
                var onlineUsers = db.db(dbname).collection(userCollection);
                var chat = db.db(dbname).collection(chatCollection);
                chat.insertOne(dataElement, (err,res) => { //inserts message to into the database
                    if(err) throw err;
                    socket.emit('message',dataElement); //emits message back to the user for display
                });
                onlineUsers.findOne({"name":data.toUser}, (err,res) => { //checks if the recipient of the message is online
                    if(err) throw err;
                    if(res!=null) //if the recipient is found online, the message is emmitted to him/her
                        socket.to(res.ID).emit('message',dataElement);
                });
            }
            db.close();
        });

    });

    socket.on('userDetails',(data) => { //checks if a new user has logged in and recieves the established chat details
        mongoClient.connect(database, (err,db) => {
            if(err)
                throw err;
            else {
                var onlineUser = { //forms JSON object for the user details
                    "ID":socket.id,
                    "name":data.fromUser
                };
                var currentCollection = db.db(dbname).collection(chatCollection);
                var online = db.db(dbname).collection(userCollection);
                online.insertOne(onlineUser,(err,res) =>{ //inserts the logged in user to the collection of online users
                    if(err) throw err;
                    console.log(onlineUser.name + " is online...");
                });
                currentCollection.find({ //finds the entire chat history between the two people
                    "from" : { "$in": [data.fromUser, data.toUser] },
                    "to" : { "$in": [data.fromUser, data.toUser] }
                },{projection: {_id:0}}).toArray((err,res) => {
                    if(err)
                        throw err;
                    else {
                        //console.log(res);
                        socket.emit('output',res); //emits the entire chat history to client
                    }
                });
            }
            db.close();
        });   
    });  
    var userID = socket.id;
    socket.on('disconnect', () => {
        mongoClient.connect(database, function(err, db) {
            if (err) throw err;
            var onlineUsers = db.db(dbname).collection(userCollection);
            var myquery = {"ID":userID};
            onlineUsers.deleteOne(myquery, function(err, res) { //if a user has disconnected, he/she is removed from the online users' collection
              if (err) throw err;
              console.log("User " + userID + "went offline...");
              db.close();
            });
          });
    });
});

app.use(express.static(path.join(__dirname,'front')));

server.listen(port, () => {
    console.log(`Chat Server listening to port ${port}...`);
});