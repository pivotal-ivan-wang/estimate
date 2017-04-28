$(document).ready(function () {
  var socket = io();

  $('.join-button').click(function join() {
    if ($('.room-input').val() !== "" && $('.user-input').val() !== "") {
      socket.emit('join', {room: $('.room-input').val(), user: $('.user-input').val()});
    }
  });

  $('.estimate-button').click(function estimate() {
    var estimate = parseInt($(this).data("estimate"));
    socket.emit('estimate', estimate);

    $('.estimate-button').removeClass('w3-green w3-hover-green');
    $('.estimate-button[data-estimate='+estimate+']').addClass('w3-green w3-hover-green');
  });

  socket.on('join success', function() {
    $('.join-room-container').hide();
    $('.estimate-container').hide();
    $('.loader-container').show();
  });

  socket.on('join fail', function() {
    alert('room not found');
  });

  socket.on('kick out', function() {
    $('.join-room-container').show();
    $('.estimate-container').hide();
    $('.loader-container').hide();
  });

  socket.on('request estimate', function(storyData) {
    $('.join-room-container').hide();
    $('.loader-container').hide();
    $('.estimate-container').show();
    $('.estimate-button').removeClass('w3-green w3-hover-green');
    $('.estimate-progress-bar').show();
    $('.estimate-progress').width('0%');
    $('.average-estimate').hide();
    $('.story-title').html(storyData.title);
    $('.story-link').attr("href", storyData.url)
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

  socket.on('estimate complete', function(estimate) {
    $('.estimate-progress-bar').hide();
    $('.average-estimate').html(estimate);
    $('.average-estimate').show();
  });
});