let video;
let poseNet;
let poses = [];
let referencePos = [];

// game setting
const GRAVITY = 9;
const JUMP_HEIGHT = 3;
const GROUND_HEIGHT = 20; 
const PIPEGAP = 300;

const WIDTH = 1750;
const HEIGHT = 870;

var SCROLL_SPEED = 1.5;
var SCORE = 0;


function setup() {
  createCanvas(WIDTH, HEIGHT);
  video = createCapture(VIDEO);
  video.size(width, height);

  poseNet = ml5.poseNet(video, modelReady);

  poseNet.on('pose', function (results) {
    poses = results;
  });
  video.hide();
}

function modelReady() {
  // select('#status').html('Model Loaded');
}


// game
function getRndInteger(min, max) {
  // https://www.w3schools.com/js/js_random.asp
  return Math.floor(Math.random() * (max - min)) + min;
}

class Bird {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.vely = 0;
  }

  draw() {
    fill("#F2DAAA");
    circle(this.x, this.y, this.size);
  }

  update() {
    this.y += this.vely;
    this.vely = lerp(this.vely, GRAVITY, 0.05);
    this.y = Math.max(this.size / 2, Math.min(this.y, HEIGHT - GROUND_HEIGHT - this.size / 2));
  }

  flap() {
    this.vely = -JUMP_HEIGHT;
  }

  checkDeath(pipes) {
    for (var pipe of pipes.pipes_list) {
      if (this.x + this.size / 2 > pipe.x && pipe.height && this.x - this.size / 2 < pipe.x + pipes.width) {
        if (this.y - this.size / 2 <= pipe.height || this.y + this.size / 2 >= pipe.height + pipes.gap) {
          window.location.reload();
        }
      }
      if (this.x - this.size / 2 > pipe.x + pipes.width && pipe.scored == false) {
        SCORE += 1;
        pipe.scored = true;
      }
    }
  }
}


class Pipes {
  constructor(width, frequency, gap) {
    this.width = width;
    this.frequency = frequency;
    this.gap = gap;

    this.pipes_list = [
      { x: 500, height: getRndInteger(this.gap, HEIGHT - GROUND_HEIGHT - this.gap), scored: false },
      { x: 500 + this.width + this.frequency, height: getRndInteger(this.gap, HEIGHT - GROUND_HEIGHT - this.gap), scored: false }
    ];
  }

  update() {   
    for (var pipe of this.pipes_list) {
      pipe.x -= SCROLL_SPEED;
      if (pipe.x + this.width <= 0) {
        pipe.x = WIDTH;
        pipe.height = getRndInteger(this.gap, HEIGHT - GROUND_HEIGHT - this.gap - this.gap);
        pipe.scored = false;
      }
    }
  }

  drawPipes() {
    fill("#7C3E28");
    for (var pipe of this.pipes_list) {
      rect(pipe.x, 0, this.width, pipe.height);
      rect(pipe.x, HEIGHT - GROUND_HEIGHT, this.width, -HEIGHT + pipe.height + GROUND_HEIGHT + this.gap);
    }
  }

}

var bird = new Bird(WIDTH / 2, HEIGHT / 2, 30);
var pipes = new Pipes(60, 150, PIPEGAP);


function draw() {
  background("#44AAAA");
  fill("#7C3E28");
  rect(0, HEIGHT - GROUND_HEIGHT, WIDTH, HEIGHT);

  bird.draw();
  bird.update();
  bird.checkDeath(pipes);

  pipes.update();
  pipes.drawPipes();

  fill(255);
  textSize(60);
  textAlign(CENTER);
  text(SCORE, WIDTH / 2, HEIGHT - HEIGHT / 7);
  
  strokeWeight(2);

  if (poses.length > 0) {
    let pose = poses[0].pose;
    // Create a pink ellipse for the nose
    fill(213, 0, 143);
    let nose = pose['nose'];
    ellipse(nose.x, nose.y, 20, 20);
    
    fill(255, 215, 0);
    let rightEye = pose['rightEye'];
    ellipse(rightEye.x, rightEye.y, 20, 20);

    fill(255, 215, 0);
    let leftEye = pose['leftEye'];
    ellipse(leftEye.x, leftEye.y, 20, 20);
    
    fill(255, 215, 0);
    let rightWrist = pose['rightWrist'];
    ellipse(rightWrist.x, rightWrist.y, 20, 20);

    fill(255, 215, 0);
    let leftWrist = pose['leftWrist'];
    ellipse(leftWrist.x, leftWrist.y, 20, 20);
    
    const currentTime = millis(); 
    const posY = pose['rightWrist'].y;

    referencePos.push({ y: posY, timestamp: currentTime });

    referencePos = referencePos.filter(position => currentTime - position.timestamp < 500);

    let sum = 0;
    referencePos.forEach(position => sum += position.y);
    const averageNoseY = sum / referencePos.length;

    if (posY < averageNoseY - 10) {
      bird.flap();
    }
  }
  
}

function keyPressed() {
  if (keyCode == 32) {
    bird.flap();
  }
}

function mouseClicked() {
  bird.flap();
}
