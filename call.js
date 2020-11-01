var uuid = require('uuid');

var calls = [];

function Call(room) {
  this.id = room;
  this.started = Date.now();
  this.peers = [];
}

Call.prototype.toJSON = function() {
  return {id: this.id, started: this.started, peers: this.peers};
};

Call.prototype.addPeer = function(peerId) {
  this.peers.push(peerId);
};

Call.prototype.removePeer = function(peerId) {
  var index = this.peers.lastIndexOf(peerId);
  if (index !== -1) this.peers.splice(index, 1);
};

Call.create = function(room) {
  var call = new Call(room);
  calls.push(call);
  return call;
};

Call.get = function(id) {
  return (calls.filter(function(call) {
    return id === call.id;
  }) || [])[0];
};

Call.getAll = function() {
  return calls;
};

Call.end = function(call) {
  const index = calls.indexOf(call);
  if (index > -1) {
    calls.splice(index, 1);
  }
}

module.exports = Call;