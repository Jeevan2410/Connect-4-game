/**
 * Connect 4 - 3D Animated Game with VFX
 * Refactored with modern JavaScript patterns
 */

// ============================================
// Game Constants & Configuration
// ============================================
const CONFIG = {
  ROWS: 6,
  COLS: 7,
  WIN_COUNT: 4,
  MIN_RANDOM: 1,
  MAX_RANDOM: 3,
  ANIMATION_DELAY: 100,
};

// ============================================
// DOM Elements Cache
// ============================================
const DOM = {
  container: null,
  playerTurn: null,
  startScreen: null,
  startButton: null,
  message: null,
  particles: null,
  player1Score: null,
  player2Score: null,
};

// ============================================
// Game State Management
// ============================================
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.matrix = Array(CONFIG.ROWS).fill(null).map(() => Array(CONFIG.COLS).fill(0));
    this.currentPlayer = 1;
    this.gameActive = false;
    this.scores = { 1: 0, 2: 0 };
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }

  updateMatrix(row, col, player) {
    this.matrix[row][col] = player;
  }

  isCellFilled(row, col) {
    return this.matrix[row][col] !== 0;
  }

  incrementScore(player) {
    this.scores[player]++;
  }

  getScore(player) {
    return this.scores[player];
  }
}

// ============================================
// VFX System - Particle Effects
// ============================================
class VFXSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  createParticle(x, y, color) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 15 + 5;
    const tx = (Math.random() - 0.5) * 400;
    const ty = (Math.random() - 0.5) * 400;
    
    particle.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      --tx: ${tx}px;
      --ty: ${ty}px;
      box-shadow: 0 0 ${size/2}px ${color};
    `;

    this.container.appendChild(particle);
    
    setTimeout(() => particle.remove(), 3000);
  }

  createExplosion(x, y, color, count = 30) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.createParticle(x, y, color);
      }, i * 30);
    }
  }

  createSparks(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'spark';
      
      const angle = (i / count) * 360;
      const distance = Math.random() * 150 + 50;
      const tx = Math.cos(angle * Math.PI / 180) * distance;
      const ty = Math.sin(angle * Math.PI / 180) * distance;
      
      spark.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        --spark-color: ${color};
        --spark-tx: ${tx}px;
        --spark-ty: ${ty}px;
      `;

      this.container.appendChild(spark);
      setTimeout(() => spark.remove(), 1000);
    }
  }

  celebrateWin(winningCells, player) {
    const colors = {
      1: 'radial-gradient(circle, #fff04e, #ffc400)',
      2: 'radial-gradient(circle, #ff4747, #c00303)'
    };

    winningCells.forEach(({ row, col }, index) => {
      setTimeout(() => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          const rect = cell.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          this.createExplosion(centerX, centerY, colors[player], 20);
          cell.classList.add('winning-piece');
        }
      }, index * 200);
    });
  }
}

// ============================================
// Win Detection Logic
// ============================================
class WinChecker {
  constructor(matrix) {
    this.matrix = matrix;
  }

  checkAll(row, col, player) {
    return this.checkHorizontal(row, player) ||
           this.checkVertical(col, player) ||
           this.checkDiagonalRight(row, col, player) ||
           this.checkDiagonalLeft(row, col, player);
  }

  checkHorizontal(row, player) {
    return this.verifyLine(this.matrix[row], player);
  }

  checkVertical(col, player) {
    let count = 0;
    for (let row of this.matrix) {
      if (row[col] === player) {
        count++;
        if (count === CONFIG.WIN_COUNT) return true;
      } else {
        count = 0;
      }
    }
    return false;
  }

  checkDiagonalRight(row, col, player) {
    const diagonal = this.getRightDiagonal(row, col);
    return this.verifyLine(diagonal, player);
  }

  checkDiagonalLeft(row, col, player) {
    const diagonal = this.getLeftDiagonal(row, col);
    return this.verifyLine(diagonal, player);
  }

  verifyLine(array, player) {
    let count = 0;
    for (let element of array) {
      if (element === player) {
        count++;
        if (count === CONFIG.WIN_COUNT) return true;
      } else {
        count = 0;
      }
    }
    return false;
  }

