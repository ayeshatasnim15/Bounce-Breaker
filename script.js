/**
 * Bounce Breaker - HTML5 Canvas Game
 * 
 * A classic brick breaker game featuring:
 * - Advanced physics and collision detection
 * - Power-up system with multiple abilities
 * - Particle effects and visual polish
 * - Responsive design and modern UI
 * - High score system with localStorage
 * 
 * @author Your Name
 * @version 2.0.0
 * @license MIT
 */

// Game State Management
class GameState {
  constructor() {
    this.currentScreen = 'main-menu';
    this.isPaused = false;
    this.isGameOver = false;
    this.currentLevel = 1;
    this.score = 0;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.gameStartTime = 0;
    this.levelStartTime = 0;
    this.settings = {
      sound: true,
      music: true,
      particles: true,
      difficulty: 'normal'
    };
    
    // Performance tracking
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
  }
}

// Particle System for Visual Effects
class Particle {
  constructor(x, y, color, velocity, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = velocity;
    this.life = life;
    this.maxLife = life;
    this.size = Math.random() * 3 + 1;
    this.alpha = 1;
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.y += 0.1; // gravity
    this.life--;
    this.alpha = this.life / this.maxLife;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Power-up System
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.speed = 2;
    this.active = true;
    this.colors = {
      'multi-ball': '#ff6b6b',
      'paddle-size': '#4ecdc4',
      'speed-boost': '#45b7d1',
      'laser': '#ffa726',
      'life': '#66bb6a'
    };
  }

  update() {
    this.y += this.speed;
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.fillStyle = this.colors[this.type];
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw power-up icon
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const icons = {
      'multi-ball': '●',
      'paddle-size': '↔',
      'speed-boost': '⚡',
      'laser': '⚡',
      'life': '♥'
    };
    ctx.fillText(icons[this.type], this.x + this.width/2, this.y + this.height/2 + 4);
  }
}

// Enhanced Ball Class with Physics
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 8;
    this.speed = 5;
    this.dx = this.speed;
    this.dy = -this.speed;
    this.visible = true;
    this.spin = 0;
    this.maxSpeed = 8;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    
    // Apply spin effect with limits
    this.dx += this.spin * 0.01;
    this.spin *= 0.98; // decay spin
    
    // Limit maximum speed
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if (currentSpeed > this.maxSpeed) {
      const ratio = this.maxSpeed / currentSpeed;
      this.dx *= ratio;
      this.dy *= ratio;
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw spin effect
    if (Math.abs(this.spin) > 0.1) {
      ctx.strokeStyle = '#ffa726';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Enhanced Paddle Class
class Paddle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 15;
    this.speed = 8;
    this.dx = 0;
    this.visible = true;
    this.powerUp = null;
    this.powerUpTimer = 0;
    this.originalWidth = 100;
    this.originalSpeed = 8;
  }

  update() {
    this.x += this.dx;
    
    // Wall collision
    if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }
    if (this.x < 0) {
      this.x = 0;
    }
    
    // Update power-up timer
    if (this.powerUp && this.powerUpTimer > 0) {
      this.powerUpTimer--;
      if (this.powerUpTimer <= 0) {
        this.removePowerUp();
      }
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    
    // Draw paddle with gradient
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw power-up indicator
    if (this.powerUp && this.powerUpTimer > 0) {
      ctx.strokeStyle = '#ffa726';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
    }
  }

  applyPowerUp(type) {
    this.powerUp = type;
    this.powerUpTimer = 300; // 5 seconds at 60fps
    
    switch(type) {
      case 'paddle-size':
        this.width = 150;
        break;
      case 'speed-boost':
        this.speed = 12;
        break;
    }
  }

  removePowerUp() {
    this.powerUp = null;
    this.width = this.originalWidth;
    this.speed = this.originalSpeed;
  }
}

