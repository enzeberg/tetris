function Game(squareSide, cx, blockHintCv) {
  this.squareSide = squareSide;
  this.numOfSquareRow = 10;
  this.cx = cx;
  this.blockHintCx = blockHintCv.getContext('2d');
  this.blockHintCx.translate(blockHintCv.width / 2, blockHintCv.height / 2);
  this.gap = 0.25 * this.squareSide;

  this.lineNum = 20;

  this.initialize();
  this.setup();
}

Game.prototype.initialize = function() {
  var startX = 4 * this.squareSide + 5 * this.gap;
  var startY = this.cx.canvas.height - 24 * (this.squareSide + this.gap);
  this.blockTopleft = new Vector(startX, startY);
  
  this.inputManager = new InputManager;
  this.storageManager = new StorageManager;
  this.uiManager = new UIManager;

  this.storageManager.init();
  var bestScore = this.storageManager.getBestScore();
  this.uiManager.displayBest(bestScore);

  this.addEvents();
  window.focus();
};

Game.prototype.setup = function() {
  this.gameOver = false;
  this.paused = false;

  this.lines = [];
  for (let i = 0; i < this.lineNum; i++) {
    this.lines.push([]);
  }
  
  if (this.interval) {
    clearInterval(this.interval);
  }
  this.score = 0;
  this.uiManager.displayScore(this.score);

  this.fallingInterval = 1000; 

  this.decideNextBlock();
  this.prepareBlock();
  this.uiManager.showLandingInterval(this.fallingInterval);
  this.giveBlockHint();
};

Game.prototype.addEvents = function() {
  this.inputManager.on('move', this.moveBlock.bind(this));
  this.inputManager.on('drop', this.drop.bind(this));
  this.inputManager.on('deform', this.deformBlock.bind(this));
  this.inputManager.on('pause', this.pause.bind(this));
  this.inputManager.on('continue', this.continue.bind(this));
  this.inputManager.on('replay', this.replay.bind(this));
};

Game.prototype.pause = function() {
  if (this.gameOver) return;
  if (this.interval) clearInterval(this.interval);
  this.paused = true;
  
  this.uiManager.changeInnerText('.pause-or-resume-btn', 'Resume');
};

Game.prototype.continue = function() {
  if (this.gameOver) return;
  this.paused = false;
  this.fall();

  this.uiManager.changeInnerText('.pause-or-resume-btn', 'Pause');
};

Game.prototype.replay = function() {
  this.uiManager.removeDialog();
  this.uiManager.clearContext(this.cx);
  this.setup();
};

Game.prototype.prepareBlock = function() {
  this.fallingBlock = 
    new Block(this.blockTopleft.copy(),
              this.nextBlockType, this.squareSide, this.gap, this.cx);
  if (this.loseCheck()) {
    this.afterLosing();
  } else {
    this.fall();
  }
};

Game.prototype.fall = function() {
  // var block = this.fallingBlock;
  var step = this.squareSide + this.gap;
  var velocity = new Vector(0, step);

  this.interval = setInterval(() => {
    this.fallOneStep();
    if (!this.canFall(velocity)) {
      this.whenCannotFall();
    }
    // if (this.canFall(velocity)) {
    //   block.move(velocity);
    //   if (!this.canFall(velocity)) {
    //     this.whenCannotFall();
    //   }
    // } else {
    //   this.whenCannotFall();
    // }
  }, this.fallingInterval);
};

Game.prototype.whenCannotFall = function() {
  var velocity = new Vector(0, this.squareSide + this.gap);
  setTimeout(() => {
    if (!this.canFall(velocity)) {
      this.fixOldAndBuildNew();
    }
  }, 400);
};

Game.prototype.fixOldAndBuildNew = function() {
  if (this.interval)
    clearInterval(this.interval);
  this.fallingBlock.squares.forEach((s) => {
    this.addSquareToLine(s);
  });
  this.checkLinesClearing();
  this.prepareBlock();
  this.giveBlockHint();
};

