function Square(topleft, side, color, cx) {
  this.topleft = new Vector(topleft.x, topleft.y);
  this.side = side;
  this.color = color;
  this.cx = cx;
  this.apex1 = new Vector(topleft.x, topleft.y);
  this.apex2 = new Vector(topleft.x + side, topleft.y);
  this.apex3 = new Vector(topleft.x + side, topleft.y + side);
  this.apex4 = new Vector(topleft.x, topleft.y + side);
  this.apexes = [];
  this.apexes.push(this.apex1, this.apex2, this.apex3, this.apex4);
}

Square.prototype.display = function() {
  var cx = this.cx;
  cx.strokeStyle = this.color;
  cx.lineWidth = 0.125 * this.side;
  cx.lineJoin = "miter";
  this.makeClosedPath(this.apex1, this.apex2, this.apex3, this.apex4);
  cx.stroke();
};

Square.prototype.disappear = function() {
  var cx = this.cx;
  cx.strokeStyle = cx.canvas.style.backgroundColor;
  cx.lineWidth = 0.125 * this.side + 1.5;
  this.makeClosedPath(cx, this.apex1, this.apex2, this.apex3, this.apex4);
  cx.stroke();
}

Square.prototype.fall = function(distance) {
  this.disappear();
  this.topleft.y += distance;
  this.moveApexes();
  this.display();
}

Square.prototype.moveApexes = function() {
  this.apex1.set(this.topleft.x, this.topleft.y);
  this.apex2.set(this.topleft.x + this.side, this.topleft.y);
  this.apex3.set(this.topleft.x + this.side, this.topleft.y + this.side);
  this.apex4.set(this.topleft.x, this.topleft.y + this.side);
};


Square.prototype.makeClosedPath = function() {
  var cx = this.cx;
  cx.beginPath();
  cx.moveTo(arguments[0].x, arguments[0].y);
  for (var i = 1; i < arguments.length; i++) {
    cx.lineTo(arguments[i].x, arguments[i].y);
  }
  cx.closePath();
}

Square.prototype.setTopleft = function(x, y) {
  this.topleft.set(x, y);
}
