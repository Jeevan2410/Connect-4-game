/**
 * Connect 4 - 3D Clip Art Edition
 * Fully functional with enhanced VFX and bug fixes
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
        this.columnNumbersEl = document.getElementById('column-numbers');
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
        this.createColumnNumbers();
        this.createBoardGrid();
        this.resetGame();
        this.addEventListeners();
    }

    createColumnNumbers() {
        this.columnNumbersEl.innerHTML = '';
        for (let c = 0; c < this.cols; c++) {
            const colNum = document.createElement('div');
            colNum.classList.add('col-num');
            colNum.textContent = c + 1;
            this.columnNumbersEl.appendChild(colNum);
        }
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
                cell.addEventListener('mouseenter', () => this.highlightColumn(c));
                cell.addEventListener('mouseleave', () => this.unhighlightColumn());
                this.boardEl.appendChild(cell);
            }
        }
    }

    highlightColumn(colIndex) {
        if (!this.gameActive) return;
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (parseInt(cell.dataset.col) === colIndex) {
                cell.classList.add('column-hover');
            }
        });
    }

    unhighlightColumn() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('column-hover');
        });
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
        stopParticles();
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
            this.createSparkEffect(colIndex);
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
        
        // Create drop particle effect
        this.createDropParticles(col);
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
            this.modalMessage.innerText = "No winner this time. Try again!";
            this.playSound('draw');
        } else {
            const winnerName = this.currentPlayer === 1 ? "PLAYER 1" : "PLAYER 2";
            const color = this.currentPlayer === 1 ? "#FFE66D" : "#FF9F43";
            
            this.modalTitle.innerText = `${winnerName} WINS!`;
            this.modalTitle.style.color = color;
            this.modalMessage.innerText = "Congratulations on your victory!";
            
            this.scores[this.currentPlayer]++;
            this.updateScoreUI();
            
            this.playSound('win');
            startCelebrationParticles();
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
        const gradient = this.currentPlayer === 1 
            ? "radial-gradient(circle at 30% 30%, #fff5cc, var(--p1-color))"
            : "radial-gradient(circle at 30% 30%, #ffe0cc, var(--p2-color))";
        
        this.turnTextEl.innerText = `${pName}'s Turn`;
        this.turnTokenEl.style.background = gradient;
    }

    updateScoreUI() {
        this.scoreP1El.innerText = this.scores[1];
        this.scoreP2El.innerText = this.scores[2];
    }

    shakeBoard() {
        const boardWrapper = document.querySelector('.board-wrapper');
        boardWrapper.style.transform = 'rotate(1deg) perspective(500px) translateX(10px)';
        setTimeout(() => {
            boardWrapper.style.transform = 'rotate(1deg) perspective(500px) translateX(-10px)';
            setTimeout(() => {
                boardWrapper.style.transform = 'rotate(1deg) perspective(500px)';
            }, 100);
        }, 100);
        this.playSound('error');
    }

    createSparkEffect(colIndex) {
        const cells = document.querySelectorAll('.cell');
        const bottomCell = Array.from(cells).find(cell => parseInt(cell.dataset.col) === colIndex && parseInt(cell.dataset.row) === 5);
        if (!bottomCell) return;

        const rect = bottomCell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.classList.add('spark');
            document.body.appendChild(spark);

            const angle = (i / 8) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            spark.style.left = centerX + 'px';
            spark.style.top = centerY + 'px';
            spark.style.setProperty('--tx', tx + 'px');
            spark.style.setProperty('--ty', ty + 'px');

            setTimeout(() => spark.remove(), 800);
        }
    }

    createDropParticles(colIndex) {
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        const particles = [];

        const cells = document.querySelectorAll('.cell');
        const targetCell = Array.from(cells).find(cell => parseInt(cell.dataset.col) === colIndex);
        if (!targetCell) return;

        const rect = targetCell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 20; i++) {
            particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: Math.random() * 6 + 2,
                color: this.currentPlayer === 1 ? '#FFE66D' : '#FF9F43',
                life: 1
            });
        }

        animateParticles(particles);
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
        } else if (type === 'draw') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }

    addEventListeners() {
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.undo();
            }
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
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

// --- Particle System ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function animateParticles(newParticles) {
    particles = [...particles, ...newParticles];
    if (!animationId) {
        loopParticles();
    }
}

function loopParticles() {
    if (particles.length === 0) {
        animationId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.life -= 0.02;
        
        if (p.life <= 0) return false;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        return true;
    });

    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(loopParticles);
}

function startCelebrationParticles() {
    particles = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#ffffff'];
    
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 5 + 2,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }
    
    if (!animationId) {
        loopCelebration();
    }
}

function loopCelebration() {
    if (particles.length === 0) {
        animationId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = particles.filter(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotationSpeed;
        p.life -= 0.005;
        
        if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
        }
        
        if (p.life <= 0) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
        
        return true;
    });

    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(loopCelebration);
}

function stopParticles() {
    particles = [];
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
