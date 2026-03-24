import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export class Environment {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.game = gameManager;

        this.createGround();
        this.createStreet();
        this.createTrees();
        this.createPetals();
        this.createClouds();
        this.createStars();
        this.createStarParticles();
        this.createObstacles();
    }

    createGround() {
        const geometry = new THREE.PlaneGeometry(300, 300);
        const material = new THREE.MeshLambertMaterial({ color: 0x88aa77 });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    createStreet() {
        const geometry = new THREE.PlaneGeometry(10, 300);
        const material = new THREE.MeshLambertMaterial({ color: 0xddccbb });
        this.street = new THREE.Mesh(geometry, material);
        this.street.rotation.x = -Math.PI / 2;
        this.street.position.y = 0.01;
        this.street.receiveShadow = true;
        this.scene.add(this.street);
    }

    createTrees() {
        this.treeCount = 120;
        this.trees = [];

        const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 5, 16);
        trunkGeo.translate(0, 2.5, 0);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });

        const leafBaseGeo = new THREE.SphereGeometry(1, 32, 16);
        const leafMat = new THREE.MeshLambertMaterial({ color: 0xffa6c9 });

        const treeVariations = [];
        for (let v = 0; v < 5; v++) {
            const geometries = [];
            for (let i = 0; i < 15; i++) {
                const r = Math.pow(Math.random(), 1 / 3) * 2.5;
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);

                const lx = r * Math.sin(phi) * Math.cos(theta);
                const ly = r * Math.sin(phi) * Math.sin(theta);
                const lz = r * Math.cos(phi);

                const matrix = new THREE.Matrix4();
                matrix.setPosition(lx, 4.5 + ly, lz);

                const s = 1.0 + Math.random() * 1.5;
                matrix.scale(new THREE.Vector3(s, s * 0.8, s));

                const cloneGeo = leafBaseGeo.clone();
                cloneGeo.applyMatrix4(matrix);
                geometries.push(cloneGeo);
            }
            const mergedLeavesGeo = BufferGeometryUtils.mergeGeometries(geometries);
            mergedLeavesGeo.computeVertexNormals();
            treeVariations.push(mergedLeavesGeo);
        }

        for (let i = 0; i < this.treeCount; i++) {
            const treeGroup = new THREE.Group();

            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            treeGroup.add(trunk);

            const leavesGeo = treeVariations[i % 5];
            const leaves = new THREE.Mesh(leavesGeo, leafMat);
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            treeGroup.add(leaves);

            const zPos = 100 - Math.random() * 300;
            const side = (i % 2 === 0) ? 1 : -1;
            const xPos = side * (6 + Math.random() * 3);

            treeGroup.position.set(xPos, 0, zPos);
            treeGroup.rotation.y = Math.random() * Math.PI * 2;
            const scale = 0.8 + Math.random() * 0.5;
            treeGroup.scale.set(scale, scale, scale);

            this.scene.add(treeGroup);
            this.trees.push(treeGroup);
        }
    }

    createPetals() {
        // 무수히 많은 미세한 먼지 입자 형태로 치환
        this.petalCount = 4000;
        const geometry = new THREE.SphereGeometry(0.03, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });

        this.petals = new THREE.InstancedMesh(geometry, material, this.petalCount);
        this.petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.petals.frustumCulled = false;
        // 먼지이므로 그림자는 끄기

        this.petalData = [];
        const dummy = new THREE.Object3D();

        for (let i = 0; i < this.petalCount; i++) {
            const zOff = 100 - Math.random() * 250;
            dummy.position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 20,
                zOff
            );

            const scale = 0.5 + Math.random() * 1.5;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            this.petals.setMatrixAt(i, dummy.matrix);

            this.petalData.push({
                vy: -(Math.random() * 0.5 + 0.1), // 천천히 하강
                zOff: zOff,
                vx: (Math.random() - 0.5) * 0.4,
                vz: (Math.random() - 0.5) * 0.4,
                scale: scale
            });
        }
        this.scene.add(this.petals);
    }

    createClouds() {
        this.cloudCount = 18;
        this.clouds = [];
        
        const geo = new THREE.SphereGeometry(1, 16, 16);
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, flatShading: true });
        
        for (let i = 0; i < this.cloudCount; i++) {
            const group = new THREE.Group();
            
            const sphereCount = 5 + Math.floor(Math.random() * 5);
            for (let j = 0; j < sphereCount; j++) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 6,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 6
                );
                const s = 3 + Math.random() * 4;
                mesh.scale.set(s, s * 0.6, s);
                group.add(mesh);
            }
            
            group.position.set(
                (Math.random() - 0.5) * 300,
                50 + Math.random() * 20,
                100 - Math.random() * 400
            );
            
            // Randomly drift left or right slowly
            group.userData = {
                vx: (Math.random() * 1.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1)
            };
            
            this.scene.add(group);
            this.clouds.push(group);
        }
    }

    createStars() {
        this.starCount = 45;
        const geometry = new THREE.IcosahedronGeometry(0.5, 0);
        geometry.computeVertexNormals();
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x222222 });

        this.stars = new THREE.InstancedMesh(geometry, material, this.starCount);
        this.stars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.stars.castShadow = true;
        this.stars.frustumCulled = false;

        this.starData = [];
        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();

        for (let i = 0; i < this.starCount; i++) {
            const yPos = 2.5 + Math.random() * 2.5;
            const xPos = (Math.random() - 0.5) * 8;
            const zPos = 100 - Math.random() * 300;

            dummy.position.set(xPos, yPos, zPos);
            dummy.updateMatrix();
            this.stars.setMatrixAt(i, dummy.matrix);

            this.starData.push({ active: true, x: xPos, y: yPos, baseZ: zPos, rotation: 0, type: 'normal' });
            _color.setHex(0xffd700);
            this.stars.setColorAt(i, _color);
        }
        this.stars.instanceColor.needsUpdate = true;
        this.scene.add(this.stars);
    }

    resetStars(playerZ) {
        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();
        for (let i = 0; i < this.starCount; i++) {
            const data = this.starData[i];
            data.active = true;
            data.type = 'normal';
            data.baseZ = playerZ + 80 - i * 8 - Math.random() * 10;

            _color.setHex(0xffd700);
            this.stars.setColorAt(i, _color);

            dummy.position.set(data.x, data.y, data.baseZ);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            this.stars.setMatrixAt(i, dummy.matrix);
        }
        this.stars.instanceMatrix.needsUpdate = true;
        this.stars.instanceColor.needsUpdate = true;
    }

    createStarParticles() {
        this.particleCount = 150;
        const geometry = new THREE.TetrahedronGeometry(0.15, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 1 });
        this.particles = new THREE.InstancedMesh(geometry, material, this.particleCount);
        this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.particles.frustumCulled = false;

        this.particleData = [];
        const dummy = new THREE.Object3D();
        dummy.position.set(0, -100, 0);
        dummy.updateMatrix();

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.setMatrixAt(i, dummy.matrix);
            this.particleData.push({ active: false, life: 0, maxLife: 0, vx: 0, vy: 0, vz: 0, x: 0, y: 0, z: 0 });
        }
        this.scene.add(this.particles);
    }

    spawnStarParticles(pos) {
        if (!this.particles) return;
        let spawned = 0;
        for (let i = 0; i < this.particleCount; i++) {
            if (!this.particleData[i].active) {
                const data = this.particleData[i];
                data.active = true;
                data.life = 0;
                data.maxLife = 0.4 + Math.random() * 0.4;
                data.x = pos.x; data.y = pos.y; data.z = pos.z;
                
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = 3.0 + Math.random() * 6.0;

                data.vx = r * Math.sin(phi) * Math.cos(theta);
                data.vy = r * Math.sin(phi) * Math.sin(theta);
                data.vz = r * Math.cos(phi);

                spawned++;
                if (spawned >= 15) break; 
            }
        }
    }

    createObstacles() {
        this.obstacleCount = 20;
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 2.0, 8);
        geometry.rotateZ(Math.PI / 2);
        const material = new THREE.MeshLambertMaterial({ color: 0x4d3319 });
        this.obstacles = new THREE.InstancedMesh(geometry, material, this.obstacleCount);
        this.obstacles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.obstacles.castShadow = true;
        this.obstacles.receiveShadow = true;
        this.obstacles.frustumCulled = false;

        this.obstacleData = [];
        const dummy = new THREE.Object3D();
        
        for (let i = 0; i < this.obstacleCount; i++) {
            const xPos = (Math.random() - 0.5) * 12;
            const zPos = 100 - Math.random() * 300;
            const yPos = 0.4;
            const rotation = Math.random() * Math.PI;

            dummy.position.set(xPos, yPos, zPos);
            dummy.rotation.set(0, rotation, 0);
            dummy.updateMatrix();
            this.obstacles.setMatrixAt(i, dummy.matrix);

            this.obstacleData.push({ x: xPos, y: yPos, baseZ: zPos, rotation: rotation, active: true });
        }
        this.scene.add(this.obstacles);
    }

    resetObstacles(playerZ) {
        if(!this.obstacles) return;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < this.obstacleCount; i++) {
            const data = this.obstacleData[i];
            data.active = true;
            data.baseZ = playerZ + 80 - i * 15 - Math.random() * 20;
            
            dummy.position.set(data.x, data.y, data.baseZ);
            dummy.rotation.set(0, data.rotation, 0);
            dummy.scale.set(1,1,1);
            dummy.updateMatrix();
            this.obstacles.setMatrixAt(i, dummy.matrix);
        }
        this.obstacles.instanceMatrix.needsUpdate = true;
    }

    update(delta, playerPos) {
        this.ground.position.z = playerPos.z;
        this.street.position.z = playerPos.z;

        for (let i = 0; i < this.treeCount; i++) {
            const tree = this.trees[i];
            if (tree.position.z > playerPos.z + 100) {
                tree.position.z -= 300;
                const side = (Math.random() > 0.5) ? 1 : -1;
                tree.position.x = side * (6 + Math.random() * 3);
            } else if (tree.position.z < playerPos.z - 200) {
                tree.position.z += 300;
                const side = (Math.random() > 0.5) ? 1 : -1;
                tree.position.x = side * (6 + Math.random() * 3);
            }
        }

        if (this.clouds) {
            for (let i = 0; i < this.cloudCount; i++) {
                const cloud = this.clouds[i];
                cloud.position.x += cloud.userData.vx * delta;
                
                // Wrap around X
                if (cloud.position.x > playerPos.x + 200) {
                    cloud.position.x = playerPos.x - 200;
                } else if (cloud.position.x < playerPos.x - 200) {
                    cloud.position.x = playerPos.x + 200;
                }
                
                // Wrap around Z based on player movement
                if (cloud.position.z > playerPos.z + 150) {
                    cloud.position.z -= 350;
                    cloud.position.x = playerPos.x + (Math.random() - 0.5) * 300;
                } else if (cloud.position.z < playerPos.z - 250) {
                    cloud.position.z += 350;
                    cloud.position.x = playerPos.x + (Math.random() - 0.5) * 300;
                }
            }
        }

        const dummy = new THREE.Object3D();

        if (this.petals) {
            for (let i = 0; i < this.petalCount; i++) {
                this.petals.getMatrixAt(i, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                const data = this.petalData[i];

                if (dummy.position.z > playerPos.z + 100) {
                    data.zOff -= 250;
                    dummy.position.y = 20;
                    dummy.position.x = playerPos.x + (Math.random() - 0.5) * 60;
                } else if (dummy.position.z < playerPos.z - 150) {
                    data.zOff += 250;
                    dummy.position.y = 20;
                    dummy.position.x = playerPos.x + (Math.random() - 0.5) * 60;
                }

                dummy.position.x += data.vx * delta;
                dummy.position.y += data.vy * delta; // 부드러운 하강 처리
                dummy.position.z = playerPos.z + data.zOff;
                data.zOff += data.vz * delta;

                // 불규칙한 미세 바람 (먼지 느낌 곡선)
                data.vx += (Math.random() - 0.5) * 0.1 * delta;
                data.vz += (Math.random() - 0.5) * 0.1 * delta;

                if (data.vx > 1) data.vx = 1;
                if (data.vx < -1) data.vx = -1;
                if (data.vz > 1) data.vz = 1;
                if (data.vz < -1) data.vz = -1;

                if (dummy.position.y < 0) {
                    dummy.position.y = 20;
                    dummy.position.x = playerPos.x + (Math.random() - 0.5) * 60;
                }

                // 스케일과 회전을 고정한 구체 렌더 (최적화 및 먼지 형태 유지)
                dummy.scale.set(data.scale, data.scale, data.scale);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                this.petals.setMatrixAt(i, dummy.matrix);
            }
            this.petals.instanceMatrix.needsUpdate = true;
        }

        if (this.stars) {
            const _color = new THREE.Color();
            let colorNeedsUpdate = false;

            for (let i = 0; i < this.starCount; i++) {
                const data = this.starData[i];

                // 별이 플레이어 뒤로 한참 지나갔을 경우 (앞쪽 스폰)
                if (data.baseZ > playerPos.z + 100) {
                    data.baseZ -= 300;
                    data.x = (Math.random() - 0.5) * 8;
                    data.y = 2.5 + Math.random() * 2.5;
                    data.active = true;
                    
                    data.type = 'normal';
                    _color.setHex(0xffd700);

                    if (this.game.score >= 30 && Math.random() < 0.2) {
                        data.type = 'red';
                        _color.setHex(0xff3333);
                    }

                    if (this.game.spawnHeart) {
                        data.type = 'heart';
                        _color.setHex(0xff66b2);
                        this.game.spawnHeart = false;
                    }

                    this.stars.setColorAt(i, _color);
                    colorNeedsUpdate = true;
                } 
                // 별이 플레이어 앞으로 한참 지나갔을 경우 (뒤로 걷는 중, 뒷쪽 스폰)
                else if (data.baseZ < playerPos.z - 200) {
                    data.baseZ += 300;
                    data.x = (Math.random() - 0.5) * 8;
                    data.y = 2.5 + Math.random() * 2.5;
                    data.active = true;
                    
                    data.type = 'normal';
                    _color.setHex(0xffd700);
                    this.stars.setColorAt(i, _color);
                    colorNeedsUpdate = true;
                }

                if (!data.active) continue;

                data.rotation += 2.0 * delta;

                dummy.position.set(data.x, data.y + Math.sin(data.rotation) * 0.2, data.baseZ);
                dummy.rotation.y = data.rotation;
                dummy.rotation.x = data.rotation * 0.5;
                dummy.scale.set(1, 1, 1);

                if (dummy.position.distanceTo(playerPos) < 2.0) {
                    data.active = false;
                    this.spawnStarParticles(dummy.position);
                    dummy.position.y = -100;
                    
                    if (data.type === 'normal') {
                        this.game.collectStar();
                    } else if (data.type === 'red') {
                        this.game.hitObstacle();
                    } else if (data.type === 'heart') {
                        this.game.collectHeart();
                    }
                }

                dummy.updateMatrix();
                this.stars.setMatrixAt(i, dummy.matrix);
            }
            this.stars.instanceMatrix.needsUpdate = true;
            if (colorNeedsUpdate) this.stars.instanceColor.needsUpdate = true;
        }

        if (this.particles) {
            let needsUpdate = false;
            for (let i = 0; i < this.particleCount; i++) {
                const data = this.particleData[i];
                if (data.active) {
                    data.life += delta;
                    if (data.life >= data.maxLife) {
                        data.active = false;
                        dummy.position.set(0, -100, 0);
                        dummy.scale.set(0, 0, 0);
                    } else {
                        data.x += data.vx * delta;
                        data.y += data.vy * delta;
                        data.z += data.vz * delta;
                        data.vy -= 8.0 * delta; // gravity
                        
                        const scale = 1.0 - (data.life / data.maxLife);
                        dummy.position.set(data.x, data.y, data.z);
                        dummy.scale.set(scale, scale, scale);
                        dummy.rotation.set(data.life * 5, data.life * 4, data.life * 6);
                    }
                    dummy.updateMatrix();
                    this.particles.setMatrixAt(i, dummy.matrix);
                    needsUpdate = true;
                }
            }
            if (needsUpdate) this.particles.instanceMatrix.needsUpdate = true;
        }

        if (this.obstacles) {
            for (let i = 0; i < this.obstacleCount; i++) {
                const data = this.obstacleData[i];

                if (data.baseZ > playerPos.z + 100) {
                    data.baseZ -= 300;
                    data.x = (Math.random() - 0.5) * 12;
                    data.active = true;
                } else if (data.baseZ < playerPos.z - 200) {
                    data.baseZ += 300;
                    data.x = (Math.random() - 0.5) * 12;
                    data.active = true;
                }

                if (!data.active) continue;

                dummy.position.set(data.x, data.y, data.baseZ);
                dummy.rotation.set(0, data.rotation, 0);
                dummy.scale.set(1, 1, 1);

                // Collision with player
                if (Math.abs(data.baseZ - playerPos.z) < 1.0 && Math.abs(data.x - playerPos.x) < 1.0 && playerPos.y < 2.0) {
                    data.active = false;
                    this.game.hitObstacle();
                    dummy.position.y = -100;
                }

                dummy.updateMatrix();
                this.obstacles.setMatrixAt(i, dummy.matrix);
            }
            this.obstacles.instanceMatrix.needsUpdate = true;
        }
    }
}
