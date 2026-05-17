const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'move') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(); osc.stop(now + 0.1);
    } else if (type === 'win') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(); osc.stop(now + 0.5);
    } else if (type === 'lose') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.8);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.start(); osc.stop(now + 0.8);
    }
}

const translations = {
    ru: {
        title: "Крестики-Нолики", lLang: "Язык", lMode: "Режим игры", lSize: "Размер поля", lSkin: "Скин",
        oAI: "Против Робота", oPVP: "Вдвоем", btnStart: "Играть", pX: "Игрок X", pO: "Игрок O",
        btnNext: "Далее", btnMenu: "В меню", turn: "Ход:", win: "Победил", draw: "Ничья!",
        btnReset: "Сбросить счет", lDiff: "Сложность ИИ", oEasy: "Легко", oMedium: "Средне", oHard: "Невозможно",
        mTitle: "Как играть",
        modes: "Режимы:",
        diffs: "Сложность:",
        descModes: [
            { b: "Против Робота", p: "ИИ старается блокировать ваши линии и выиграть." },
            { b: "Вдвоем", p: "Играйте с другом на одном экране по очереди." },
            { b: "Поле 5х5", p: "Для победы нужно собрать 4 знака в ряд." }
        ],
        descDiffs: [
            { b: "Легко", p: "Робот ходит случайно и часто ошибается." },
            { b: "Средне", p: "Робот блокирует ваши ходы и видит победу." },
            { b: "Невозможно", p: "Робот никогда не проигрывает (на поле 3х3)." }
        ]
    },
    en: {
        title: "Tic-Tac-Toe", lLang: "Language", lMode: "Game Mode", lSize: "Board Size", lSkin: "Skins",
        oAI: "Vs AI", oPVP: "2 Players", btnStart: "Play", pX: "Player X", pO: "Player O",
        btnNext: "Next", btnMenu: "Menu", turn: "Turn:", win: "Winner:", draw: "Draw!",
        btnReset: "Reset Scores", lDiff: "AI Difficulty", oEasy: "Easy", oMedium: "Medium", oHard: "Impossible",
        mTitle: "How to play",
        modes: "Game Modes:",
        diffs: "AI Difficulty:",
        descModes: [
            { b: "Vs AI", p: "Robot will try to block you and win." },
            { b: "2 Players", p: "Play with a friend on the same device." },
            { b: "5x5 Board", p: "Connect 4 in a row to win." }
        ],
        descDiffs: [
            { b: "Easy", p: "AI moves randomly and makes mistakes." },
            { b: "Medium", p: "AI blocks you and seeks victory." },
            { b: "Impossible", p: "AI will never lose (on 3x3 board)." }
        ]
    }
};

let currentLang = 'ru';
let board = [], currentPlayer = "X", isGameActive = false;
let scores = { X: 0, O: 0 }, timer = null, timeLeft = 10;
let boardSize = 3, winCondition = 3;

const skins = {
    classic: { X: "❌", O: "⭕" },
    elemental: { X: "🔥", O: "❄️" },
    animals: { X: "🐱", O: "🐶" }
};

function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    document.querySelectorAll('.ui-title-text').forEach(el => el.innerText = t.title);
    document.getElementById('ui-l-lang').innerText = t.lLang;
    document.getElementById('ui-l-mode').innerText = t.lMode;
    document.getElementById('ui-l-size').innerText = t.lSize;
    document.getElementById('ui-l-skin').innerText = t.lSkin;
    document.getElementById('ui-o-ai').innerText = t.oAI;
    document.getElementById('ui-o-pvp').innerText = t.oPVP;
    document.getElementById('startGame').innerText = t.btnStart;
    document.getElementById('ui-pX').innerText = t.pX;
    document.getElementById('ui-pO').innerText = t.pO;
    document.getElementById('nextLevel').innerText = t.btnNext;
    document.getElementById('backToMenu').innerText = t.btnMenu;
    document.getElementById('resetScores').innerText = t.btnReset;
    document.getElementById('ui-l-diff').innerText = t.lDiff;
    document.getElementById('ui-o-easy').innerText = t.oEasy;
    document.getElementById('ui-o-medium').innerText = t.oMedium;
    document.getElementById('ui-o-hard').innerText = t.oHard;
    document.getElementById('ui-m-title').innerText = t.mTitle;
    if (isGameActive) updateStatus();
}

function showHelp() {
    const body = document.getElementById('modalBody');
    const t = translations[currentLang];
    
    let html = `<p style="color:#ff9f43; font-weight:bold; margin-bottom:10px">${t.modes}</p>`;
    html += t.descModes.map(i => `<div class="desc-item"><b>${i.b}</b><p>${i.p}</p></div>`).join('');
    
    html += `<hr class="hr-mini">`;
    
    html += `<p style="color:#ff9f43; font-weight:bold; margin-bottom:10px">${t.diffs}</p>`;
    html += t.descDiffs.map(i => `<div class="desc-item"><b>${i.b}</b><p>${i.p}</p></div>`).join('');
    
    body.innerHTML = html;
    toggleModal(true);
}

function toggleModal(s) { document.getElementById('helpModal').classList.toggle('active', s); }

function toggleDifficultyVisibility() {
    const mode = document.getElementById('gameMode').value;
    document.getElementById('difficultyGroup').style.display = (mode === 'ai') ? 'flex' : 'none';
}

function goToGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    winCondition = (boardSize === 5) ? 4 : boardSize;
    document.getElementById('menuScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    startRound();
}

function goToMenu() {
    clearInterval(timer);
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('menuScreen').classList.add('active');
}

