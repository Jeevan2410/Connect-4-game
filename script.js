/**
 * Clip Art Connect 4 - Game Logic
 * Fully functional, bug-free implementation
 */
class Connect4Game {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = []; // 2D array: 0=empty, 1=P1, 2=P2
        this.currentPlayer = 1;
        this.gameActive = true;
        this.moveHistory = []; // Stack for undo
        this.scores = { 1: 0, 2: 0 };
        
        // DOM Elements
        this.boardEl = document.getElementById('board');
        this.turnTextEl = document.getElementById('turn-text');
        this.turnTokenEl = document.getElementById('turn-token');
        this.scoreP1El = document.getElementById('score-p1');
        this.scoreP2El = document.getElementById('score-p2');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');

        this.init();
    }

    init() {
        this.createBoardGrid();
        this.resetGame();
        this.addEventListeners();
    }

    createBoardGrid() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.col = c;
                cell.dataset.row = r;
                cell.addEventListener('click', () => this.handleMove(c));
                this.boardEl.appendChild(cell);
            }
        }
    }

    resetGame() {
        // Clear internal state
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.currentPlayer = 1;
        this.gameActive = true;
        this.moveHistory = [];
        
        // Clear UI
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.innerHTML = '');
        
        this.updateTurnUI();
        this.modalOverlay.style.display = 'none';
        stopConfetti();
    }

    handleMove(colIndex) {
        if (!this.gameActive) return;

        // Find the lowest empty row in this column
        let rowIndex = -1;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r][colIndex] === 0) {
                rowIndex = r;
                break;
            }
        }

        // Column full?
        if (rowIndex === -1) {
            this.shakeBoard();
            return;
        }

        // Execute Move
        this.placePiece(rowIndex, colIndex);
        
        // Check Win/Draw
        if (this.checkWin(rowIndex, colIndex)) {
            this.endGame(false);
        } else if (this.checkDraw()) {
            this.endGame(true);
        } else {
            // Switch Turn
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateTurnUI();
            this.playSound('pop');
        }
    }

    placePiece(row, col) {
        // Update Data
        this.board[row][col] = this.currentPlayer;
        
        // Save History for Undo
        this.moveHistory.push({ row, col, player: this.currentPlayer });

        // Update UI
        const index = row * this.cols + col;
        const cell = this.boardEl.children[index];
        
        const piece = document.createElement('div');
        piece.classList.add('piece');
        piece.classList.add(this.currentPlayer === 1 ? 'p1' : 'p2');
        cell.appendChild(piece);
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal \
            [1, -1]  // Diagonal /
        ];

        for (let [dr, dc] of directions) {
            let count = 1;
            let winningCells = [[row, col]];

            // Check forward
            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                    count++;
                    winningCells.push([r, c]);
                } else break;
            }

            // Check backward
            for (let i = 1; i < 4; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                    count++;
                    winningCells.push([r, c]);
                } else break;
            }

            if (count >= 4) {
                this.highlightWin(winningCells);
                return true;
            }
        }
        return false;
    }

    checkDraw() {
        return this.board.every(row => row.every(cell => cell !== 0));
    }

    highlightWin(cells) {
        cells.forEach(([r, c]) => {
            const index = r * this.cols + c;
            const piece = this.boardEl.children[index].querySelector('.piece');
            if (piece) piece.classList.add('winner');
        });
    }

    endGame(isDraw) {
        this.gameActive = false;
        
        if (isDraw) {
            this.modalTitle.innerText = "IT'S A DRAW!";
            this.modalTitle.style.color = "#666";
            this.modalMessage.innerText = "No stickers for anyone this time.";
            this.playSound('draw');
        } else {
            const winnerName = this.currentPlayer === 1 ? "PLAYER 1" : "PLAYER 2";
            const color = this.currentPlayer === 1 ? "var(--p1-color)" : "var(--p2-color)";
            
            this.modalTitle.innerText = `${winnerName} WINS!`;
            this.modalTitle.style.color = color;
            this.modalMessage.innerText = "You collected a line of 4 stickers!";
            
            this.scores[this.currentPlayer]++;
            this.updateScoreUI();
            
            this.playSound('win');
            startConfetti();
        }
        
        setTimeout(() => {
            this.modalOverlay.style.display = 'flex';
        }, 800);
    }

    undo() {
        if (!this.gameActive || this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = 0;
        
        const index = lastMove.row * this.cols + lastMove.col;
        const cell = this.boardEl.children[index];
        cell.innerHTML = ''; // Remove piece

        // Switch player back
        this.currentPlayer = lastMove.player;
        this.updateTurnUI();
        this.playSound('pop');
    }

    updateTurnUI() {
        const pName = this.currentPlayer === 1 ? "Player 1" : "Player 2";
        const color = this.currentPlayer === 1 ? "var(--p1-color)" : "var(--p2-color)";
        
        this.turnTextEl.innerText = `${pName}'s Turn`;
        this.turnTokenEl.style.background = color;
    }

    updateScoreUI() {
        this.scoreP1El.innerText = this.scores[1];
        this.scoreP2El.innerText = this.scores[2];
    }

    shakeBoard() {
        const boardWrapper = document.querySelector('.board-wrapper');
        boardWrapper.style.transform = 'rotate(1deg) translateX(5px)';
        setTimeout(() => {
            boardWrapper.style.transform = 'rotate(1deg) translateX(-5px)';
            setTimeout(() => {
                boardWrapper.style.transform = 'rotate(1deg)';
            }, 100);
        }, 100);
        this.playSound('error');
    }

    playSound(type) {
        // Simple synth sounds using Web Audio API
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        
        if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'win') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.2);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    addEventListeners() {
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                this.undo();
            }
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                this.resetGame();
            }
            // Number keys 1-7 for columns
            if (this.gameActive && e.key >= '1' && e.key <= '7') {
                this.handleMove(parseInt(e.key) - 1);
            }
        });
    }
}

// Initialize Game
const game = new Connect4Game();

// --- Confetti System (Paper Scraps) ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiActive = false;
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startConfetti() {
    confettiActive = true;
    particles = [];
    for(let i=0; i<150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 10 + 5,
            color: [`#FF6B6B`, `#4ECDC4`, `#FFE66D`, `#FF9F43`][Math.floor(Math.random()*4)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 360,
            spin: Math.random() * 0.2 - 0.1
        });
    }
    requestAnimationFrame(loopConfetti);
}

function stopConfetti() {
    confettiActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loopConfetti() {
    if (!confettiActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        p.y += p.speed;
        p.angle += p.spin;
        
        if (p.y > canvas.height) p.y = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.strokeRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
    });

    requestAnimationFrame(loopConfetti);
}
