$(document).ready(function () {
  var socket = io();

  $('.join-button').click(function join() {
    if ($('.room-input').val() !== "" && $('.user-input').val() !== "") {
      socket.emit('join', {room: $('.room-input').val(), user: $('.user-input').val()});
    }
  });

  $('.estimate-button').click(function estimate() {
    socket.emit('estimate', parseInt($(this).data("estimate")));
  });

  socket.on('join success', function() {
    $('.join-room-container').hide();
    $('.estimate-container').hide();
    $('.loader-container').show();
  });

  socket.on('join fail', function() {
    alert('room not found');
  });

  socket.on('request estimate', function() {
    $('.join-room-container').hide();
    $('.loader-container').hide();
    $('.estimate-container').show();
  });

  socket.on('update', function(room) {
    var estimateCount = 0;
    var users = Object.keys(room.users);

    for (var i = 0; i < users.length; i ++) {
      if (room.users[users[i]] !== -1) {
        estimateCount++;
      }
    }

    $('.estimate-progress').width(estimateCount/users.length * 100 + '%');
  });
});