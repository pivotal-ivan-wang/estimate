$(document).ready(function () {
  var socket = io();
  var $roomInput = $('.room-input');
  var $userInput = $('.user-input');
  var $joinButton = $('.join-button');
  var $estimateButton = $('.estimate-button');

  $joinButton.click(function join() {
    if ($roomInput.val() !== "" && $userInput.val() !== "") {
      $roomInput.prop('disabled', true);
      $userInput.prop('disabled', true);
      $joinButton.prop('disabled', true);
      $estimateButton.prop('disabled', false);
      socket.emit('join', {room: $roomInput.val(), user: $userInput.val()});
    }
  });

  $estimateButton.click(function estimate() {
    socket.emit('estimate', parseInt($(this).data("estimate")));
  });

  socket.on('update', function(session) {
    $('.room-data').text(JSON.stringify(session));
  });
});