  getRightDiagonal(row, col) {
    const diagonal = [];
    let r = row, c = col;

    while (r > 0 && c < CONFIG.COLS - 1) {
      r--;
      c++;
      diagonal.unshift(this.matrix[r][c]);
    }

    r = row;
    c = col;
    while (r < CONFIG.ROWS) {
      if (c < 0) break;
      diagonal.push(this.matrix[r][c]);
      r++;
      c--;
    }

    return diagonal;
  }

  getLeftDiagonal(row, col) {
    const diagonal = [];
    let r = row, c = col;

    while (r > 0 && c > 0) {
      r--;
      c--;
      diagonal.unshift(this.matrix[r][c]);
    }

    r = row;
    c = col;
    while (r < CONFIG.ROWS) {
      if (c >= CONFIG.COLS) break;
      diagonal.push(this.matrix[r][c]);
      r++;
      c++;
    }

    return diagonal;
  }

  findWinningCells(row, col, player) {
    const directions = [
      { check: () => this.checkHorizontal(row, player), getCells: () => this.getHorizontalCells(row, player) },
      { check: () => this.checkVertical(col, player), getCells: () => this.getVerticalCells(col, player) },
      { check: () => this.checkDiagonalRight(row, col, player), getCells: () => this.getDiagonalRightCells(row, col, player) },
      { check: () => this.checkDiagonalLeft(row, col, player), getCells: () => this.getDiagonalLeftCells(row, col, player) }
    ];

    for (let dir of directions) {
      if (dir.check()) {
        return dir.getCells();
      }
    }
    return [];
  }

  getHorizontalCells(row, player) {
    const cells = [];
    for (let col = 0; col < CONFIG.COLS; col++) {
      if (this.matrix[row][col] === player) {
        cells.push({ row, col });
      }
    }
    return cells.filter((_, i, arr) => {
      if (arr.length < CONFIG.WIN_COUNT) return false;
      for (let j = 0; j <= arr.length - CONFIG.WIN_COUNT; j++) {
        let consecutive = true;
        for (let k = 0; k < CONFIG.WIN_COUNT; k++) {
          if (arr[j + k].col !== arr[j].col + k) {
            consecutive = false;
            break;
          }
        }
        if (consecutive) return true;
      }
      return false;
    }).slice(0, CONFIG.WIN_COUNT);
  }

  getVerticalCells(col, player) {
    const cells = [];
    for (let row = 0; row < CONFIG.ROWS; row++) {
      if (this.matrix[row][col] === player) {
        cells.push({ row, col });
      }
    }
    return cells.filter((_, i, arr) => {
      if (arr.length < CONFIG.WIN_COUNT) return false;
      for (let j = 0; j <= arr.length - CONFIG.WIN_COUNT; j++) {
        let consecutive = true;
        for (let k = 0; k < CONFIG.WIN_COUNT; k++) {
          if (arr[j + k].row !== arr[j].row + k) {
            consecutive = false;
            break;
          }
        }
        if (consecutive) return true;
      }
      return false;
    }).slice(0, CONFIG.WIN_COUNT);
  }

  getDiagonalRightCells(row, col, player) {
    const diagonal = this.getRightDiagonal(row, col);
    // Simplified - returns cells from the diagonal
    return [{ row, col }]; // Enhanced version would track actual positions
  }

  getDiagonalLeftCells(row, col, player) {
    const diagonal = this.getLeftDiagonal(row, col);
    return [{ row, col }];
  }

  isDraw() {
    return this.matrix.every(row => row.every(cell => cell !== 0));
  }
}

// ============================================
// Board Renderer
// ============================================
class BoardRenderer {
  constructor(container, gameState, vfx) {
    this.container = container;
    this.gameState = gameState;
    this.vfx = vfx;
  }