// Enhanced Brick Class
class Brick {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = 70;
    this.height = 20;
    this.type = type;
    this.visible = true;
    this.hits = this.getHitsRequired();
    this.maxHits = this.hits;
    this.moving = type === 'moving';
    this.moveDirection = 1;
    this.moveSpeed = 1;
  }

  getHitsRequired() {
    switch(this.type) {
      case 'normal': return 1;
      case 'strong': return 2;
      case 'indestructible': return Infinity;
      case 'explosive': return 1;
      case 'moving': return 1;
      default: return 1;
    }
  }

  getColor() {
    const alpha = this.hits / this.maxHits;
    switch(this.type) {
      case 'normal': return `rgba(78, 205, 196, ${alpha})`;
      case 'strong': return `rgba(255, 107, 107, ${alpha})`;
      case 'indestructible': return 'rgba(128, 128, 128, 0.8)';
      case 'explosive': return `rgba(255, 167, 38, ${alpha})`;
      case 'moving': return `rgba(102, 187, 106, ${alpha})`;
      default: return `rgba(78, 205, 196, ${alpha})`;
    }
  }

  update() {
    if (this.moving) {
      this.x += this.moveSpeed * this.moveDirection;
      if (this.x <= 0 || this.x + this.width >= canvas.width) {
        this.moveDirection *= -1;
      }
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    
    ctx.fillStyle = this.getColor();
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw brick pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw hit count for strong bricks
    if (this.type === 'strong' && this.hits > 1) {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.hits.toString(), this.x + this.width/2, this.y + this.height/2 + 4);
    }
  }

  hit() {
    if (this.type === 'indestructible') return false;
    
    this.hits--;
    if (this.hits <= 0) {
      this.visible = false;
      return true;
    }
    return false;
  }
}

// Level Generator with Difficulty Scaling
class LevelGenerator {
  static generateLevel(level, difficulty = 'normal') {
    const bricks = [];
    const rows = Math.min(5 + Math.floor(level / 3), 8);
    const cols = 9;
    
    // Adjust difficulty
    let strongBrickChance = 0.1;
    let explosiveBrickChance = 0.05;
    let movingBrickChance = 0.03;
    
    switch(difficulty) {
      case 'easy':
        strongBrickChance = 0.05;
        explosiveBrickChance = 0.02;
        movingBrickChance = 0.01;
        break;
      case 'hard':
        strongBrickChance = 0.15;
        explosiveBrickChance = 0.08;
        movingBrickChance = 0.05;
        break;
      case 'expert':
        strongBrickChance = 0.25;
        explosiveBrickChance = 0.12;
        movingBrickChance = 0.08;
        break;
    }
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * 80 + 45;
        const y = row * 30 + 60;
        
        // Determine brick type based on level and position
        let type = 'normal';
        const rand = Math.random();
        
        if (level >= 3 && rand < strongBrickChance) type = 'strong';
        if (level >= 5 && rand < explosiveBrickChance) type = 'explosive';
        if (level >= 10 && rand < movingBrickChance) type = 'moving';
        
        bricks.push(new Brick(x, y, type));
      }
    }
    
    return bricks;
  }
}

// Main Game Manager
class GameManager {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.state = new GameState();
    
    // Game objects
    this.balls = [new Ball(this.canvas.width / 2, this.canvas.height / 2)];
    this.paddle = new Paddle(this.canvas.width / 2 - 50, this.canvas.height - 30);
    this.bricks = [];
    this.powerUps = [];
    this.particles = [];
    
