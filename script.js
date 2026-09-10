/**
 * CONNECT 4 - ULTIMATE EDITION
 * Futuristic Sci-Fi Game with Advanced VFX
 */

// ============================================
// Game Configuration
// ============================================
const CONFIG = {
  ROWS: 6,
  COLS: 7,
  WIN_COUNT: 4,
};

// ============================================
// DOM Elements Cache
// ============================================
const DOM = {
  container: null,
  player1Score: null,
  player2Score: null,
  player1ScoreBox: null,
  player2ScoreBox: null,
  turnIndicator: null,
  currentPlayerNum: null,
  modalOverlay: null,
  modalTitle: null,
  modalSubtitle: null,
  modalIcon: null,
  startBtn: null,
  undoBtn: null,
  resetBtn: null,
  newGameBtn: null,
  historyList: null,
  particles: null,
  confetti: null,
  screenFlash: null,
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
    this.moveHistory = [];
    this.lastMove = null;
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

  getLowestEmptyRow(col) {
    for (let row = CONFIG.ROWS - 1; row >= 0; row--) {
      if (!this.isCellFilled(row, col)) {
        return row;
      }
    }
    return -1;
  }

  incrementScore(player) {
    this.scores[player]++;
  }

  getScore(player) {
    return this.scores[player];
  }

  addMove(col, player) {
    this.moveHistory.push({ col, player, timestamp: Date.now() });
    this.lastMove = { col, player };
  }

  undoLastMove() {
    if (this.moveHistory.length === 0 || !this.gameActive) return null;
    
    const lastMove = this.moveHistory.pop();
    if (!lastMove) return null;

    // Find the piece in that column
    for (let row = 0; row < CONFIG.ROWS; row++) {
      if (this.matrix[row][lastMove.col] === lastMove.player) {
        this.matrix[row][lastMove.col] = 0;
        this.lastMove = { col: lastMove.col, row, player: lastMove.player, undo: true };
        return { ...lastMove, row };
      }
    }
    return null;
  }

  getLastMove() {
    return this.moveHistory[this.moveHistory.length - 1];
  }
}

// ============================================
// VFX System - Particle Effects & Animations
// ============================================
class VFXSystem {
  constructor() {
    this.particlesContainer = document.getElementById('particles');
    this.confettiContainer = document.getElementById('confetti');
    this.screenFlash = document.getElementById('screenFlash');
  }

  createParticle(x, y, color) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 15 + 8;
    const tx = (Math.random() - 0.5) * 500;
    const ty = (Math.random() - 0.5) * 500;
    
