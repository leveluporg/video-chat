var express = require('express');
var fs = require('fs');
var router = express.Router();
var config = require('./config')
var Call = require('./call');

// All room names
rooms = JSON.parse(fs.readFileSync('./rooms.db'))

// Create a new Call instance, and redirect
router.get('/connect/:room', function(req, res) {
  room = req.params['room'];
  if (!rooms.includes(room)) {
    return res.status(404).send('Room not found');
  }
  var call = Call.create(room);
  res.redirect('/room/' + call.id);
});

router.get('/rooms', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rooms));
})

// Add PeerJS ID to Call instance when someone opens the page
router.post('/room/:id/addpeer/:peerid', function(req, res) {
  peerId = req.params['peerid'];
  callId = req.params['id']
  
  var call = Call.get(callId);
  if (!call) {
    return res.status(404).send('Call not found');
  }

  call.addPeer(peerId);
  res.json(call.toJSON());
});

// Remove PeerJS ID when someone leaves the page
router.post('/room/:id/removepeer/:peerid', function(req, res) {
  peerId = req.params['peerid'];
  callId = req.params['id'];

  var call = Call.get(callId);
  if (!call) {
    return res.status(404).send('Call not found');
  }

  call.removePeer(peerId);
  res.json(call.toJSON());
});

function callNotFound(res, callId) {
  return res.status(404).send('Call not found');
}

// End call
router.get('/room/:id/end', function(req, res) {
  callId = req.params['id'];

  var call = Call.get(callId);
  if (!call) {
    return callNotFound(res, callId);
  }

  Call.end(call);

  res.status(200).end('OK');
})

// Return JSON representation of a Call
router.get('/room/:id.json', function(req, res) {
  var call = Call.get(req.params['id']);
  if (!call) return res.status(404).send('Call not found');
  res.json(call.toJSON());
});

// Render call page
router.get('/room/:id', function(req, res) {
  var callId = req.params['id'];
  var call = Call.get(callId);

  // start call if valid room
  if (!call) {
    if (rooms.includes(callId)) {
      call = Call.create(callId);
    }
    else {
      res.status(404).end('call ID not found.')
    }
  }

  res.render('call', {
    call: call.toJSON(),
    port: config.PORT,
    host: config.HOST
  });
});

router.get('/all', function(req, res) {
  callsJson = [];
  console.log(Call.getAll());
  for (call of Call.getAll()) {
    if (call) {
      callsJson.push(call.toJSON());
    }
  }
  res.end(JSON.stringify(callsJson));
})

// Landing page
router.get('/', function(req, res) {
  res.render('index', {
    port: config.PORT,
    host: config.HOST, 
    rooms: rooms
  });
});

module.exports = router;