    // Performance optimization
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // Initialize
    this.init();
    this.setupEventListeners();
    this.loadHighScores();
    this.hideLoadingScreen();
  }

  hideLoadingScreen() {
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }
    }, 2000);
  }

  init() {
    this.bricks = LevelGenerator.generateLevel(this.state.currentLevel, this.state.settings.difficulty);
    this.updateUI();
  }

  setupEventListeners() {
    // Menu navigation
    document.getElementById('play-btn')?.addEventListener('click', () => this.showScreen('game-screen'));
    document.getElementById('settings-btn')?.addEventListener('click', () => this.showScreen('settings-menu'));
    document.getElementById('highscores-btn')?.addEventListener('click', () => this.showScreen('highscores-menu'));
    document.getElementById('back-to-menu')?.addEventListener('click', () => this.showScreen('main-menu'));
    document.getElementById('back-to-menu-2')?.addEventListener('click', () => this.showScreen('main-menu'));
    
    // Game controls
    document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('resume-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restartGame());
    document.getElementById('quit-btn')?.addEventListener('click', () => this.showScreen('main-menu'));
    document.getElementById('next-level-btn')?.addEventListener('click', () => this.nextLevel());
    document.getElementById('play-again-btn')?.addEventListener('click', () => this.restartGame());
    document.getElementById('menu-btn')?.addEventListener('click', () => this.showScreen('main-menu'));
    document.getElementById('save-score-btn')?.addEventListener('click', () => this.saveScore());
    
    // Settings
    document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
      this.state.settings.sound = e.target.checked;
    });
    document.getElementById('music-toggle')?.addEventListener('change', (e) => {
      this.state.settings.music = e.target.checked;
    });
    document.getElementById('particles-toggle')?.addEventListener('change', (e) => {
      this.state.settings.particles = e.target.checked;
    });
    document.getElementById('difficulty-select')?.addEventListener('change', (e) => {
      this.state.settings.difficulty = e.target.value;
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    // Maintain aspect ratio and responsiveness
    const container = this.canvas.parentElement;
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 120);
    
    this.canvas.style.width = maxWidth + 'px';
    this.canvas.style.height = maxHeight + 'px';
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.game-screen').forEach(screen => {
      screen.classList.add('hidden');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      this.state.currentScreen = screenId;
    }
    
    if (screenId === 'game-screen') {
      this.startGame();
    } else if (screenId === 'highscores-menu') {
      this.displayHighScores();
    }
  }

  startGame() {
    this.state.isGameOver = false;
    this.state.isPaused = false;
    this.state.gameStartTime = Date.now();
    this.state.levelStartTime = Date.now();
    this.gameLoop();
  }

  togglePause() {
    this.state.isPaused = !this.state.isPaused;
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
      pauseMenu.classList.toggle('hidden', !this.state.isPaused);
    }
    
    if (this.state.isPaused) {
      document.getElementById('pause-score').textContent = this.state.score;
      document.getElementById('pause-level').textContent = this.state.currentLevel;
    }
  }

  restartGame() {
    this.state.score = 0;
    this.state.lives = 3;
    this.state.currentLevel = 1;
    this.state.combo = 1;
    this.state.gameStartTime = Date.now();
    this.state.levelStartTime = Date.now();
    this.balls = [new Ball(this.canvas.width / 2, this.canvas.height / 2)];
    this.paddle = new Paddle(this.canvas.width / 2 - 50, this.canvas.height - 30);
    this.powerUps = [];
    this.particles = [];
    this.init();
    this.togglePause();
  }

  nextLevel() {
    this.state.currentLevel++;
    this.state.levelStartTime = Date.now();
    this.balls = [new Ball(this.canvas.width / 2, this.canvas.height / 2)];
    this.paddle = new Paddle(this.canvas.width / 2 - 50, this.canvas.height - 30);
    this.powerUps = [];
    this.particles = [];
    this.init();
    const levelComplete = document.getElementById('level-complete');
    if (levelComplete) {
      levelComplete.classList.add('hidden');
    }
  }

  handleKeyDown(e) {
    if (this.state.currentScreen !== 'game-screen' || this.state.isPaused) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'Left') {
      this.paddle.dx = -this.paddle.speed;
    } else if (e.key === 'ArrowRight' || e.key === 'Right') {
      this.paddle.dx = this.paddle.speed;
    } else if (e.key === ' ') {
      // Space to launch ball
      if (this.balls.length === 1 && this.balls[0].dy === 0) {
        this.balls[0].dy = -this.balls[0].speed;
      }
    }
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'ArrowRight' || e.key === 'Right') {
      this.paddle.dx = 0;
    }
  }

  update(currentTime) {
    if (this.state.isPaused) return;
    
    // Calculate delta time for smooth animations
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.state.frameCount++;
    if (currentTime - this.state.lastFpsUpdate >= 1000) {
      this.state.fps = this.state.frameCount;
      this.state.frameCount = 0;
      this.state.lastFpsUpdate = currentTime;
    }
    
    // Update game objects
    this.balls.forEach(ball => ball.update());
    this.paddle.update();
    this.bricks.forEach(brick => brick.update());
    this.powerUps.forEach(powerUp => powerUp.update());
    this.particles.forEach(particle => particle.update());
    
    // Remove dead particles
    this.particles = this.particles.filter(particle => particle.life > 0);
    
    // Remove off-screen power-ups
    this.powerUps = this.powerUps.filter(powerUp => powerUp.y < this.canvas.height && powerUp.active);
    
    // Check collisions
    this.checkCollisions();
    
    // Update combo timer
    if (this.state.comboTimer > 0) {
      this.state.comboTimer--;
      if (this.state.comboTimer <= 0) {
        this.state.combo = 1;
        this.updateUI();
      }
    }
    
    // Check win/lose conditions
    this.checkGameState();
  }

  checkCollisions() {
    this.balls.forEach(ball => {
      // Wall collisions
      if (ball.x + ball.size > this.canvas.width || ball.x - ball.size < 0) {
        ball.dx *= -1;
        ball.spin *= -0.5;
      }
      if (ball.y - ball.size < 0) {
        ball.dy *= -1;
      }
      
      // Paddle collision
      if (ball.x + ball.size > this.paddle.x && 
          ball.x - ball.size < this.paddle.x + this.paddle.width &&
          ball.y + ball.size > this.paddle.y &&
          ball.y - ball.size < this.paddle.y + this.paddle.height) {
        
        // Calculate bounce angle based on where ball hits paddle
        const hitPos = (ball.x - this.paddle.x) / this.paddle.width;
        const angle = (hitPos - 0.5) * Math.PI / 3; // -30 to 30 degrees
        
        ball.dx = Math.sin(angle) * ball.speed;
        ball.dy = -Math.cos(angle) * ball.speed;
        
        // Add spin based on paddle movement
        ball.spin += this.paddle.dx * 0.1;
      }
      
      // Brick collisions
      this.bricks.forEach(brick => {
        if (brick.visible && 
            ball.x + ball.size > brick.x &&
            ball.x - ball.size < brick.x + brick.width &&
            ball.y + ball.size > brick.y &&
            ball.y - ball.size < brick.y + brick.height) {
          
          ball.dy *= -1;
          
          if (brick.hit()) {
            this.handleBrickDestruction(brick);
          }
        }
      });
      
      // Power-up collisions
      this.powerUps.forEach(powerUp => {
        if (powerUp.active &&
            ball.x + ball.size > powerUp.x &&
            ball.x - ball.size < powerUp.x + powerUp.width &&
            ball.y + ball.size > powerUp.y &&
            ball.y - ball.size < powerUp.y + powerUp.height) {
          
          this.applyPowerUp(powerUp.type);
          powerUp.active = false;
        }
      });
    });
    
    // Paddle power-up collisions
    this.powerUps.forEach(powerUp => {
      if (powerUp.active &&
          this.paddle.x < powerUp.x + powerUp.width &&
          this.paddle.x + this.paddle.width > powerUp.x &&
          this.paddle.y < powerUp.y + powerUp.height &&
          this.paddle.y + this.paddle.height > powerUp.y) {
        
        this.applyPowerUp(powerUp.type);
        powerUp.active = false;
      }
    });
  }

  handleBrickDestruction(brick) {
    // Create explosion particles
    if (this.state.settings.particles) {
      for (let i = 0; i < 10; i++) {
        const particle = new Particle(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
          brick.getColor(),
          {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
          },
          30
        );
        this.particles.push(particle);
      }
    }
    
    // Handle explosive bricks
    if (brick.type === 'explosive') {
      this.bricks.forEach(otherBrick => {
        const distance = Math.sqrt(
          Math.pow(brick.x - otherBrick.x, 2) + 
          Math.pow(brick.y - otherBrick.y, 2)
        );
        if (distance < 100 && otherBrick.visible && otherBrick !== brick) {
          otherBrick.hit();
          this.handleBrickDestruction(otherBrick);
        }
      });
    }
    
    // Spawn power-up (10% chance)
    if (Math.random() < 0.1) {
      const powerUpTypes = ['multi-ball', 'paddle-size', 'speed-boost', 'laser', 'life'];
      const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      const powerUp = new PowerUp(brick.x + brick.width / 2, brick.y + brick.height, type);
      this.powerUps.push(powerUp);
    }
    
    // Update score and combo
    this.state.score += 10 * this.state.combo;
    this.state.combo++;
    this.state.comboTimer = 120; // 2 seconds
    
    this.updateUI();
  }

  applyPowerUp(type) {
    switch(type) {
      case 'multi-ball':
        const newBalls = [];
        this.balls.forEach(ball => {
          newBalls.push(new Ball(ball.x, ball.y));
          newBalls.push(new Ball(ball.x, ball.y));
        });
        this.balls = newBalls;
        break;
      case 'paddle-size':
        this.paddle.applyPowerUp('paddle-size');
        break;
      case 'speed-boost':
        this.paddle.applyPowerUp('speed-boost');
        break;
      case 'laser':
        // Implement laser functionality
        break;
      case 'life':
        this.state.lives++;
        break;
    }
    this.updateUI();
  }

  checkGameState() {
    // Check if ball is lost
    this.balls = this.balls.filter(ball => ball.y < this.canvas.height);
    
    if (this.balls.length === 0) {
      this.state.lives--;
      this.updateUI();
      
      if (this.state.lives <= 0) {
        this.gameOver();
      } else {
        // Reset ball
        this.balls = [new Ball(this.canvas.width / 2, this.canvas.height / 2)];
      }
    }
    
    // Check if level is complete
    const remainingBricks = this.bricks.filter(brick => brick.visible);
    if (remainingBricks.length === 0) {
      this.levelComplete();
    }
  }

  levelComplete() {
    this.state.isPaused = true;
    const levelTime = Math.floor((Date.now() - this.state.levelStartTime) / 1000);
    const timeBonus = Math.max(0, 60 - levelTime) * 10; // Bonus for quick completion
    
    document.getElementById('level-score').textContent = this.state.score;
    document.getElementById('level-combo').textContent = `x${this.state.combo}`;
    document.getElementById('level-time').textContent = this.formatTime(levelTime);
    document.getElementById('level-bonus').textContent = timeBonus;
    
    this.state.score += timeBonus;
    
    const levelComplete = document.getElementById('level-complete');
    if (levelComplete) {
      levelComplete.classList.remove('hidden');
    }
  }

  gameOver() {
    this.state.isGameOver = true;
    const totalTime = Math.floor((Date.now() - this.state.gameStartTime) / 1000);
    
    document.getElementById('final-score').textContent = this.state.score;
    document.getElementById('final-level').textContent = this.state.currentLevel;
    document.getElementById('final-time').textContent = this.formatTime(totalTime);
    
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
      gameOver.classList.remove('hidden');
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateUI() {
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const livesElement = document.getElementById('lives');
    const comboElement = document.getElementById('combo');
    const powerupElement = document.getElementById('powerup');
    
    if (scoreElement) scoreElement.textContent = this.state.score;
    if (levelElement) levelElement.textContent = this.state.currentLevel;
    if (livesElement) livesElement.textContent = this.state.lives;
    if (comboElement) comboElement.textContent = `x${this.state.combo}`;
    
    if (powerupElement) {
      if (this.paddle.powerUp && this.paddle.powerUpTimer > 0) {
        powerupElement.textContent = this.paddle.powerUp;
        powerupElement.classList.add('powerup-active');
      } else {
        powerupElement.textContent = 'None';
        powerupElement.classList.remove('powerup-active');
      }
    }
    
    if (this.state.combo > 1) {
      comboElement?.classList.add('combo-active');
    } else {
      comboElement?.classList.remove('combo-active');
    }
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background pattern
    this.drawBackground();
    
    // Draw game objects
    this.bricks.forEach(brick => brick.draw(this.ctx));
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
    this.particles.forEach(particle => particle.draw(this.ctx));
    this.balls.forEach(ball => ball.draw(this.ctx));
    this.paddle.draw(this.ctx);
  }

  drawBackground() {
    // Create subtle grid pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  gameLoop(currentTime = 0) {
    if (this.state.currentScreen === 'game-screen' && !this.state.isGameOver) {
      this.update(currentTime);
      this.draw();
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  // High Score System
  loadHighScores() {
    try {
      this.highScores = JSON.parse(localStorage.getItem('bounceBreakerHighScores') || '[]');
    } catch (error) {
      console.warn('Failed to load high scores:', error);
      this.highScores = [];
    }
  }

  saveScore() {
    try {
      const playerNameInput = document.getElementById('player-name');
      const playerName = playerNameInput ? playerNameInput.value.trim() : 'Anonymous';
      const finalName = playerName || 'Anonymous';
      
      const score = this.state.score;
      const level = this.state.currentLevel;
      const totalTime = Math.floor((Date.now() - this.state.gameStartTime) / 1000);
      
      const newScore = {
        name: finalName,
        score: score,
        level: level,
        time: totalTime,
        date: new Date().toLocaleDateString()
      };
      
      this.highScores.push(newScore);
      this.highScores.sort((a, b) => b.score - a.score);
      this.highScores = this.highScores.slice(0, 10); // Keep top 10
      
      localStorage.setItem('bounceBreakerHighScores', JSON.stringify(this.highScores));
      
      const saveBtn = document.getElementById('save-score-btn');
      if (saveBtn) {
        saveBtn.textContent = 'Score Saved!';
        saveBtn.disabled = true;
        setTimeout(() => {
          saveBtn.textContent = 'Save Score';
          saveBtn.disabled = false;
        }, 2000);
      }
      
      // Show success message
      this.showMessage('Score saved successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to save score:', error);
      this.showMessage('Failed to save score. Please try again.', 'error');
    }
  }

  showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#3fb950' : type === 'error' ? '#f85149' : '#58a6ff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
      messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 300);
    }, 3000);
  }

  displayHighScores() {
    const container = document.getElementById('highscores-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.highScores.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No high scores yet. Play the game to set a record!</div>';
      return;
    }
    
    this.highScores.forEach((score, index) => {
      const item = document.createElement('div');
      item.className = 'highscore-item';
      item.innerHTML = `
        <span>${index + 1}</span>
        <span>${score.name}</span>
        <span>${score.score}</span>
        <span>${score.level}</span>
      `;
      container.appendChild(item);
    });
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  try {
    new GameManager();
  } catch (error) {
    console.error('Failed to initialize game:', error);
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f85149;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      z-index: 10000;
    `;
    errorDiv.innerHTML = `
      <h3>Game Error</h3>
      <p>Failed to load the game. Please refresh the page.</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Refresh</button>
    `;
    document.body.appendChild(errorDiv);
  }
});