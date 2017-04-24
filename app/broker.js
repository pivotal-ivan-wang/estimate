function Broker(socket) {
  var serverSocket = socket;
  var session = {};

  this.init = function() {
    serverSocket.on('connection', function(clientSocket) {
      var room;
      var user;
      var isHost;

      clientSocket.on('host', function(roomName) {
        isHost = true;
        room = roomName;
        session[room] = {roomName: room, users: {}};
        clientSocket.join(room);
        clientSocket.emit('update', session[room]);
      });

      clientSocket.on('join', function(data) {
        isHost = false;
        room = data.room;
        user = data.user;

        if (session[room] === undefined) {
          clientSocket.emit('update', {you: 'failed'});
        } else {
          session[room].users[user] = -1;

          clientSocket.join(room);
          serverSocket.to(room).emit('update', session[room]);
        }
      });

      clientSocket.on('estimate', function(estimate) {
        session[room].users[user] = estimate;

        serverSocket.to(room).emit('update', session[room]);
      });

      clientSocket.on('clear', function() {
        var users = Object.keys(session[room].users);
        for (var i = 0; i < users.length; i ++) {
          session[room].users[users[i]] = -1;
        }
        serverSocket.to(room).emit('update', session[room]);
      });

      clientSocket.on('disconnect', function() {
        if (isHost) {
          delete session[room];
          serverSocket.to(room).emit('update', session[room]);
          clientSocket.leave(room);
        } else {
          if (session[room] !== undefined) {
            delete session[room].users[user];
          }

          serverSocket.to(room).emit('update', session[room]);
          clientSocket.leave(room);
        }
      });

      clientSocket.on('ping', function() {
        clientSocket.emit('ping');
      })
    });
  };

  this.createRoom = function(room) {
    if (session[room] === undefined) {
      session[room] = {};
    }
  }

  this.getSession = function() {
    return session;
  }
};

module.exports = Broker;