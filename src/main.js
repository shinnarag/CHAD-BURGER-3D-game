import { Game } from './Game.js?v=7';

document.addEventListener('DOMContentLoaded', () => {

    // Audio Control Logic
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', (e) => {
        let v = parseFloat(e.target.value);
        if (v < 0.1) {
            v = 0.1;
            e.target.value = 0.1;
        }
        if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
            window.ytPlayer.setVolume(v * 100);
        }
    });

    const game = new Game();

    // 저장된 플레이어 ID 불러오기
    const savedId = localStorage.getItem('cherryBlossomPlayerId');
    const playerIdInput = document.getElementById('player-id');
    if (savedId && playerIdInput) {
        playerIdInput.value = savedId;
    }

    const ui = document.getElementById('ui');
    const loading = document.getElementById('loading');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const hud = document.getElementById('hud');
    const scoreUI = document.getElementById('score');
    const finalScoreUI = document.getElementById('final-score');
    
    const life1 = document.getElementById('life-1');
    const life2 = document.getElementById('life-2');
    const life3 = document.getElementById('life-3');
    
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
            const timeStr = entry.time ? ` (${Math.floor(entry.time)}s)` : '';
            li.innerHTML = `<span>#${idx+1} ${entry.id}</span><span>${entry.score} 🌟${timeStr}</span>`;
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
        if(life1) life1.className = lives >= 1 ? 'heart' : 'heart heart-lost';
        if(life2) life2.className = lives >= 2 ? 'heart' : 'heart heart-lost';
        if(life3) life3.className = lives >= 3 ? 'heart' : 'heart heart-lost';
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
        if (!game.player.isMobile) {
            document.exitPointerLock();
        }
        hud.classList.add('hidden');
        ui.classList.remove('hidden');
        startScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        finalScoreUI.innerText = score;
        renderLeaderboard();
    };

    // === 게임 시작 로직 (Play 버튼 전용) ===
    const btnPlay = document.getElementById('btn-play');
    const btnReplay = document.getElementById('btn-replay');
    const idError = document.getElementById('id-error');

    const startGame = () => {
        const playerIdInputEl = document.getElementById('player-id');
        let playerId = playerIdInputEl.value.trim();
        
        // 관리자 코드 처리
        if (playerId === 'srep25220' || playerId === 'sreo25220') {
            if (confirm("정말로 모든 리더보드 스코어를 초기화 하시겠습니까?")) {
                localStorage.removeItem('cherryBlossomLeaderboard');
                localStorage.removeItem('cherryBlossomBest'); 
                alert("리더보드가 모두 초기화 되었습니다. 게임을 재시작합니다.");
                location.reload();
            }
            return;
        }

        // ID 필수 입력 검증 (팝업 없이 인라인 에러 표시)
        if (!playerId) {
            idError.style.display = 'block';
            playerIdInputEl.classList.add('input-error');
            playerIdInputEl.focus();
            // 에러 애니메이션 후 클래스 제거
            setTimeout(() => {
                playerIdInputEl.classList.remove('input-error');
            }, 400);
            return;
        }

        // 에러 표시 숨기기
        idError.style.display = 'none';
        playerIdInputEl.classList.remove('input-error');
        
        // 입력한 ID를 localStorage에 저장
        localStorage.setItem('cherryBlossomPlayerId', playerId);
        
        window.ytPlayRequested = true;
        
        // Start YouTube Music upon user interaction
        if (window.ytReady && window.ytPlayer && typeof window.ytPlayer.playVideo === 'function') {
            window.ytPlayer.unMute();
            const state = window.ytPlayer.getPlayerState();
            if (state !== YT.PlayerState.PLAYING) {
                window.ytPlayer.playVideo();
            }
        }
        
        game.start(playerId);
        
        if (game.player.isMobile) {
            ui.classList.add('hidden');
            hud.classList.remove('hidden');
        }
    };

    // 입력 시 에러 표시 자동 해제 + Enter 키로 시작
    document.getElementById('player-id').addEventListener('input', () => {
        idError.style.display = 'none';
        document.getElementById('player-id').classList.remove('input-error');
    });
    document.getElementById('player-id').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) startGame();
    });

    // Play 버튼 클릭
    btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });

    // 다시하기 버튼 클릭
    btnReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        gameOverScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });

    document.addEventListener('pointerlockchange', () => {
        if (game.player.isMobile) return;
        
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
    
    // 모바일 터치 및 데스크탑 클릭 시 비디오 강제 실행 콜백
    const ensureAudio = () => {
        if (window.ytPlayRequested && window.ytReady && window.ytPlayer && typeof window.ytPlayer.playVideo === 'function') {
            const state = window.ytPlayer.getPlayerState();
            if (state !== YT.PlayerState.PLAYING) {
                window.ytPlayer.unMute();
                window.ytPlayer.playVideo();
            }
        }
    };
    
    // 강력한 Fallback: 데스크탑 및 모바일 버튼 터치 시 무조건 연동
    document.body.addEventListener('click', ensureAudio);

    // 데스크탑 좌클릭 점프 지원
    document.body.addEventListener('mousedown', (e) => {
        if (game.isRunning && !game.player.isMobile && document.pointerLockElement === document.body) {
            if (game.player.canJump) {
                game.player.velocity.y += game.player.jumpForce;
                game.player.canJump = false;
            }
        }
    });

    // Mobile touch bindings
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnQuit = document.getElementById('btn-quit');

    if (btnLeft) {
        btnLeft.addEventListener('touchstart', ensureAudio);
        btnRight.addEventListener('touchstart', ensureAudio);
        btnJump.addEventListener('touchstart', ensureAudio);
        
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); game.player.moveLeft = true; });
        btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); game.player.moveLeft = false; });
        
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); game.player.moveRight = true; });
        btnRight.addEventListener('touchend', (e) => { e.preventDefault(); game.player.moveRight = false; });
        
        btnJump.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            if (game.player.canJump) {
                game.player.velocity.y += game.player.jumpForce;
                game.player.canJump = false;
            }
        });
        
        btnQuit.addEventListener('click', (e) => {
            e.preventDefault();
            game.triggerGameOver();
        });
    }
});
