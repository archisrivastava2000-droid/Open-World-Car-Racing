
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// ================= SCENE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 65, 260);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);

// ================= LIGHTS =================
scene.add(new THREE.HemisphereLight(0xffffff, 0x526044, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 10);
scene.add(sun);

// ================= MATERIALS =================
const roadMat = new THREE.MeshStandardMaterial({ color: 0x292929 });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x399447 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const treeMat = new THREE.MeshStandardMaterial({ color: 0x12652b });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x654321 });

// ================= AUDIO SYSTEM =================
let audioCtx = null;
let masterGain = null;
let engineGain = null;
let engineOsc = null;
let engineOsc2 = null;
let nitroOsc = null;
let nitroGain = null;
let musicTimer = null;
let soundEnabled = true;
let wasBraking = false;
let wasNitro = false;

function setupAudio() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = soundEnabled ? 0.8 : 0;
    masterGain.connect(audioCtx.destination);

    // ENGINE SOUND
    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 45;

    engineOsc2 = audioCtx.createOscillator();
    engineOsc2.type = 'triangle';
    engineOsc2.frequency.value = 23;

    const engineFilter = audioCtx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 350;

    engineGain = audioCtx.createGain();
    engineGain.gain.value = 0.0001;

    engineOsc.connect(engineFilter);
    engineOsc2.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(masterGain);

    engineOsc.start();
    engineOsc2.start();

    // NITRO SOUND
    nitroOsc = audioCtx.createOscillator();
    nitroOsc.type = 'sawtooth';
    nitroOsc.frequency.value = 100;

    const nitroFilter = audioCtx.createBiquadFilter();
    nitroFilter.type = 'lowpass';
    nitroFilter.frequency.value = 700;

    nitroGain = audioCtx.createGain();
    nitroGain.gain.value = 0;

    nitroOsc.connect(nitroFilter);
    nitroFilter.connect(nitroGain);
    nitroGain.connect(masterGain);
    nitroOsc.start();

    // BACKGROUND MUSIC
    startMusic();

    updateSoundButton();
}

function startMusic() {
    if (!audioCtx || musicTimer) return;

    const notes = [110, 130.81, 146.83, 164.81, 146.83, 130.81, 110, 98];
    let noteIndex = 0;

    musicTimer = setInterval(() => {
        if (!audioCtx || audioCtx.state !== 'running' || !soundEnabled) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = notes[noteIndex % notes.length];

        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.045, audioCtx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.65);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.7);

        noteIndex++;
    }, 380);
}

function playNoise(duration = 0.3, volume = 0.3, frequency = 800) {
    if (!audioCtx || !soundEnabled) return;

    const length = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start();
}

function playCrash() {
    playNoise(0.8, 0.8, 1200);

    if (!audioCtx || !soundEnabled) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playBrake() {
    playNoise(0.35, 0.25, 1800);
}

function playClick() {
    if (!audioCtx || !soundEnabled) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 650;

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

function updateEngineSound() {
    if (!audioCtx || !engineOsc) return;

    const rpm = 38 + speed * 95;

    engineOsc.frequency.setTargetAtTime(rpm, audioCtx.currentTime, 0.08);
    engineOsc2.frequency.setTargetAtTime(rpm * 0.48, audioCtx.currentTime, 0.08);

    const volume = speed > 0.02 ? 0.025 + speed * 0.045 : 0.0001;
    engineGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.12);

    if (nitroGain) {
        const active = keys.nitro && keys.gas && nitro > 0 && speed > 0;
        nitroGain.gain.setTargetAtTime(active ? 0.10 : 0, audioCtx.currentTime, 0.08);

        if (active) {
            nitroOsc.frequency.setTargetAtTime(130 + speed * 100, audioCtx.currentTime, 0.1);
        }
    }
}

// SOUND BUTTON
const soundButton = document.createElement('button');
soundButton.id = 'soundButton';
soundButton.textContent = '🔊 SOUND ON';

Object.assign(soundButton.style, {
    position: 'fixed',
    top: '145px',
    right: '12px',
    zIndex: '1000',
    padding: '10px 14px',
    background: '#101c35',
    color: 'white',
    border: '2px solid #00cfff',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '13px'
});

document.body.appendChild(soundButton);

function updateSoundButton() {
    soundButton.textContent = soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF';
}

soundButton.addEventListener('pointerdown', e => {
    e.preventDefault();

    if (!audioCtx) setupAudio();
    else if (audioCtx.state === 'suspended') audioCtx.resume();

    soundEnabled = !soundEnabled;

    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(
            soundEnabled ? 0.8 : 0,
            audioCtx.currentTime,
            0.05
        );
    }

    updateSoundButton();
});