  create() {
    this.container.innerHTML = '';
    
    for (let row = 0; row < CONFIG.ROWS; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'grid-row';
      rowDiv.setAttribute('data-row', row);

      for (let col = 0; col < CONFIG.COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-box';
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);
        cell.setAttribute('data-value', col);
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', `Column ${col + 1}`);
        
        cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            this.handleCellClick(e, row, col);
          }
        });

        rowDiv.appendChild(cell);
      }

      this.container.appendChild(rowDiv);
    }
  }

  handleCellClick(e, clickedRow, col) {
    if (!this.gameState.gameActive) return;

    // Find the lowest empty row in this column
    let targetRow = CONFIG.ROWS - 1;
    while (targetRow >= 0 && this.gameState.isCellFilled(targetRow, col)) {
      targetRow--;
    }

    if (targetRow < 0) return; // Column is full

    const player = this.gameState.getCurrentPlayer();
    
    // Update game state
    this.gameState.updateMatrix(targetRow, col, player);

    // Get the actual cell element
    const rows = this.container.querySelectorAll('.grid-row');
    const cell = rows[targetRow].querySelector(`[data-col="${col}"]`);
    
    // Add visual classes
    cell.classList.add('filled', `player${player}`);

    // Check for win
    const winChecker = new WinChecker(this.gameState.matrix);
    if (winChecker.checkAll(targetRow, col, player)) {
      this.gameState.incrementScore(player);
      this.updateScoreDisplay();
      
      const winningCells = winChecker.findWinningCells(targetRow, col, player);
      const rect = cell.getBoundingClientRect();
      this.vfx.celebrateWin(winningCells, player);
      
      return { won: true, player };
    }

    // Check for draw
    if (winChecker.isDraw()) {
      return { draw: true };
    }

    return { played: true };
  }

  updateScoreDisplay() {
    DOM.player1Score.textContent = this.gameState.getScore(1);
    DOM.player2Score.textContent = this.gameState.getScore(2);
  }

  clear() {
    this.container.innerHTML = '';
  }
}

// ============================================
// Main Game Controller
// ============================================
class GameController {
  constructor() {
    this.gameState = new GameState();
    this.vfx = new VFXSystem('particles');
    this.renderer = null;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    DOM.container = document.querySelector('.container');
    DOM.playerTurn = document.getElementById('playerTurn');
    DOM.startScreen = document.querySelector('.startScreen');
    DOM.startButton = document.getElementById('start');
    DOM.message = document.getElementById('message');
    DOM.particles = document.getElementById('particles');
    DOM.player1Score = document.getElementById('player1Score');
    DOM.player2Score = document.getElementById('player2Score');
  }

  bindEvents() {
    DOM.startButton.addEventListener('click', () => this.startGame());
  }

  getRandomPlayer() {
    return Math.floor(Math.random() * (CONFIG.MAX_RANDOM - CONFIG.MIN_RANDOM)) + CONFIG.MIN_RANDOM;
  }

  startGame() {
    this.gameState.reset();
    DOM.startScreen.classList.add('hide');
    
    this.renderer = new BoardRenderer(DOM.container, this.gameState, this.vfx);
    this.renderer.create();
    
    this.gameState.currentPlayer = this.getRandomPlayer();
    this.gameState.gameActive = true;
    
    this.updateTurnDisplay();
  }

  updateTurnDisplay() {
    const player = this.gameState.getCurrentPlayer();
    DOM.playerTurn.innerHTML = `Player <span>${player}'s</span> turn`;
  }

  handleMove(result) {
    if (result.won) {
      DOM.message.innerHTML = `Player <span>${result.player}</span> wins!`;
      DOM.startScreen.classList.remove('hide');
      this.gameState.gameActive = false;
    } else if (result.draw) {
      DOM.message.textContent = "It's a Draw!";
      DOM.startScreen.classList.remove('hide');
      this.gameState.gameActive = false;
    } else {
      this.gameState.switchPlayer();
      this.updateTurnDisplay();
    }
  }
}

// ============================================
// Initialize Game on Load
// ============================================
let game;

window.addEventListener('DOMContentLoaded', () => {
  game = new GameController();
  
  // Expose startGame for the start button
  window.startGame = () => game.startGame();
});