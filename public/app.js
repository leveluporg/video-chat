
// Handle prefixed versions
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

// State
var myStream;

// Backend Config
const SERVER_HOST = window.location.hostname;
if (window.location.port != null) {
  SERVER_PORT = window.location.port;
}

init();

// Start everything up
function init() {
  if (!navigator.getUserMedia) return unsupported();

  getLocalAudioStream(function(err, stream) {
    if (err || !stream) return;
    
    displayLocalStream(stream);
    connectToPeerJS(function(err) {
      if (err) return;

      registerIdWithServer().then(() => {
        if (call.peers.length) callPeers();
        displayShareMessage();
      });
    });
  });
}

// Display local stream
function displayLocalStream(stream) {
   playStream(stream, true); 
}

// Connect to PeerJS and get an ID
function connectToPeerJS(cb) {
  display('Connecting to PeerJS...');
  window.me = new Peer({ 
    host: SERVER_HOST,
    port: SERVER_PORT,
    path: '/peerjs'
  })

  window.me.on('call', handleIncomingCall);
  
  window.me.on('open', function() {
    display('Connected.');
    display('ID: ' + me.id);
    cb && cb(null, me);
  });
  
  window.me.on('error', function(err) {
    display(err);
    cb && cb(err);
  });
}

// disconnect when navigate away from room
$(document).ready(function() {
  $(window).on("beforeunload", disconnect);
});

function disconnect(e) {
  deRegisterIdWithServer();
  for (peerId in window.me.peers) {
    peer = window.me.peers[peerId];
    peer.outgoing && peer.outgoing.close();
    peer.incoming && peer.incoming.close();
  }

  window.me.disconnect();
  return "confirm";
}

// Add our ID to the list of PeerJS IDs for this call
function registerIdWithServer(taken=false) {
  promise = new Promise((resolve, reject) =>  {
    msg = 'Enter name: ';
    if (taken) {
      msg = 'Username taken! ' + msg;
    }
    var name = prompt(msg);
    while (null == name) {
      name = prompt(msg);
    }
    display('Registering ID with server...');
    $.post('/room/' + call.id + '/addpeer/' + me.id + '/name/' + name)
    .done(function() {
        window.username = name
        display('Registered username - ' + window.username);
        resolve();
      }
    ).fail(function() {
      registerIdWithServer(true).then(() => resolve());
    })
  });
  return promise;
} 

// Remove our ID from the call's list of IDs
function deRegisterIdWithServer() {
  console.log(JSON.stringify(window.me.id));
  $.post('/room/' + call.id + '/removepeer/' + window.me.id);
}

// Call each of the peer IDs using PeerJS
function callPeers() {
  call.peers.forEach(callPeer);
}

function callPeer(peer) {
  peerId = peer['id'];
  username = peer['username'];
  display('Calling ' + username + '...');
  var peer = getPeer(peerId);
  peer.outgoing = me.call(peerId, myStream);
  
  peer.outgoing.on('error', function(err) {
    display(err);
  });

  peer.outgoing.on('stream', function(stream) {
    if (! peer.video) {
      display('Connected to ' + peerId + '.');
      addIncomingStream(peer, stream);
    }
  });

  peer.outgoing.on('close', function() {
    display('Peer disconnected, ' + peerId);
    removePeerStream(peerId);
  })
}

// When someone initiates a call via PeerJS
function handleIncomingCall(incoming) {
  display('Answering incoming call from ' + incoming.peer);
  
  if (!peerExists(incoming.peer)) {
    var peer = getPeer(incoming.peer);
    peer.incoming = incoming;
    incoming.answer(myStream);

    peer.incoming.on('stream', function(stream) {
      if (! peer.video) {
        addIncomingStream(peer, stream);
      }
    });

    peer.incoming.on('close', function(e) {
      display('Peer disconnected, ' + peer['id'])
      removePeerStream(peer['id']);
    })
  }
}

// Add the new audio stream. Either from an incoming call, or
// from the response to one of our outgoing calls
function addIncomingStream(peer, stream) {
  display('Adding incoming stream from ' + peer.id);
  peer.incomingStream = stream;
  playStream(stream, false, peer);
}

function removePeerStream(peerId) {
  $('#' + peerId).remove();
}

// Create an <audio> element to play the audio stream
function playStream(stream, local, peer) {
  video = $('<video autoplay />')
  // setting a stream as source of a video element is tricky.
  // audio[0].src = (URL || webkitURL || mozURL).createObjectURL(stream);
  video[0].srcObject = stream;

  // mute audio if local stream
  video[0].muted = local;

  // set id for easy deletion
  if (peer) {
    video[0].id = peer.id;
    peer.video = video;
  }
  
  // add to right container
  var videoHolder = $('#remote-streams');
  if (local === true) {
    videoHolder = $('#local-streams');
  }

  // add video to holder
  videoHolder.append(video)
}

// Get access to the microphone
function getLocalAudioStream(cb) {
  display('Trying to access your microphone. Please click "Allow".');

  navigator.getUserMedia (
    {video: true, audio: true},

    function success(audioStream) {
      display('Microphone is open.');
      myStream = audioStream;
      if (cb) cb(null, myStream);
    },

    function error(err) {
      display("Couldn't connect to microphone. Reload the page to try again.");
      if (cb) cb(err);
    }
  );
}



////////////////////////////////////
// Helper functions
function getPeer(peerId) {
  if (!window.me.peers) {
    window.me.peers = {}
  }
  return window.me.peers[peerId] || (window.me.peers[peerId] = {id: peerId});
}

function peerExists(peerId) {
  return window.me.peers && window.me.peers[peerId];
}

function displayShareMessage() {
  $('<p id="url">').html(location.href).appendTo('#url-div');
  // $('<button id="url-share-button">').html('Copy URL').appendTo('#url-div');
  
  // $('#url-share-button').click(function() {
  //   this.select();
  // });
}

function unsupported() {
  display("Your browser doesn't support getUserMedia.");
}

function display(message) {
  const params = new URLSearchParams(window.location.search)
  if (params.get('debug') != null) {
    $('<div />').html(message).appendTo('#log');
  }
}
