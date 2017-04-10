// Based off of Shawn Van Every's Live Web
// http://itp.nyu.edu/~sve204/liveweb_fall2013/week3.html


// HTTP Portion
var http = require('http');
// URL module
var url = require('url');
var path = require('path');

// Using the filesystem module
var fs = require('fs');

var server = http.createServer(handleRequest);
server.listen(80);

console.log('Server started on port 8080');

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;

  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }

  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };

  // What is it?  Default to plain text
  var contentType = typeExt[ext] || 'text/plain';

  // User file system module
  fs.readFile(__dirname + pathname,
    // Callback function for reading
    function (err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
}

// WebSockets work with the HTTP server
var io = require('socket.io').listen(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function (socket) {

    console.log("new client: " + socket.id);

    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('user starts', function(data) {
        //console.log("Received: 'starts' ");
        gameState.userPush(socket);
      }
    );
    socket.on('user flaps', function(data) {
        //console.log("Received: 'flaps' ");
        gameState.userFlap(socket);
      }
    );

    socket.on('disconnect', function() {
      console.log("Client has disconnected");
      gameState.userPop(socket);
    });
  }
);

// This is a way to send to everyone including sender
// io.sockets.emit('message', "this goes to everyone");

// Game loop
var gameState = (function(sockets) {
  var gameState = {
    players : [],  // id, pos, size, velocity, state
    obstacles : [],  // pos, size, velocity
    gravity : [0, 4],
    map_size : [20000, 800],
    loopDelta : 0,
    desiredFrameRate : 30,
    prevDate : Date.now(),
    sockets : sockets
  };

  gameState.init = function() {
    // initiate world setting
    for(var i = 0; i < gameState.map_size[0]/200; i++) {
      var pos_x = i * 200;
      var pos_y = Math.floor(Math.random() * gameState.map_size[1]);
      var size = 20 + Math.floor(Math.random() * 100);
      gameState.obstacles.push({
        pos : [pos_x, pos_y],
        size : [size, size],
        velocity : [0,0]
      });
    }
  };

  gameState.mainLoop = function() {
    var self = gameState;
    var currDate = Date.now();
    self.loopDelta = currDate - self.prevDate;
    self.prevDate = currDate;

    // gravity + move on players and obstacles
    /*for (var i = 0; i < self.obstacles.length; i++) {
      self.obstacles[i].pos[0] += self.gravity[0] + self.obstacles[i].velocity[0];
      self.obstacles[i].pos[1] += self.gravity[1] + self.obstacles[i].velocity[1];
      if(self.obstacles[i].pos[1] > self.map_size[1]) {
        self.obstacles[i].pos[1] = 0;
      }
    }*/
    for (var j = 0; j < self.players.length; j++) {
      self.players[j].pos[0] = self.players[j].pos[0] + gameState.gravity[0] + self.players[j].velocity[0];
      self.players[j].pos[1] = self.players[j].pos[1] + gameState.gravity[1] + self.players[j].velocity[1];
      // reduce flap force
      self.players[j].velocity[1] = (self.players[j].velocity[1] < 0) ? self.players[j].velocity[1] * 0.6 : 0;
      //self.players[j].velocity[1] = -1 * self.gravity[1];

      if(self.players[j].pos[0] > self.map_size[0]) {
        self.players[j].pos[0] = 0;
      }
      if(self.players[j].pos[1] > self.map_size[1]) {
        self.players[j].state = 'player_dead';
        console.log(self.players[j].id + ' touched ground.');
      }
      // collision test -> overlap intersects
      for (var k = 0; k < self.obstacles.length; k++) {
        if(self.intersects(self.players[j].pos,[(self.players[j].pos[0] +self.players[j].size[0]),(self.players[j].pos[1] +self.players[j].size[1])],self.obstacles[k].pos,[(self.obstacles[k].pos[0] + self.obstacles[k].size[0]),(self.obstacles[k].pos[1] +self.obstacles[k].size[1])])) {
          self.players[j].state = 'player_dead';
          console.log(self.players[j].id + ' touched obstacle.');
        }
      }
    }

    var worldState = {
      players: self.players,
      obstacles: self.obstacles,
      map_size : self.map_size,
      loopDelta : self.loopDelta
    };
    self.sockets.emit('sync world state', worldState);
    //document.getElementById("frameRate").innerHTML = Math.round(60 / (gameState.loopDelta * 0.1));
    setTimeout(self.mainLoop, 20);
  };

  gameState.intersects = function(r1from, r1to, r2from, r2to) {
    return !(r2from[0] >= r1to[0] || r2to[0] <= r1from[0] || r2from[1] >= r1to[1] || r2to[1] <= r1from[1]);
  };

  //gameState.userConnect = function(user_socket) {  };
  gameState.userPush = function(user_socket) {
    //var pos_x = Math.floor(Math.random() * gameState.map_size[0]);
    var pos_x = Math.floor(0.5 * gameState.map_size[0]);
    var pos_y = Math.floor(gameState.map_size[1] / 2);
    var size = 20;
    gameState.players.push({
      id : user_socket.id,
      pos : [pos_x, pos_y],
      size : [size, size],
      velocity : [4,0]
    });
    console.log(user_socket.id + ' has pushed in world.');
  };
  gameState.userFlap = function(user_socket) {
    for (var i = 0; i < gameState.players.length; i++) {
      if(user_socket.id == gameState.players[i].id) {
        gameState.players[i].velocity[1] = -6 * gameState.gravity[1];
      }
    }
    console.log(user_socket.id + ' flapped.');
  };
  gameState.userPop = function(user_socket) {
    for (var i = 0; i < gameState.players.length; i++) {
      if(user_socket.id == gameState.players[i].id) {
        gameState.players.splice(i,1);
        return;
      }
    }
  };

  return gameState;
})(io.sockets);
gameState.init();
gameState.mainLoop();
