var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
var cors = require('cors');
var routes = require('./routes');
var config = require('./config');
const { ExpressPeerServer } = require('peer');

SSL_KEY_FILE = './certs/key.pem'
SSL_CERT_FILE = './certs/cert.pem'
SSL_PASS = 'sampath'
SERVER_PORT = config.PORT
SECURE = false;

if (fs.existsSync(SSL_KEY_FILE)) {
    console.log('SSL certs found.');
    SECURE = true;
}

console.log('Secure:', SECURE);
var app = express();
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

var server = null;
if (SECURE) {
    var options = {
        key: fs.readFileSync(SSL_KEY_FILE),
        cert: fs.readFileSync(SSL_CERT_FILE),
        passphrase: SSL_PASS
    };
    server = https.createServer(options, app).listen(SERVER_PORT, function(){
      console.log("secure server started on port - " + SERVER_PORT);
    });
} else {
    server = http.createServer(app).listen(SERVER_PORT, function(){
      console.log("server started on port - " + SERVER_PORT);
    });
}

// signalling server
const peerServer = ExpressPeerServer(server, {
  path: '/'
});

app.use('/peerjs', peerServer);

