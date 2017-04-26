var Broker = require('./../broker');

describe('broker', function() {
  var serverSocket = jasmine.createSpyObj('socket', ['on', 'to', 'emit']);
  serverSocket.to.and.callFake(function() {
    return this;
  });

  var onConnection;
  var broker;

  beforeEach(function() {
    broker = new Broker(serverSocket);
    broker.init();
    onConnection = serverSocket.on.calls.mostRecent().args[1];
  });

  it('should setup on connection events', function() {
    expect(serverSocket.on).toHaveBeenCalledWith('connection', jasmine.any(Function));
  });

  describe('on connection', function() {
    var clientSocket = jasmine.createSpyObj('socket', ['on', 'join', 'emit', 'leave']);
    var onHost;
    var onJoin;
    var onEstimate;
    var onRequestEstimate;
    var onDisconnect;
    var onPing;

    beforeEach(function() {
      onConnection(clientSocket);
      onHost = clientSocket.on.calls.argsFor(0)[1];
      onJoin = clientSocket.on.calls.argsFor(1)[1];
      onEstimate = clientSocket.on.calls.argsFor(2)[1];
      onRequestEstimate = clientSocket.on.calls.argsFor(3)[1];
      onDisconnect = clientSocket.on.calls.argsFor(4)[1];
      onPing = clientSocket.on.calls.argsFor(5)[1];
    });

    it('should setup client events', function() {
      expect(clientSocket.on.calls.argsFor(0)[0]).toBe('host');
      expect(clientSocket.on.calls.argsFor(1)[0]).toBe('join');
      expect(clientSocket.on.calls.argsFor(2)[0]).toBe('estimate');
      expect(clientSocket.on.calls.argsFor(3)[0]).toBe('request estimate');
      expect(clientSocket.on.calls.argsFor(4)[0]).toBe('disconnect');
      expect(clientSocket.on.calls.argsFor(5)[0]).toBe('ping');
    });

    describe('on host', function() {
      it('should host room', function() {
        onHost('room0');
        expect(clientSocket.join).toHaveBeenCalledWith('room0');
        expect(clientSocket.emit).toHaveBeenCalledWith('update', { 'roomName': 'room0', 'users': {} });
      });
    });

    describe('on join', function() {
      it('should fail room if doesnt exist', function() {
        onJoin({ room: 'room1', user: 'user1' });
        expect(clientSocket.emit).toHaveBeenCalledWith('join fail');
      });

      it('should join room if exists', function() {
        onJoin({ room: 'room0', user: 'user2' });
        expect(clientSocket.emit).toHaveBeenCalledWith('join success');
        expect(serverSocket.emit).toHaveBeenCalledWith('update', { 'roomName': 'room0', 'users': { 'user2': -1 } });
      });
    });

    describe('on estimate', function() {
      it('should update session with estimate', function() {
        onEstimate(2);
        expect(serverSocket.to).toHaveBeenCalledWith('room0');
        expect(serverSocket.emit).toHaveBeenCalledWith('update', { 'roomName': 'room0', 'users': { 'user2': 2 } });
      });
    });

    describe('on request estimate', function() {
      it('should set all user estimates to -1', function() {
        onRequestEstimate();
        expect(serverSocket.to).toHaveBeenCalledWith('room0');
        expect(serverSocket.emit).toHaveBeenCalledWith('update', { 'roomName': 'room0', 'users': { 'user2': -1 } });
      });
    });

    describe('on disconnect', function() {
      it('should delete user if user is not host', function() {
        onDisconnect();
        expect(serverSocket.to).toHaveBeenCalledWith('room0');
        expect(serverSocket.emit).toHaveBeenCalledWith('update', { 'roomName': 'room0', 'users': {} });
        expect(clientSocket.leave).toHaveBeenCalledWith('room0');
      });

      it('should delete room if user is host', function() {
        onHost('room0');
        onDisconnect();
        expect(serverSocket.to).toHaveBeenCalledWith('room0');
        expect(serverSocket.emit).toHaveBeenCalledWith('update', undefined);
        expect(clientSocket.leave).toHaveBeenCalledWith('room0');
      });
    });

    describe('on ping', function() {
      it('should ping back', function() {
        onPing();
        expect(clientSocket.emit).toHaveBeenCalledWith('ping');
      });
    });
  });
});