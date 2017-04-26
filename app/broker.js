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
          clientSocket.emit('join fail');
        } else {
          session[room].users[user] = -1;

          clientSocket.join(room);
          clientSocket.emit('join success');
          serverSocket.to(room).emit('update', session[room]);
        }
      });

      clientSocket.on('request estimate', function() {
        var users = Object.keys(session[room].users);
        for (var i = 0; i < users.length; i ++) {
          session[room].users[users[i]] = -1;
        }
        serverSocket.to(room).emit('request estimate');
        serverSocket.to(room).emit('update', session[room]);
      });

      clientSocket.on('estimate', function(estimate) {
        session[room].users[user] = estimate;
        serverSocket.to(room).emit('update', session[room]);

        var estimates = Object.keys(session[room].users).map(function(key) {
          return session[room].users[key];
        });
        if (hasAllEstimates(estimates)) {
          serverSocket.to(room).emit('estimate complete', getAverageEstimate(estimates));
        }
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
      });
    });
  };

  this.createRoom = function(room) {
    if (session[room] === undefined) {
      session[room] = {};
    }
  };

  this.getSession = function() {
    return session;
  };

  function hasAllEstimates(estimates) {
    for (var i = 0; i < estimates.length; i ++) {
      if (estimates[i] == -1) {
        return false;
      }
    }
    return true;
  }

  function getAverageEstimate(estimates) {
    var map = {};
    var maxCount = 1;
    for (var i = 0; i < estimates.length; i ++) {
      var estimate = estimates[i];
      if (map[estimate] == undefined) {
        map[estimate] = 1;
      } else {
        map[estimate]++;
        if (map[estimate] > maxCount) {
          maxCount = map[estimate];
        }
      }
    }

    var mode = -1;
    for (var key in map) {
      if (map[key] == maxCount && key > mode) {
        mode = key;
      }
    }

    return mode;
  }
};

module.exports = Broker;