// ================= ROAD SEGMENTS =================
const roads = [];
const grounds = [];

for (let i = 0; i < 3; i++) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 200), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -100 - i * 200);
    scene.add(road);
    roads.push(road);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 200), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.1, -100 - i * 200);
    scene.add(ground);
    grounds.push(ground);
}

// ================= ROAD LINES =================
const lines = [];

for (let i = 0; i < 50; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 4), whiteMat);
    line.position.set(0, 0.04, -i * 12);
    scene.add(line);
    lines.push(line);
}

// ================= BUILDINGS =================
const buildings = [];

for (let i = 0; i < 45; i++) {
    for (const side of [-1, 1]) {
        const height = 9 + Math.random() * 15;

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(7, height, 10),
            new THREE.MeshStandardMaterial({
                color: [0xc9b59b, 0x8996a8, 0xabb6c2, 0xd5d0c8][i % 4]
            })
        );

        building.position.set(side * (10.5 + Math.random() * 2), height / 2, -i * 12 - 20);
        scene.add(building);
        buildings.push(building);
    }
}

// ================= TREES =================
const trees = [];

for (let i = 0; i < 35; i++) {
    for (const side of [-1, 1]) {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
            trunkMat
        );

        trunk.position.set(side * 8.5, 1, -i * 16 - 10);
        scene.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 5, 8),
            treeMat
        );

        leaves.position.set(side * 8.5, 4, -i * 16 - 10);
        scene.add(leaves);

        trees.push(trunk, leaves);
    }
}

// ================= CAR CREATOR =================
function makeCar(color) {
    const car = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.75, 4),
        new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.5,
            roughness: 0.3
        })
    );

    body.position.y = 0.85;
    car.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x15283b })
    );

    roof.position.set(0, 1.55, -0.2);
    car.add(roof);

    for (const x of [-1, 1]) {
        for (const z of [-1.3, 1.3]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16),
                new THREE.MeshStandardMaterial({ color: 0x111111 })
            );

            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.5, z);
            car.add(wheel);
        }
    }

    return car;
}

// ================= PLAYER CAR =================
const colors = [0xe00020, 0x0878ff, 0x111111];

let player = makeCar(colors[0]);
player.position.set(0, 0, 0);
scene.add(player);

window.selectCar = function(index) {
    if (index < 0 || index > 2) return;

    if (audioCtx) playClick();

    scene.remove(player);
    player = makeCar(colors[index]);
    player.position.set(0, 0, 0);
    scene.add(player);
};

// ================= TRAFFIC =================
const traffic = [];

for (let i = 0; i < 8; i++) {
    const car = makeCar([0xffcc00, 0x1675dd, 0xffffff, 0x222222][i % 4]);

    car.position.set([-3.5, 0, 3.5][i % 3], 0, -35 - i * 32);
    scene.add(car);
    traffic.push(car);
}

// ================= INPUT =================
const keys = {
    left: false,
    right: false,
    gas: false,
    brake: false,
    nitro: false
};

