chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      //socket stuff
      var socket = io.connect('https://stark-springs-85101.herokuapp.com');

      var openRoom;
      var roomSession;

      socket.on('update', function(room) {
        roomSession = room;
        updateIpmRoomDialog();
        updateEstimateDialog();
      });

      //create dialogs:
      var ipmCreateRoomDialog = document.createElement('dialog');
      ipmCreateRoomDialog.className = 'ipm-create-room-dialog';
      ipmCreateRoomDialog.innerHTML = '<input class="room-input" type="text" placeholder="room" name="room" /><button class="create-ipm-button">create</button>';
      document.body.appendChild(ipmCreateRoomDialog);
      setupDialog(ipmCreateRoomDialog);

      var roomInput = document.getElementsByClassName("room-input")[0];
      var createIpmButton = document.getElementsByClassName("create-ipm-button")[0];
      createIpmButton.onclick = function() {
        if (openRoom === undefined) {
          openRoom = roomInput.value;
          socket.emit('host', openRoom);
          var listItem = document.getElementsByClassName('ipm-room')[0];
          listItem.innerHTML = 'IPM room: ' + openRoom;
          ipmCreateRoomDialog.close();
        }
      };

      var ipmRoomDialog = document.createElement('dialog');
      ipmRoomDialog.className = 'ipm-room-dialog';
      document.body.appendChild(ipmRoomDialog);
      setupDialog(ipmRoomDialog);

      function updateIpmRoomDialog() {
        if (roomSession !== undefined) {
          ipmRoomDialog.innerHTML = '<p>room: '+ roomSession.roomName + '</p>'
          + '<p>users:</p>';
          var users = Object.keys(roomSession.users);
          for (var i = 0; i < users.length; i ++) {
            ipmRoomDialog.innerHTML += '<p>' + users[i] + '</p>';
          }
        }
      }

      var estimateDialog = document.createElement('dialog');
      estimateDialog.className = 'estimate-dialog';
      estimateDialog.innerHTML = '';
      document.body.appendChild(estimateDialog);
      setupDialog(estimateDialog);

      function updateEstimateDialog() {
        if (roomSession !== undefined) {
          var estimateCount = 0;
          var users = Object.keys(roomSession.users);
          for (var i = 0; i < users.length; i ++) {
            if (roomSession.users[users[i]] !== -1) {
              estimateCount++;
            }
          }
          estimateDialog.innerHTML = '<p>' + estimateCount + '/' + users.length + '</p>';

          if (estimateCount == users.length) {
            for (var i = 0; i < users.length; i ++) {
              estimateDialog.innerHTML += '<p>' + users[i] + ': ' + roomSession.users[users[i]] + '</p>';
            }
          }
        }
      }

      //dom injections:
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(handleMutationEvents);
      });

      var config = {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true
      };

      observer.observe(document, config);

      var handleMutationEvents = function(mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, injectEstimate);
        injectEstimate(mutation.target);
      };

      var injectEstimate = function(node) {
        if (typeof node.querySelectorAll !== 'undefined') {
          addEstimateButton(node.querySelectorAll('.estimate.row'));
          addIpmRoom(node.querySelectorAll('.tc_page_header > ul'));
        }
      };

      var addEstimateButton = function(rows) {
        if (openRoom !== undefined) {
          Array.prototype.forEach.call(rows, function(row) {
            if (row.getElementsByClassName('estimate-button').length === 0
                && row.getElementsByClassName('item_-1').length !== 0) {
              var estimateButton = document.createElement('div');
              estimateButton.className = 'estimate-button';
              estimateButton.innerHTML = "Estimate";
              estimateButton.onclick = function() {
                socket.emit('request estimate', hackedStoryData(row));
                estimateDialog.showModal();
              };
              row.appendChild(estimateButton);
            }
          });
        }
      };

      var addIpmRoom = function(uls) {
        Array.prototype.forEach.call(uls, function(ul) {
          if (ul.getElementsByClassName('ipm-room').length === 0) {
            var listItem = document.createElement('li');
            listItem.className = 'tc_pull_right ipm-room';
            listItem.innerHTML = "Start IPM";
            listItem.onclick = function() {
              if (openRoom === undefined) {
                ipmCreateRoomDialog.showModal();
              } else {
                ipmRoomDialog.showModal();
              }
            };
            ul.appendChild(listItem);
          }
        });
      };
    }
  }, 10);
});

function setupDialog(dialog) {
  //clicking backdrop dismisses dialog
  dialog.onclick = function(event) {
    var rect = dialog.getBoundingClientRect();
    var isInDialog=(rect.top <= event.clientY && event.clientY <= rect.top + rect.height
      && rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        dialog.close();
    }
  };
}

function hackedStoryData(row) {
  //jQuery would be slightly prettier
  var form = row.parentElement.parentElement.parentElement.parentElement.parentElement;
  var storyTitle = form.querySelectorAll('fieldset.story.name')[0].querySelectorAll('textarea')[0].innerHTML;
  var storyUrl = form.querySelectorAll('button.clipboard_button.left_endcap')[0].getAttribute('data-clipboard-text');
  return { title: storyTitle, url: storyUrl };
}
