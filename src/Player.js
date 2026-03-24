import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.camera.position.set(0, 1.6, 0);

        this.controls = new PointerLockControls(camera, document.body);
        scene.add(this.controls.getObject());

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.speed = 60.0;
        this.speedMultiplier = 1.0;
        this.friction = 10.0;
        this.gravity = 30.0;
        this.jumpForce = 12.0;

        this.addEventListeners();
    }

    addEventListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += this.jumpForce;
                        this.canJump = false;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    lock() {
        this.controls.lock();
    }

    setBaseSpeed(speed) {
        this.speed = speed;
    }

    setSpeedMultiplier(mult) {
        this.speedMultiplier = mult;
    }

    update(delta) {
        if (!this.controls.isLocked) return;

        this.velocity.x -= this.velocity.x * this.friction * delta;
        this.velocity.z -= this.velocity.z * this.friction * delta;
        this.velocity.y -= this.gravity * delta; // Gravity

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const currentSpeed = this.speed * this.speedMultiplier;

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * currentSpeed * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * currentSpeed * delta;
        }

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        // Apply vertical movement manually to the internal camera object
        this.controls.getObject().position.y += this.velocity.y * delta;

        // Ground collision
        if (this.controls.getObject().position.y < 1.6) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = 1.6;
            this.canJump = true;
        }

        const pos = this.controls.getObject().position;
        // Keep player strictly to the road horizontally
        if (pos.x > 8) pos.x = 8;
        if (pos.x < -8) pos.x = -8;
    }
}
