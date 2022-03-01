function UIManager() {
  this.ScoreAndBest = document.querySelector('.score-and-best');
  this.scoreEle = document.querySelector(".score");
  this.bestEle = document.querySelector(".best");
  this.intervalEle = document.querySelector('.interval-value');
  this.loseInterface = document.querySelector(".lose-container");
}

UIManager.prototype.displayScore = function(score) {
  this.scoreEle.innerText = score;
};

UIManager.prototype.displayScoreAddition = function(addition) {
  var additionEle = this.ScoreAndBest.querySelector('.score-addition');
  if (additionEle) {
    this.ScoreAndBest.removeChild(additionEle);
  }
  var additionEle = document.createElement('div');
  additionEle.setAttribute('class', 'score-addition');
  var color;
  switch(addition) {
    case 10:
      color = "rgb(160, 160, 160)"; break;
    case 40:
      color = "rgb(130, 130, 130)"; break;
    case 90:
      color = "rgb(80, 80, 80)"; break;
    case 160:
      color = "rgb(10, 10, 10)"; break;
  }
  additionEle.style.color = color;
  additionEle.innerText = "+" + addition;
  this.ScoreAndBest.appendChild(additionEle);
};

UIManager.prototype.displayBest = function(bestScore) {
  this.bestEle.innerText = "Best: " + bestScore;
};

UIManager.prototype.showLandingInterval = function(fallingInterval) {
  this.intervalEle.innerText = fallingInterval + 'ms';
};

UIManager.prototype.lose = function() {
  this.loseInterface.style.display = "block";
};

UIManager.prototype.changeInnerText = function(selector, text) {
  var element = document.querySelector(selector);
  element.innerText = text;
};

UIManager.prototype.clearContext = function(cx) {
  var cv = cx.canvas;
  cx.clearRect(0, 0, cv.width, cv.height);	
};

UIManager.prototype.removeDialog = function ()  {
  this.loseInterface.style.display = "none";
};