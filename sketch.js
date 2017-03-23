// Keep track of our socket connection
var socket;

var worldState; // players, obstacles, map_size, loopDelta
var userGameState;
var started = false;
var screen_size;

function setup() {
  screen_size = [windowWidth - 50, 600];
  createCanvas(screen_size[0], screen_size[1]);
  background(255);
  // Start a socket connection to the server
  // Some day we would run this server somewhere else
  socket = io.connect('http://localhost:8080');
  // We make a named event called 'mouse' and write an
  // anonymous callback function
  socket.on('sync world state',
    // When we receive data
    function(data) {
      //console.log("Got world state" + data.players.length + " " + data.obstacles.length);
      worldState = data;

      for (var i = 0; i < worldState.players.length; i++) {
        if(socket.id == worldState.players[i].id) {
          userGameState = worldState.players[i];
          return;
        }
      }
    }
  );
}

function draw() {
  if (typeof worldState === 'undefined') return;
  if (typeof userGameState === 'undefined') return;
  noStroke();
  fill(255);
  rect(0,0,screen_size[0],screen_size[1]);
  for (var i = 0; i < worldState.obstacles.length; i++) {
    var obs_pos = world_to_local(userGameState.pos, worldState.obstacles[i].pos);
    fill(51);
    rect(obs_pos[0],obs_pos[1],worldState.obstacles[i].size[0],worldState.obstacles[i].size[1]);
  }
  for (var j = 0; j < worldState.players.length; j++) {
    if (userGameState.pos == worldState.players[j].pos) {
      continue;
    }
    var plr_pos = world_to_local(userGameState.pos, worldState.players[j].pos);
    fill(180);
    rect(plr_pos[0],plr_pos[1],worldState.players[j].size[0],players.obstacles[j].size[1]);
  }
  fill(255, 204, 0);
  rect(screen_size[0] / 2, userGameState.pos[1] - 200, userGameState.size[0], userGameState.size[1]);
}

function mousePressed() {
  // Send the mouse coordinates
  if (!started) {
    socket.emit('user starts',{});
    started = true;
  }else {
    socket.emit('user flaps',{});
  }

}

function world_to_local(p_pos, target_pos) {
  return [(target_pos[0] - p_pos[0] + (screen_size[0] / 2)),target_pos[1] - 200 ];
}