    particle.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      --tx: ${tx}px;
      --ty: ${ty}px;
      box-shadow: 0 0 ${size}px ${color};
    `;

    this.particlesContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 2000);
  }

  createExplosion(x, y, color, count = 40) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.createParticle(x, y, color);
      }, i * 20);
    }
  }

  createSpark(x, y, color) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    
    const angle = Math.random() * 360;
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

    this.particlesContainer.appendChild(spark);
    setTimeout(() => spark.remove(), 1000);
  }

  createConfetti(color) {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      
      confetti.style.cssText = `
        left: ${Math.random() * 100}vw;
        background: ${color};
        animation-delay: ${Math.random() * 0.5}s;
      `;

      this.confettiContainer.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  }

  flashScreen() {
    this.screenFlash.classList.add('active');
    setTimeout(() => this.screenFlash.classList.remove('active'), 300);
  }

  celebrateWin(winningCells, player) {
    const colors = {
      1: 'radial-gradient(circle, #ffec8b, #ffd700)',
      2: 'radial-gradient(circle, #ff6347, #ff4500)'
    };

    winningCells.forEach(({ row, col }, index) => {
      setTimeout(() => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          const rect = cell.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          this.createExplosion(centerX, centerY, colors[player], 30);
          cell.classList.add('winning-piece');
          
          // Create sparks
          for (let i = 0; i < 10; i++) {
            setTimeout(() => this.createSpark(centerX, centerY, colors[player]), i * 50);
          }
        }
      }, index * 150);
    });

    // Confetti finale
    setTimeout(() => {
      this.createConfetti(colors[player]);
      this.flashScreen();
    }, 500);
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
    return this.checkHorizontal(row, col, player) ||
           this.checkVertical(row, col, player) ||
           this.checkDiagonalRight(row, col, player) ||
           this.checkDiagonalLeft(row, col, player);
  }

  checkHorizontal(row, col, player) {
    let count = 0;
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (this.matrix[row][c] === player) {
        count++;
        if (count >= CONFIG.WIN_COUNT) return true;
      } else {
        count = 0;
      }
    }
    return false;
  }

  checkVertical(row, col, player) {
    let count = 0;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (this.matrix[r][col] === player) {
        count++;
        if (count >= CONFIG.WIN_COUNT) return true;
      } else {
        count = 0;
      }
    }
    return false;
  }

  checkDiagonalRight(row, col, player) {
    let count = 0;
    let r = row - col;
    let c = 0;
    
    while (r < 0) {
      r++;
      c++;
    }
    
    while (r < CONFIG.ROWS && c < CONFIG.COLS) {
      if (this.matrix[r][c] === player) {
        count++;
        if (count >= CONFIG.WIN_COUNT) return true;
      } else {
        count = 0;
      }
      r++;
      c++;
    }
    return false;
  }

  checkDiagonalLeft(row, col, player) {
    let count = 0;
    let r = row + col;
    let c = col;
    
    while (r >= CONFIG.ROWS) {
      r--;
    }
    
    c = col - (row - r);
    
    while (r < CONFIG.ROWS && c >= 0) {
      if (this.matrix[r][c] === player) {
        count++;
        if (count >= CONFIG.WIN_COUNT) return true;
      } else {
        count = 0;
      }
      r++;
      c--;
    }
    return false;
  }

  findWinningCells(row, col, player) {
    const directions = [
      { name: 'horizontal', check: () => this.getHorizontalCells(row, player) },
      { name: 'vertical', check: () => this.getVerticalCells(col, player) },
      { name: 'diagonalRight', check: () => this.getDiagonalRightCells(row, col, player) },
      { name: 'diagonalLeft', check: () => this.getDiagonalLeftCells(row, col, player) }
    ];

    for (let dir of directions) {
      const cells = dir.check();
      if (cells.length >= CONFIG.WIN_COUNT) {
        return cells.slice(0, CONFIG.WIN_COUNT);
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
    
    // Find consecutive sequence
    for (let i = 0; i <= cells.length - CONFIG.WIN_COUNT; i++) {
      let consecutive = true;
      for (let j = 0; j < CONFIG.WIN_COUNT - 1; j++) {
        if (cells[i + j].col + 1 !== cells[i + j + 1].col) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) {
        return cells.slice(i, i + CONFIG.WIN_COUNT);
      }
    }
    return [];
  }

  getVerticalCells(col, player) {
    const cells = [];
    for (let row = 0; row < CONFIG.ROWS; row++) {
      if (this.matrix[row][col] === player) {
        cells.push({ row, col });
      }
    }
    
    for (let i = 0; i <= cells.length - CONFIG.WIN_COUNT; i++) {
      let consecutive = true;
      for (let j = 0; j < CONFIG.WIN_COUNT - 1; j++) {
        if (cells[i + j].row + 1 !== cells[i + j + 1].row) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) {
        return cells.slice(i, i + CONFIG.WIN_COUNT);
      }
    }
    return [];
  }

  getDiagonalRightCells(row, col, player) {
    const cells = [];
    let r = row - col;
    let c = 0;
    
    while (r < 0) {
      r++;
      c++;
    }
    
    while (r < CONFIG.ROWS && c < CONFIG.COLS) {
      if (this.matrix[r][c] === player) {
        cells.push({ row: r, col: c });
      }
      r++;
      c++;
    }
    
    for (let i = 0; i <= cells.length - CONFIG.WIN_COUNT; i++) {
      let consecutive = true;
      for (let j = 0; j < CONFIG.WIN_COUNT - 1; j++) {
        if (cells[i + j].row + 1 !== cells[i + j + 1].row || 
            cells[i + j].col + 1 !== cells[i + j + 1].col) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) {
        return cells.slice(i, i + CONFIG.WIN_COUNT);
      }
    }
    return [];
  }

  getDiagonalLeftCells(row, col, player) {
    const cells = [];
    let startRow = Math.min(row + col, CONFIG.ROWS - 1);
    let startCol = col - (startRow - row);
    
    while (startCol < 0) {
      startRow--;
      startCol++;
    }
    
    let r = startRow;
    let c = startCol;
    
    while (r >= 0 && c < CONFIG.COLS) {
      if (this.matrix[r][c] === player) {
        cells.push({ row: r, col: c });
      }
      r--;
      c++;
    }
    
    cells.reverse();
    
    for (let i = 0; i <= cells.length - CONFIG.WIN_COUNT; i++) {
      let consecutive = true;
      for (let j = 0; j < CONFIG.WIN_COUNT - 1; j++) {
        if (cells[i + j].row + 1 !== cells[i + j + 1].row || 
            cells[i + j].col - 1 !== cells[i + j + 1].col) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) {
        return cells.slice(i, i + CONFIG.WIN_COUNT);
      }
    }
    return [];
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
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', `Column ${col + 1}`);
        
        cell.addEventListener('click', () => this.handleCellClick(col));
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleCellClick(col);
          }
        });

        rowDiv.appendChild(cell);
      }

      this.container.appendChild(rowDiv);
    }
  }

  handleCellClick(col) {
    if (!this.gameState.gameActive) return null;

    const targetRow = this.gameState.getLowestEmptyRow(col);
    if (targetRow < 0) return null; // Column is full

    const player = this.gameState.getCurrentPlayer();
    
    // Update game state
    this.gameState.updateMatrix(targetRow, col, player);
    this.gameState.addMove(col, player);

    // Get the actual cell element
    const rows = this.container.querySelectorAll('.grid-row');
    const cell = rows[targetRow].querySelector(`[data-col="${col}"]`);
    
    // Add visual classes
    cell.classList.add('filled', `player${player}`);

    // Update history UI
    this.updateHistoryUI(col, player);

    // Check for win
    const winChecker = new WinChecker(this.gameState.matrix);
    if (winChecker.checkAll(targetRow, col, player)) {
      this.gameState.incrementScore(player);
      this.updateScoreDisplay();
      
      const winningCells = winChecker.findWinningCells(targetRow, col, player);
      this.vfx.celebrateWin(winningCells, player);
      
      return { won: true, player, winningCells };
    }

    // Check for draw
    if (winChecker.isDraw()) {
      return { draw: true };
    }

    return { played: true, row: targetRow, col };
  }

  updateScoreDisplay() {
    DOM.player1Score.textContent = this.gameState.getScore(1);
    DOM.player2Score.textContent = this.gameState.getScore(2);
  }

  updateHistoryUI(col, player) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-token p${player}"></div>
      <span>Col ${col + 1}</span>
    `;
    DOM.historyList.appendChild(historyItem);
    DOM.historyList.scrollTop = DOM.historyList.scrollHeight;
  }

  clearHistory() {
    DOM.historyList.innerHTML = '';
  }

  removeLastHistoryItem() {
    if (DOM.historyList.lastChild) {
      DOM.historyList.removeChild(DOM.historyList.lastChild);
    }
  }

  clearBoard() {
    const cells = this.container.querySelectorAll('.grid-box');
    cells.forEach(cell => {
      cell.classList.remove('filled', 'player1', 'player2', 'winning-piece');
    });
  }
}

