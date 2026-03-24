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

    // Audio Control Toggle Logic
    const audioBtn = document.getElementById('audio-control');
    const toggleMute = () => {
        bgm.muted = !bgm.muted;
        audioBtn.innerText = bgm.muted ? '🔇' : '🔊';
        audioBtn.style.opacity = bgm.muted ? '0.4' : '0.8';
    };

    audioBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 버튼 클릭이 게임 시작으로 이어지지 않도록 방지
        toggleMute();
    });

    document.addEventListener('keydown', (e) => {
        // 단축키 M으로 똑같이 켜고 끄기 가능
        if (e.code === 'KeyM') {
            toggleMute();
        }
    });

    const game = new Game();

    const ui = document.getElementById('ui');
    const loading = document.getElementById('loading');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const hud = document.getElementById('hud');
    const scoreUI = document.getElementById('score');
    const finalScoreUI = document.getElementById('final-score');
    const timeUI = document.getElementById('time');
    
    const startBestScoreUI = document.getElementById('start-best-score');
    const finalBestScoreUI = document.getElementById('final-best-score');
    const comboDisplay = document.getElementById('combo-display');
    const comboUI = document.getElementById('combo');

    // Init best score
    if(startBestScoreUI) startBestScoreUI.innerText = game.bestScore;

    loading.classList.add('hidden');

    // Bind UI callbacks
    game.onScoreUpdate = (score) => {
        scoreUI.innerText = score;
    };

    game.onTimeUpdate = (time) => {
        timeUI.innerText = Math.ceil(time);
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

    game.onGameOver = (score, bestScore) => {
        document.exitPointerLock();
        hud.classList.add('hidden');
        ui.classList.remove('hidden');
        startScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        finalScoreUI.innerText = score;
        if(finalBestScoreUI) finalBestScoreUI.innerText = bestScore;
        if(startBestScoreUI) startBestScoreUI.innerText = bestScore;
    };

    ui.addEventListener('click', () => {
        game.start();
        ui.classList.add('hidden');
        hud.classList.remove('hidden');
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement !== document.body && game.isRunning) {
            // Paused manually (ESC)
            ui.classList.remove('hidden');
            startScreen.classList.remove('hidden');
            gameOverScreen.classList.add('hidden');
            hud.classList.add('hidden');
            game.pause();
        }
    });
});
