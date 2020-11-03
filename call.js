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

Call.prototype.addPeer = function(username, peerId) {
  if (!this.peerExists(username, peerId)) {
    this.peers.push({
      'username': username,
      'id': peerId
    });
  }
};

Call.prototype.peerExists = function(username, peerId='') {
  for (peer of this.peers) {
    if (peer['username'] === username || peer['id'] === peerId) {
      return true;
    }
  }
  return false;
}

Call.prototype.removePeer = function(peerId) {
  for (idx in this.peers) {
    if (this.peers[idx]['id'] === peerId) {
      this.peers.splice(idx, 1);
    }
  }
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