// ============================================
// Main Game Controller
// ============================================
class GameController {
  constructor() {
    this.gameState = new GameState();
    this.vfx = new VFXSystem();
    this.renderer = null;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    DOM.container = document.querySelector('.container');
    DOM.player1Score = document.getElementById('player1Score');
    DOM.player2Score = document.getElementById('player2Score');
    DOM.player1ScoreBox = document.getElementById('player1ScoreBox');
    DOM.player2ScoreBox = document.getElementById('player2ScoreBox');
    DOM.turnIndicator = document.getElementById('turnIndicator');
    DOM.currentPlayerNum = document.getElementById('currentPlayerNum');
    DOM.modalOverlay = document.getElementById('modalOverlay');
    DOM.modalTitle = document.getElementById('modalTitle');
    DOM.modalSubtitle = document.getElementById('modalSubtitle');
    DOM.modalIcon = document.getElementById('modalIcon');
    DOM.startBtn = document.getElementById('startBtn');
    DOM.undoBtn = document.getElementById('undoBtn');
    DOM.resetBtn = document.getElementById('resetBtn');
    DOM.newGameBtn = document.getElementById('newGameBtn');
    DOM.historyList = document.getElementById('historyList');
    DOM.particles = document.getElementById('particles');
    DOM.confetti = document.getElementById('confetti');
    DOM.screenFlash = document.getElementById('screenFlash');
  }