function bind(id, key) {
    const button = document.getElementById(id);

    button.addEventListener('pointerdown', e => {
        e.preventDefault();

        if (!audioCtx) setupAudio();
        else if (audioCtx.state === 'suspended') audioCtx.resume();

        if (!keys[key]) playClick();
        keys[key] = true;
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(event => {
        button.addEventListener(event, () => {
            keys[key] = false;
        });
    });
}

bind('left', 'left');
bind('right', 'right');
bind('gas', 'gas');
bind('brake', 'brake');
bind('nitro', 'nitro');

// Garage buttons
document.querySelectorAll('#garage button').forEach(button => {
    button.addEventListener('pointerdown', () => {
        if (!audioCtx) setupAudio();
        else if (audioCtx.state === 'suspended') audioCtx.resume();
    });
});

// ================= GAME VARIABLES =================
let speed = 0;
let distance = 0;
let nitro = 100;
let crashTimer = 0;
let gameTime = 0;

// ================= GAME LOOP =================
function animate() {
    requestAnimationFrame(animate);

    gameTime++;

    // ACCELERATION
    if (keys.gas) {
        speed = Math.min(speed + 0.012, 1.5);
    } else {
        speed = Math.max(speed - 0.004, 0);
    }

    if (keys.brake) {
        speed = Math.max(speed - 0.025, 0);
    }

    // NITRO
    if (keys.nitro && keys.gas && nitro > 0) {
        speed = Math.min(speed + 0.025, 2.3);
        nitro = Math.max(0, nitro - 0.7);
    } else {
        nitro = Math.min(100, nitro + 0.12);
    }

    // BRAKE SOUND
    if (keys.brake && !wasBraking && speed > 0.05) {
        playBrake();
    }
    wasBraking = keys.brake;

    // NITRO SOUND START
    const nitroActive = keys.nitro && keys.gas && nitro > 0;
    if (nitroActive && !wasNitro) {
        playNoise(0.5, 0.25, 1500);
    }
    wasNitro = nitroActive;

    // STEERING
    if (keys.left) player.position.x -= 0.11;
    if (keys.right) player.position.x += 0.11;

    player.position.x = Math.max(-5, Math.min(5, player.position.x));

    distance += speed * 0.1;

    // ROAD RECYCLING
    roads.forEach(road => {
        road.position.z += speed;
        if (road.position.z > 100) road.position.z -= 600;
    });

    grounds.forEach(ground => {
        ground.position.z += speed;
        if (ground.position.z > 100) ground.position.z -= 600;
    });

    // ROAD MARKINGS
    lines.forEach(line => {
        line.position.z += speed;
        if (line.position.z > 12) line.position.z -= 600;
    });

    // BUILDINGS
    buildings.forEach(building => {
        building.position.z += speed;
        if (building.position.z > 25) building.position.z -= 540;
    });

    // TREES
    trees.forEach(tree => {
        tree.position.z += speed;
        if (tree.position.z > 25) tree.position.z -= 560;
    });

    // TRAFFIC
    if (crashTimer > 0) crashTimer--;

    traffic.forEach(car => {
        car.position.z += speed + 0.16;

        if (car.position.z > 15) {
            car.position.z = -150 - Math.random() * 100;
            car.position.x = [-3.5, 0, 3.5][Math.floor(Math.random() * 3)];
        }

        // COLLISION
        if (
            crashTimer === 0 &&
            Math.abs(car.position.z) < 3 &&
            Math.abs(car.position.x - player.position.x) < 1.8
        ) {
            speed = 0;
            crashTimer = 90;
            document.getElementById('message').textContent = 'CRASH! DRIVE CAREFULLY';
            playCrash();
        }
    });

    if (crashTimer === 0) {
        document.getElementById('message').textContent = 'SYSTEM READY';
    }

    // ENGINE SOUND UPDATE
    updateEngineSound();

    // CAMERA FOLLOW
    camera.position.set(player.position.x * 0.65, 5.5, 11);
    camera.lookAt(player.position.x, 0.8, -10);

    // HUD
    document.getElementById('speed').textContent = Math.round(speed * 100) + ' KM/H';
    document.getElementById('distance').textContent = 'DISTANCE: ' + Math.floor(distance) + ' M';
    document.getElementById('nitroText').textContent = 'NITRO ' + Math.floor(nitro) + '%';

    renderer.render(scene, camera);
}

animate();

// ================= RESIZE =================
onresize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
};
