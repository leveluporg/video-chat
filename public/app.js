// Handle prefixed versions
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

// State
var me = {};
var myStream;
var peers = {};

// Backend Config
const SERVER_HOST = window.location.hostname;
if (window.location.port != null) {
  SERVER_PORT = window.location.port;
}

CONNECTION_STATE = 'NOT_CONNECTED'

init();

// Start everything up
function init() {
  if (!navigator.getUserMedia) return unsupported();

  getLocalAudioStream(function(err, stream) {
    if (err || !stream) return;
    
    displayLocalStream(stream);
    connectToPeerJS(function(err) {
      if (err) return;

      registerIdWithServer(me.id);
      if (call.peers.length) callPeers();
      else displayShareMessage();
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
  me = new Peer({
            host: SERVER_HOST,
            port: SERVER_PORT,
            path: '/peerjs'
        });
  
  CONNECTION_STATE = 'CONNECTED';

  me.on('call', handleIncomingCall);
  
  me.on('open', function() {
    display('Connected.');
    display('ID: ' + me.id);
    cb && cb(null, me);
  });
  
  me.on('error', function(err) {
    display(err);
    cb && cb(err);
  });
}

// disconnect when navigate away from room
$(document).ready(function() {
  $(window).on("beforeunload", disconnect);
  $(window).on("unload", disconnect);
});

function disconnect(e) {
  console.log('Disconnecting from call! Please wait..')
  if (CONNECTION_STATE === 'CONNECTED') {
    CONNECTION_STATE = 'DISCONNECTING';
    unregisterIdWithServer();
    me.disconnect();
  }
  if (CONNECTION_STATE === 'DISCONNECTING') {
    return "Please wait while we disconnect you. Do you still continue?";
  }
}

// Add our ID to the list of PeerJS IDs for this call
function registerIdWithServer() {
  display('Registering ID with server...');
  $.post('/room/' + call.id + '/addpeer/' + me.id);
} 

// Remove our ID from the call's list of IDs
function unregisterIdWithServer() {
  $.post('/room/' + call.id + '/removepeer/' + me.id);
}

// Call each of the peer IDs using PeerJS
function callPeers() {
  call.peers.forEach(callPeer);
}

function callPeer(peerId) {
  display('Calling ' + peerId + '...');
  var peer = getPeer(peerId);
  peer.outgoing = me.call(peerId, myStream);
  
  peer.outgoing.on('error', function(err) {
    display(err);
  });

  peer.outgoing.on('stream', function(stream) {
    display('Connected to ' + peerId + '.');
    addIncomingStream(peer, stream);
  });
}

// When someone initiates a call via PeerJS
function handleIncomingCall(incoming) {
  display('Answering incoming call from ' + incoming.peer);
  var peer = getPeer(incoming.peer);
  peer.incoming = incoming;
  incoming.answer(myStream);
  peer.incoming.on('stream', function(stream) {
    addIncomingStream(peer, stream);
  });
}

// Add the new audio stream. Either from an incoming call, or
// from the response to one of our outgoing calls
function addIncomingStream(peer, stream) {
  display('Adding incoming stream from ' + peer.id);
  peer.incomingStream = stream;
  playStream(stream, false);
}

// Create an <audio> element to play the audio stream
function playStream(stream, local) {
  video = $('<video autoplay />')
  // setting a stream as source of a video element is tricky.
  // audio[0].src = (URL || webkitURL || mozURL).createObjectURL(stream);
  video[0].srcObject = stream;

  // mute audio if local stream
  video[0].muted = local;
  
  // add to right container
  var videoHolder = $('#remote-streams');
  if (local === true) {
    var videoHolder = $('#local-streams');
  }
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
  return peers[peerId] || (peers[peerId] = {id: peerId});
}

function displayShareMessage() {
  share_url = ('<input type="text" value="' + location.href + '" readonly>');
  $('<div />').html(share_url).appendTo('#url');
  
  $('#url input').click(function() {
    this.select();
  });
}

function unsupported() {
  display("Your browser doesn't support getUserMedia.");
}

function display(message) {
  $('<div />').html(message).appendTo('#log');
}
