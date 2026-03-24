import * as THREE from 'three';
import { Player } from './Player.js';
import { Environment } from './Environment.js';

export class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.isRunning = false;

        this.score = 0;
        this.timeLeft = 60.0; // 1 minute
        
        this.combo = 0;
        this.comboTimer = 0.0;
        this.maxComboTimer = 3.0; // 3초 내에 먹어야 콤보 유지
        this.speedMultiplier = 1.0;
        
        let savedBest = localStorage.getItem('cherryBlossomBest');
        this.bestScore = savedBest ? parseInt(savedBest) : 0;

        this.onScoreUpdate = null;
        this.onTimeUpdate = null;
        this.onComboUpdate = null;
        this.onGameOver = null;

        this.initScene();

        this.environment = new Environment(this.scene, this);
        this.player = new Player(this.camera, this.scene);

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.035);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffee, 1.5);
        dirLight.position.set(40, 60, -40);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        const sunGeo = new THREE.SphereGeometry(4, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.position.copy(dirLight.position);
        this.scene.add(sun);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        // 일시정지 후 돌아와도 항상 0초, 점수 0에서 새로 시작!
        this.timeLeft = 60.0;
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0.0;
        this.speedMultiplier = 1.0;
        this.player.setSpeedMultiplier(1.0);

        // HUD UI 명시적 초기화
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onTimeUpdate) this.onTimeUpdate(this.timeLeft);
        if (this.onComboUpdate) this.onComboUpdate(this.combo);

        this.environment.resetStars(this.camera.position.z);
        if (this.environment.resetObstacles) this.environment.resetObstacles(this.camera.position.z);

        this.isRunning = true;
        this.player.lock();
    }

    pause() {
        this.isRunning = false;
    }

    playCollectSound() {
        // 파일 없이도 웹 오디오 API를 써서 맑고 영롱한 힐링 마법 이펙트음을 직접 합성합니다!
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const now = this.audioCtx.currentTime;

        // 영롱한 아르페지오 3음(C6, E6, G6) 재생 함수
        const playTone = (freq, type, delay) => {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + delay);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + delay + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

            osc.start(now + delay);
            osc.stop(now + delay + 0.6);
        };

        // 딩-동-댕 맑은 사인파 연주
        playTone(1046.50, 'sine', 0.0);
        playTone(1318.51, 'sine', 0.08);
        playTone(1567.98, 'sine', 0.16);
    }

    collectStar() {
        this.score++;
        this.combo++;
        this.comboTimer = this.maxComboTimer;
        
        // 속도는 콤보당 0.1씩 증가, 최대 1.5배 (총 2.5배)
        this.speedMultiplier = 1.0 + Math.min(this.combo * 0.1, 1.5);
        this.player.setSpeedMultiplier(this.speedMultiplier);

        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onComboUpdate) this.onComboUpdate(this.combo);
        this.playCollectSound();
    }

    hitObstacle() {
        this.combo = 0;
        this.comboTimer = 0.0;
        this.speedMultiplier = 0.5; // Stunned/Slowed dynamically
        this.player.setSpeedMultiplier(0.5);
        if (this.onComboUpdate) this.onComboUpdate(this.combo);
        
        // Error sound
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.4);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();

        if (this.isRunning) {
            if (this.combo > 0) {
                this.comboTimer -= delta;
                if (this.comboTimer <= 0) {
                    this.combo = 0;
                    this.speedMultiplier = 1.0;
                    this.player.setSpeedMultiplier(1.0);
                    if (this.onComboUpdate) this.onComboUpdate(this.combo);
                }
            }

            this.player.update(delta);

            this.timeLeft -= delta;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.isRunning = false;
                if (this.score > this.bestScore) {
                    this.bestScore = this.score;
                    localStorage.setItem('cherryBlossomBest', this.bestScore);
                }
                if (this.onTimeUpdate) this.onTimeUpdate(this.timeLeft);
                if (this.onGameOver) this.onGameOver(this.score, this.bestScore);
            } else {
                if (this.onTimeUpdate) this.onTimeUpdate(this.timeLeft);
            }
        } else {
            this.camera.position.z -= 2.0 * delta;
        }

        this.environment.update(delta, this.camera.position);
        this.renderer.render(this.scene, this.camera);
    }
}