// Game.prototype.whenCannotFall = function() {
  
//   // 为了保证消除的迅速感，一旦方块无法降落便立刻检查。
//   if (this.checkLinesClearing()) {
//     this.updateFallingBlock();
//   } else { // 若没有消除，则再给玩家移动、变形的机会
//     setTimeout(() => {
//       // 时间到但仍然不能下降，便可以准备下一个方块了
//       if (!this.canFall(new Vector(0, this.squareSide + this.gap))) {
//         this.updateFallingBlock();
//       }
//     }, 800);
//   }
// };

Game.prototype.updateFallingBlock = function() {
  clearInterval(this.interval);
  this.prepareBlock();
  this.giveBlockHint();
};

Game.prototype.drop = function() {
  var block = this.fallingBlock;
  var step = this.squareSide + this.gap;

  let distance = 0;
  let velocity;
  // while (distance > 0) {
  //   let velocity = new Vector(0, distance);
  //   if (this.canFall(velocity)) {
  //     block.move(velocity);
  //     break;
  //   } else {
  //     distance -= step;
  //   }
  // }

  do {
    distance += step;
    velocity = new Vector(0, distance);
  } while (this.canFall(velocity));

  block.move(new Vector(0, distance - step));
  
  this.fixOldAndBuildNew();
};

Game.prototype.addSquareToLine = function(square) {
  let y = this.cx.canvas.height - this.squareSide - this.gap - 0.2;
  let counter = 0;
  while (y > -0.2) {
    if (square.topleft.y > y) {
      this.lines[counter].push(square);
      break;
    } else {
      y -= this.squareSide + this.gap;
      counter++;
    }
  }
};

Game.prototype.deformBlock = function() {
  if (this.gameOver || this.paused) return;
  var block = this.fallingBlock;
  var oldBlockWidth = block.width;
  var velocity;
  if (this.canDeform()) {
    block.deform(true); // deform to be next state
    if (this.blockHitsRightEdge(block)) {      
      velocity = new Vector(-(block.width - oldBlockWidth), 0);
      if (this.canMove(velocity)) { // avoid covering after moving left
        // move left to avoid going across the right edge
        block.move(velocity);
      } else {
        block.deform(false); // deform to be previous state
      }
    }
  }
};

Game.prototype.moveBlock = function(direction) {
  if (this.gameOver || this.paused) return;
  if (!direction) return;
  var block = this.fallingBlock;
  var step = this.squareSide + this.gap;
  var velocity;
  switch(direction) {
    case "left":
      velocity = new Vector(-step, 0);
      break;
    case "right":
      velocity = new Vector(step, 0);
      break;
    case "down":
      velocity = new Vector(0, step);
      break;
  }
  if (this.canMove(velocity)) {
    block.move(velocity);
  }
};

Game.prototype.fallOneStep = function () {
  var velocity = new Vector(0, this.squareSide + this.gap);
  if (this.canMove(velocity)) {
    this.fallingBlock.move(new Vector(0, this.squareSide + this.gap));
  }
};

Game.prototype.checkLinesClearing = function() {
  let numOfClearedLines = 0;
  const step = this.squareSide + this.gap;
  this.lines.forEach((line, lineIndex) => {
    if (line.length === 10) {
      line.forEach((square) => {
        square.disappear();
      });
      line.length = 0;
      numOfClearedLines++;
    } else {
      if (numOfClearedLines > 0) {
        const lineToReceive = lineIndex - numOfClearedLines;
        line.forEach((square) => {
          square.fall(step * numOfClearedLines);
          this.lines[lineToReceive].push(square);
        });
        line.length = 0;
      }
    }
  });

  if (numOfClearedLines > 0) {
    if (this.fallingInterval > 500) {
      this.fallingInterval -= 10;
      this.uiManager.showLandingInterval(this.fallingInterval);
    }
    scoreAddition = numOfClearedLines * numOfClearedLines * 10;
    this.uiManager.displayScoreAddition(scoreAddition);
    this.score += scoreAddition;
    this.uiManager.displayScore(this.score);
    this.checkForUpdatingBest();
  }

  return numOfClearedLines > 0;
};

