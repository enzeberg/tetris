function StorageManager() {
  this.init();
}

StorageManager.prototype.init = function() {
  if (window.localStorage) {
    if (localStorage.getItem("best")  ===  null)
      localStorage.setItem("best", 0);
  }
}

StorageManager.prototype.updateBestScore = function(score) {
  localStorage.setItem('best', score);

}

StorageManager.prototype.getBestScore = function() {
  return parseInt(localStorage.getItem('best'));
}