function startRound() {
    board = Array(boardSize * boardSize).fill("");
    currentPlayer = "X";
    isGameActive = true;
    document.getElementById('nextLevel').style.display = 'none';
    updateStatus();
    createBoard();
    resetTimer();
}

function createBoard() {
    const b = document.getElementById('board');
    b.innerHTML = '';
    b.style.setProperty('--size', boardSize);
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('button');
        cell.classList.add('cell');
        if (boardSize === 4) cell.style.fontSize = "1.8rem";
        if (boardSize === 5) cell.style.fontSize = "1.5rem";
        cell.onclick = () => handleMove(i);
        b.appendChild(cell);
    }
}

function handleMove(i) {
    const isAI = document.getElementById('gameMode').value === 'ai';
    if (!isGameActive || board[i] !== "" || (isAI && currentPlayer === "O")) return;
    playSound('move');
    makeMove(i);
    if (isGameActive && isAI && currentPlayer === "O") setTimeout(aiMove, 600);
}

function makeMove(i) {
    const s = skins[document.getElementById('skinSelect').value];
    board[i] = currentPlayer;
    const cells = document.getElementsByClassName('cell');
    cells[i].innerText = s[currentPlayer];
    cells[i].classList.add(currentPlayer.toLowerCase());
    cells[i].disabled = true;

    const winLine = checkWin(board, currentPlayer);
    if (winLine) {
        endGame(currentPlayer, winLine);
    } else if (board.every(c => c !== "")) {
        endGame("draw");
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateStatus();
        resetTimer();
    }
}

function aiMove() {
    const difficulty = document.getElementById('aiDifficulty').value;
    const avail = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    if (!avail.length || !isGameActive) return;

    let move;
    if (difficulty === 'easy') {
        move = avail[Math.floor(Math.random() * avail.length)];
    } else if (difficulty === 'medium') {
        move = findBestMoveSimple(avail) || avail[Math.floor(Math.random() * avail.length)];
    } else {
        if (boardSize === 3) move = minimax(board, "O").index;
        else move = findBestMoveSimple(avail) || avail[Math.floor(Math.random() * avail.length)];
    }
    makeMove(move);
}

function findBestMoveSimple(avail) {
    for (let i of avail) {
        board[i] = "O"; if (checkWin(board, "O")) { board[i] = ""; return i; } board[i] = "";
    }
    for (let i of avail) {
        board[i] = "X"; if (checkWin(board, "X")) { board[i] = ""; return i; } board[i] = "";
    }
    return null;
}

function minimax(newBoard, player) {
    const availSpots = newBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    if (checkWin(newBoard, "X")) return { score: -10 };
    if (checkWin(newBoard, "O")) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = { index: availSpots[i] };
        newBoard[availSpots[i]] = player;
        if (player === "O") move.score = minimax(newBoard, "X").score;
        else move.score = minimax(newBoard, "O").score;
        newBoard[availSpots[i]] = "";
        moves.push(move);
    }

    let bestMove;
    if (player === "O") {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) { bestScore = moves[i].score; bestMove = i; }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) { bestScore = moves[i].score; bestMove = i; }
        }
    }
    return moves[bestMove];
}

function checkWin(tempBoard, p) {
    const s = boardSize;
    for (let r = 0; r < s; r++) {
        for (let c = 0; c < s; c++) {
            const lines = [getLine(r, c, 0, 1), getLine(r, c, 1, 0), getLine(r, c, 1, 1), getLine(r, c, 1, -1)];
            for (let line of lines) { if (line && line.every(idx => tempBoard[idx] === p)) return line; }
        }
    }
    return null;
}

function getLine(r, c, dr, dc) {
    let line = [];
    for (let i = 0; i < winCondition; i++) {
        let nr = r + dr * i, nc = c + dc * i;
        if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) line.push(nr * boardSize + nc);
        else return null;
    }
    return line;
}

function endGame(res, winLine) {
    isGameActive = false; clearInterval(timer);
    const t = translations[currentLang];
    const s = skins[document.getElementById('skinSelect').value];
    if (res === "draw") { document.getElementById('status').innerText = t.draw; }
    else {
        document.getElementById('status').innerText = `${t.win} ${s[res]}`;
        scores[res]++; updateScoreUI(); highlightWin(winLine);
        if (res === 'X' || document.getElementById('gameMode').value === 'pvp') { playSound('win'); triggerConfetti(); }
        else { playSound('lose'); }
    }
    document.getElementById('nextLevel').style.display = 'block';
}

function updateScoreUI() {
    document.getElementById('scoreX').innerText = scores.X;
    document.getElementById('scoreO').innerText = scores.O;
}

function resetAllScores() {
    scores.X = 0; scores.O = 0; updateScoreUI();
    if ('vibrate' in navigator) navigator.vibrate(50);
}

function highlightWin(line) {
    const cells = document.getElementsByClassName('cell');
    line.forEach(idx => cells[idx].classList.add('winner'));
}

function triggerConfetti() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}

function resetTimer() {
    clearInterval(timer); timeLeft = 10;
    timer = setInterval(() => {
        timeLeft -= 0.1; document.getElementById('timerBar').style.width = (timeLeft * 10) + "%";
        if (timeLeft <= 0) {
            currentPlayer = currentPlayer === "X" ? "O" : "X";
            updateStatus(); resetTimer();
            if (document.getElementById('gameMode').value === 'ai' && currentPlayer === "O") aiMove();
        }
    }, 100);
}

function updateStatus() {
    const s = skins[document.getElementById('skinSelect').value];
    document.getElementById('status').innerText = `${translations[currentLang].turn} ${s[currentPlayer]}`;
}

// Запуск инициализации после полной загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    setLanguage('ru');
});