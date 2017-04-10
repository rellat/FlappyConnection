# FlappyConnection
FlappyBird like game with online sever

![Flappy Connection Playing](https://github.com/kifhan/FlappyConnection/raw/master/20170402.gif)

Flappy Connection is simple test project with Node.js + Socket.io + P5.js. With those, Flappy Connection make simple web game server for multiple players.

Game shares one world with everyone. When player connect and click, server automatically push a new player to the game world object.

## TODO

- Make and emit block unit of world data to each user for needs.
- (월드를 블럭 단위로 잘라서 유저별로 필요한 블럭만 보내기.)

- Game cut off the screen if the browser size is less then 600px. Make force scale.
- (기기 화면 세로 크기가 600px보다 작은 경우 게임이 짤려나온다. 강제로 스케일 조정하기.)

- Make test server and distribute.

- Make red screen when hit the obstacles. Make dead state and disconnect. 
