import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    // 배경음악 관리를 위한 로직
    const bgm = document.getElementById('bgm');
    bgm.volume = 0.4;

    const tryPlayBGM = () => {
        bgm.play().catch(error => {
            console.log("브라우저 자동 재생 정책에 의해 미리 재생할 수 없습니다. 클릭 시 자동으로 재생됩니다.");
        });
    };
    tryPlayBGM();

    // 만약 보안 정책 때문에 자동 재생이 막혔다면, 아무 곳이나 클릭할 때 즉시 재생되도록 폴백 추가
    document.body.addEventListener('click', () => {
        if (bgm.paused) {
            bgm.play().catch(e => { });
        }
    }, { once: true });

    // Audio Control Logic
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', (e) => {
        bgm.volume = parseFloat(e.target.value);
    });

    const game = new Game();

    const ui = document.getElementById('ui');
    const loading = document.getElementById('loading');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const hud = document.getElementById('hud');
    const scoreUI = document.getElementById('score');
    const finalScoreUI = document.getElementById('final-score');
    const livesUI = document.getElementById('lives');
    
    const startBestScoreUI = document.getElementById('start-best-score');
    const comboDisplay = document.getElementById('combo-display');
    const comboUI = document.getElementById('combo');

    const renderLeaderboard = () => {
        const lbStr = localStorage.getItem('cherryBlossomLeaderboard');
        const lb = lbStr ? JSON.parse(lbStr) : [];
        const lbList = document.getElementById('leaderboard-list');
        lbList.innerHTML = '';
        lb.forEach((entry, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>#${idx+1} ${entry.id}</span><span>${entry.score} 🌟</span>`;
            lbList.appendChild(li);
        });
        
        if(lb.length > 0 && startBestScoreUI) {
            startBestScoreUI.innerText = lb[0].score;
        }
    };
    renderLeaderboard();

    loading.classList.add('hidden');

    // Bind UI callbacks
    game.onScoreUpdate = (score) => {
        scoreUI.innerText = score;
    };

    game.onLivesUpdate = (lives) => {
        if(livesUI) livesUI.innerText = lives;
    };

    game.onComboUpdate = (combo) => {
        if (combo > 1) {
            comboDisplay.classList.remove('hidden');
            comboUI.innerText = combo;
            // Retrigger CSS animation
            comboDisplay.style.animation = 'none';
            comboDisplay.offsetHeight; /* trigger reflow */
            comboDisplay.style.animation = null; 
        } else {
            comboDisplay.classList.add('hidden');
        }
    };

    game.onGameOver = (score) => {
        document.exitPointerLock();
        hud.classList.add('hidden');
        ui.classList.remove('hidden');
        startScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        finalScoreUI.innerText = score;
        renderLeaderboard();
    };

    ui.addEventListener('click', (e) => {
        if (e.target.id === 'volume-slider') return; // Ignore clicks on the volume slider
        
        if (!gameOverScreen.classList.contains('hidden')) {
            gameOverScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            return;
        }

        const playerIdInput = document.getElementById('player-id');
        const playerId = playerIdInput.value.trim();
        if (!playerId) {
            alert("Please enter your ID to start!");
            playerIdInput.focus();
            return;
        }
        
        game.start(playerId);
        // Do not hide UI here, let pointerlockchange handle it on success
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            // Lock activated successfully
            ui.classList.add('hidden');
            hud.classList.remove('hidden');
        } else {
            // ESC key triggers Game Over now
            if (game.isRunning) {
                game.triggerGameOver();
            }
        }
    });

    document.addEventListener('pointerlockerror', () => {
        // Browser rejected pointer lock (usually because of rapid requests)
        game.isRunning = false;
        ui.classList.remove('hidden');
        hud.classList.add('hidden');
        // Do not switch screen completely, just inform the user
        console.warn("Pointer lock rejected by browser. Please wait a second before clicking again.");
    });
});
