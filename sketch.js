let video;
let poseNet;
let poses = [];
let referencePos = [];

// Game settings
const GRAVITY = 9;
const JUMP_HEIGHT = 3;
const GROUND_HEIGHT = 20;
const PIPEGAP = 250;

const WIDTH = 400;
const HEIGHT = 600;

var SCROLL_SPEED = 1.5;
var SCORE = 0;
let playerName;

let birdImg;
let gameStart = false; // Tracks if the game has started
let leaderboardVisible = true; // Start with the leaderboard visible


function preload() {
  birdImg = loadImage('Remy.PNG');
}

function setupLeaderboardUI() {
  // Create a container for the leaderboard
  leaderboardElement = createElement('div');
  leaderboardElement.position(20, HEIGHT + 80); // Adjust as needed
  leaderboardElement.hide(); // Initially hidden

  // Optional: Add some styles
  leaderboardElement.style('background-color', '#fff');
  leaderboardElement.style('padding', '10px');
  leaderboardElement.style('text-align', 'left');
  leaderboardElement.style('border-radius', '8px');
  leaderboardElement.style('max-width', '200px');
}

function setupGameUI() {
  showLeaderboard(); // Assuming this function correctly handles showing the leaderboard

  let newGameButton = createButton('New Game');
  // Center the button on the screen
  newGameButton.position((WIDTH / 2) - (newGameButton.width / 2), (HEIGHT / 2) - 60);
  newGameButton.mousePressed(() => {
    leaderboardVisible = false;
    newGameButton.hide();
    showNameEntry(); // Show name entry fields
    gameStart = false;
  });

  // Apply styles to "New Game" button for aesthetics
  newGameButton.style('background-color', '#FFC107');
  newGameButton.style('color', 'white');
  newGameButton.style('font-size', '18px');
  newGameButton.style('padding', '10px 24px');
  newGameButton.style('border', 'none');
  newGameButton.style('border-radius', '5px');
  newGameButton.style('cursor', 'pointer');
}

function showNameEntry() {
  let nameInput = createInput('');
  // Dynamically center the input field
  nameInput.position((WIDTH / 2) - 100, (HEIGHT / 2) - 20);

  // Style for name input
  nameInput.style('width', '200px');
  nameInput.style('padding', '5px');
  nameInput.style('font-size', '16px');
  nameInput.style('text-align', 'center');
  nameInput.style('background-color', 'rgba(255, 255, 255, 0.5)');
  nameInput.style('border', '2px solid #ffffff');
  nameInput.style('border-radius', '15px');
  nameInput.style('outline', 'none');
  nameInput.style('color', '#ffffff');
  nameInput.attribute('placeholder', 'Enter your name');
  nameInput.style('box-shadow', 'none');

  let startButton = createButton('Start Game');
  // Dynamically center the "Start Game" button below the input field
  startButton.position((WIDTH / 2) - (startButton.width / 2), HEIGHT / 2 + 20);

  // Apply styles to "Start Game" button
  startButton.style('background-color', '#4CAF50');
  startButton.style('color', 'white');
  startButton.style('font-size', '18px');
  startButton.style('padding', '10px 20px');
  startButton.style('border', 'none');
  startButton.style('border-radius', '5px');
  startButton.style('cursor', 'pointer');

  startButton.mousePressed(() => {
    playerName = nameInput.value();
    gameStart = true;
    nameInput.remove();
    startButton.remove();
  });
}


  
function setup() {
  // Create canvas
  createCanvas(WIDTH, HEIGHT);
  setupGameUI();
  video = createCapture(VIDEO);
  video.size(width, height);

  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on('pose', function(results) {
    poses = results;
  });
  video.hide();
  gameStart = false; // This variable controls the game's start state
  setupLeaderboardUI();
}


function modelReady() {
  console.log('Model Loaded');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


function toggleLeaderboardVisibility() {
  leaderboardVisible = !leaderboardVisible;
}

function drawLeaderboard() {
  // Assuming your leaderboard data is in a variable called `leaderboard`
  // Start drawing the leaderboard
  fill(0); // Set text color
  textSize(16);
  text("Leaderboard", 50, 40); // Title

  // Loop through the leaderboard array and draw each entry
  for (let i = 0; i < leaderboard.length; i++) {
    let y = 60 + i * 20; // Calculate the y position for each entry
    text(`${i + 1}. ${leaderboard[i].name}: ${leaderboard[i].score}`, 50, y);
  }
}

function showLeaderboard() {
  // Mock function to fetch leaderboard data - replace with actual logic
  leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardVisible = true; // Ensure the leaderboard is meant to be visible
}


class Bird {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size * 3;
    this.vely = 0;
  }

  draw() {
    image(birdImg, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }

  update() {
    this.y += this.vely;
    this.vely = lerp(this.vely, GRAVITY, 0.05);
    if (this.y >= HEIGHT - GROUND_HEIGHT - this.size / 2) {
      updateLeaderboard(SCORE, playerName);
      window.location.reload();
    } else {
      this.y = Math.max(this.size / 2, this.y);
    }
  }

  flap() {
    this.vely = -JUMP_HEIGHT;
  }

  checkDeath(pipes) {
    for (var pipe of pipes.pipes_list) {
      if (this.x + this.size / 2 > pipe.x && this.x - this.size / 2 < pipe.x + pipes.width) {
        if (this.y - this.size / 2 <= pipe.height || this.y + this.size / 2 >= pipe.height + pipes.gap) {
          updateLeaderboard(SCORE, playerName);
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
    stroke(0); // Optional: adds a stroke to make the wiggly edges more defined
    for (var pipe of this.pipes_list) {
      let upperPipeEnd = pipe.height;
      let lowerPipeStart = pipe.height + this.gap;
      let wigglyness = 10; // Adjust for more or less wiggle
      let frequency = 0.1; // Adjust for tighter or looser wiggles

      // Draw upper pipe
      beginShape();
      for (let y = 0; y <= upperPipeEnd; y += 5) {
        let xOscillation = sin(frequency * y) * wigglyness;
        vertex(pipe.x + xOscillation, y); // Left side
      }
      for (let y = upperPipeEnd; y >= 0; y -= 5) {
        let xOscillation = sin(frequency * y) * wigglyness + this.width;
        vertex(pipe.x + xOscillation, y); // Right side
      }
      endShape(CLOSE);

      // Draw lower pipe
      beginShape();
      for (let y = lowerPipeStart; y <= HEIGHT; y += 5) {
        let xOscillation = sin(frequency * y) * wigglyness;
        vertex(pipe.x + xOscillation, y); // Left side
      }
      for (let y = HEIGHT; y >= lowerPipeStart; y -= 5) {
        let xOscillation = sin(frequency * y) * wigglyness + this.width;
        vertex(pipe.x + xOscillation, y); // Right side
      }
      endShape(CLOSE);
    }
  }
}

var bird = new Bird(WIDTH / 2, HEIGHT / 2, 30);
var pipes = new Pipes(60, 150, PIPEGAP);

function draw() {
  if (gameStart) {
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
    }
    // drawLeaderboard(); 
  }else {
    background("#44AAAA");
    if (leaderboardVisible) drawLeaderboard(); // Draw leaderboard if it should be visible
  }
}


function keyPressed() {
  if (keyCode === 32) {
    bird.flap();
  } else if (keyCode === 76) { // 'L' key to toggle leaderboard visibility
    toggleLeaderboardVisibility();
  }
}
function mouseClicked() {
  bird.flap();
}

function updateLeaderboard(newScore, playerName) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ name: playerName, score: newScore });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