  bindEvents() {
    DOM.startBtn.addEventListener('click', () => this.startGame());
    DOM.newGameBtn.addEventListener('click', () => this.confirmNewGame());
    DOM.undoBtn.addEventListener('click', () => this.undoMove());
    DOM.resetBtn.addEventListener('click', () => this.resetGame());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undoMove();
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this.resetGame();
      }
    });
  }

  getRandomPlayer() {
    return Math.random() < 0.5 ? 1 : 2;
  }

  startGame() {
    this.gameState.reset();
    DOM.modalOverlay.classList.add('hide');
    
    if (!this.renderer) {
      this.renderer = new BoardRenderer(DOM.container, this.gameState, this.vfx);
      this.renderer.create();
    } else {
      this.renderer.clearBoard();
      this.renderer.clearHistory();
    }
    
    this.gameState.currentPlayer = this.getRandomPlayer();
    this.gameState.gameActive = true;
    
    this.updateTurnDisplay();
  }

  confirmNewGame() {
    if (this.gameState.gameActive && this.gameState.moveHistory.length > 0) {
      DOM.modalTitle.textContent = 'NEW GAME?';
      DOM.modalSubtitle.textContent = 'Current progress will be lost';
      DOM.startBtn.textContent = 'START NEW GAME';
      DOM.startBtn.onclick = () => this.startGame();
      DOM.modalOverlay.classList.remove('hide');
    } else {
      this.startGame();
    }
  }

  resetGame() {
    this.gameState.reset();
    if (this.renderer) {
      this.renderer.clearBoard();
      this.renderer.clearHistory();
    }
    DOM.player1Score.textContent = '0';
    DOM.player2Score.textContent = '0';
    DOM.modalTitle.textContent = 'CONNECT FOUR';
    DOM.modalSubtitle.textContent = 'Ready to play?';
    DOM.startBtn.textContent = 'START GAME';
    DOM.startBtn.onclick = () => this.startGame();
    DOM.modalOverlay.classList.remove('hide');
  }

  undoMove() {
    if (!this.gameState.gameActive) return;
    
    const undoneMove = this.gameState.undoLastMove();
    if (!undoneMove) return;

    // Remove visual piece
    const rows = DOM.container.querySelectorAll('.grid-row');
    const cell = rows[undoneMove.row]?.querySelector(`[data-col="${undoneMove.col}"]`);
    if (cell) {
      cell.classList.remove('filled', 'player1', 'player2', 'winning-piece');
    }

    // Remove from history UI
    this.renderer.removeLastHistoryItem();

    // Switch back to the player who made the undone move
    this.gameState.currentPlayer = undoneMove.player;
    this.updateTurnDisplay();
  }

  updateTurnDisplay() {
    const player = this.gameState.getCurrentPlayer();
    DOM.currentPlayerNum.textContent = player;
    
    if (player === 1) {
      DOM.turnIndicator.classList.remove('p2-turn');
      DOM.player1ScoreBox.classList.add('active');
      DOM.player2ScoreBox.classList.remove('active');
    } else {
      DOM.turnIndicator.classList.add('p2-turn');
      DOM.player1ScoreBox.classList.remove('active');
      DOM.player2ScoreBox.classList.add('active');
    }
  }

  handleMove(result) {
    if (result.won) {
      DOM.modalTitle.textContent = `PLAYER ${result.player} WINS!`;
      DOM.modalSubtitle.textContent = '🎉 Congratulations! 🎉';
      DOM.modalIcon.style.background = result.player === 1 
        ? 'radial-gradient(circle, #ffd700, #ffec8b)' 
        : 'radial-gradient(circle, #ff4500, #ff6347)';
      DOM.startBtn.textContent = 'PLAY AGAIN';
      DOM.startBtn.onclick = () => this.startGame();
      DOM.modalOverlay.classList.remove('hide');
      this.gameState.gameActive = false;
    } else if (result.draw) {
      DOM.modalTitle.textContent = "IT'S A DRAW!";
      DOM.modalSubtitle.textContent = 'Great game! Try again?';
      DOM.modalIcon.style.background = 'radial-gradient(circle, #a0a0c0, #ffffff)';
      DOM.startBtn.textContent = 'PLAY AGAIN';
      DOM.startBtn.onclick = () => this.startGame();
      DOM.modalOverlay.classList.remove('hide');
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
  
  // Expose for debugging
  window.connect4Game = game;
});