Game.prototype.loseCheck = function() {
  return (this.lines[this.lineNum - 1]).length > 0;
};

Game.prototype.decideNextBlock = function() {
  var blockTypes = ["I", "J", "L", "O", "S", "Z", "T"];
  do {
    this.nextBlockType = blockTypes[Math.floor(Math.random() * 7)];
  } while (this.fallingBlock && this.nextBlockType === this.fallingBlock.shape);
};

Game.prototype.giveBlockHint = function() {
  this.decideNextBlock();
  if (this.hintBlock) {
    this.hintBlock.disappear();
  }
  var hintBlockTopleft = new Vector(100, 100); // just temporary
  this.hintBlock =
    new Block(hintBlockTopleft, this.nextBlockType,
              this.squareSide, this.gap, this.blockHintCx);
  this.hintBlock.setTopleft(-this.hintBlock.width / 2, -this.squareSide * 2);
  this.hintBlock.setSquareCoors();
  this.hintBlock.display();
};

Game.prototype.afterLosing = function() {
  this.gameOver = true;
  this.uiManager.lose();
};

Game.prototype.checkForUpdatingBest = function() {
  if (this.score > this.storageManager.getBestScore()) {
    this.storageManager.updateBestScore(this.score);
    this.uiManager.displayBest(this.score);
  }
};

Game.prototype.approximatelyEqual = function(num1, num2) {
  return Math.abs(num1 - num2) < 0.1;
};

Game.prototype.getTopStillY = function() {
  for (let i = this.lineNum - 1; i >= 0; i--) {
    if (this.lines[i].length > 0) {
      return this.lines[i][0].topleft.y;
    }
  }
  return this.cx.canvas.height;
};

// can the falling block fall by itself?
Game.prototype.canFall = function(velocity) {
  var tempBlock = this.fallingBlock.copy();
  tempBlock.invisiblyMove(velocity);
  return !(this.blockHitsSquare(tempBlock) || this.blockHitsBottom(tempBlock));
};

// can the player move the falling block?
Game.prototype.canMove = function(velocity) {
  var tempBlock = this.fallingBlock.copy();
  tempBlock.invisiblyMove(velocity);
  return !(this.blockHitsSquare(tempBlock)   ||
           this.blockHitsBottom(tempBlock)   ||
           this.blockHitsLeftEdge(tempBlock) ||
           this.blockHitsRightEdge(tempBlock));
};

// can the player deform the falling block?
Game.prototype.canDeform = function() {
  var tempBlock = this.fallingBlock.copy();
  tempBlock.invisiblyDeform();
  return !(this.blockHitsSquare(tempBlock) || this.blockHitsBottom(tempBlock));
};

Game.prototype.blockHitsSquare = function(block) {
  return this.lines.some((line) => {
    return line.some((stillSquare) => {
      return block.squares.some((square) => {
        // if (this.approximatelyEqual(square.topleft.x, stillSquare.topleft.x) &&
        //     this.approximatelyEqual(square.topleft.y, stillSquare.topleft.y)) {
        //   console.log('hitted');
        //   return true;
        // }
        if (square.topleft.x === stillSquare.topleft.x &&
            square.topleft.y === stillSquare.topleft.y) {
          // console.log('hitted');
          return true;
        }
        return false;
      });
    });
  });
};

Game.prototype.blockHitsBottom = function(block) {
  var bottomY = this.cx.canvas.height;
  return block.topleft.y + block.height > bottomY;
};

Game.prototype.blockHitsLeftEdge = function(block) {
  return block.topleft.x < this.gap;
};

Game.prototype.blockHitsRightEdge = function(block) {
  return block.topleft.x + block.width > this.cx.canvas.width;
};