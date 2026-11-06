
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 65, 260);

const camera = new THREE.PerspectiveCamera(
 65, innerWidth / innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({
 antialias:true
});

renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.HemisphereLight(0xffffff,0x526044,2));

const sun = new THREE.DirectionalLight(0xffffff,2);
sun.position.set(20,30,10);
scene.add(sun);

// MATERIALS
const roadMat = new THREE.MeshStandardMaterial({color:0x292929});
const grassMat = new THREE.MeshStandardMaterial({color:0x399447});
const whiteMat = new THREE.MeshStandardMaterial({color:0xffffff});
const treeMat = new THREE.MeshStandardMaterial({color:0x12652b});
const trunkMat = new THREE.MeshStandardMaterial({color:0x654321});

// ROAD SEGMENTS
const roads = [];
const grounds = [];

for(let i=0;i<3;i++){

 const road = new THREE.Mesh(
  new THREE.PlaneGeometry(14,200),
  roadMat
 );
 road.rotation.x=-Math.PI/2;
 road.position.set(0,0,-100-i*200);
 scene.add(road);
 roads.push(road);

 const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500,200),
  grassMat
 );
 ground.rotation.x=-Math.PI/2;
 ground.position.set(0,-0.1,-100-i*200);
 scene.add(ground);
 grounds.push(ground);
}

// ROAD LINES
const lines=[];

for(let i=0;i<50;i++){
 const line = new THREE.Mesh(
  new THREE.BoxGeometry(0.18,0.04,4),
  whiteMat
 );
 line.position.set(0,0.04,-i*12);
 scene.add(line);
 lines.push(line);
}

// BUILDINGS
const buildings=[];

for(let i=0;i<45;i++){
 for(const side of [-1,1]){

  const height=9+Math.random()*15;

  const building = new THREE.Mesh(
   new THREE.BoxGeometry(7,height,10),
   new THREE.MeshStandardMaterial({
    color:[0xc9b59b,0x8996a8,0xabb6c2,0xd5d0c8][i%4]
   })
  );

  building.position.set(
   side*(10.5+Math.random()*2),
   height/2,
   -i*12-20
  );

  scene.add(building);
  buildings.push(building);
 }
}

// TREES
const trees=[];

for(let i=0;i<35;i++){
 for(const side of [-1,1]){

  const trunk = new THREE.Mesh(
   new THREE.CylinderGeometry(0.2,0.3,2,8),
   trunkMat
  );

  trunk.position.set(side*8.5,1,-i*16-10);
  scene.add(trunk);

  const leaves = new THREE.Mesh(
   new THREE.ConeGeometry(1.5,5,8),
   treeMat
  );

  leaves.position.set(side*8.5,4,-i*16-10);
  scene.add(leaves);

  trees.push(trunk,leaves);
 }
}

// CAR CREATOR
function makeCar(color){

 const car = new THREE.Group();

 const body = new THREE.Mesh(
  new THREE.BoxGeometry(2,0.75,4),
  new THREE.MeshStandardMaterial({
   color:color,
   metalness:0.5,
   roughness:0.3
  })
 );

 body.position.y=0.85;
 car.add(body);

 const roof = new THREE.Mesh(
  new THREE.BoxGeometry(1.5,0.8,1.8),
  new THREE.MeshStandardMaterial({color:0x15283b})
 );

 roof.position.set(0,1.55,-0.2);
 car.add(roof);

 // WINDOWS AND WHEELS
 for(const x of [-1,1]){
  for(const z of [-1.3,1.3]){

   const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45,0.45,0.3,16),
    new THREE.MeshStandardMaterial({color:0x111111})
   );

   wheel.rotation.z=Math.PI/2;
   wheel.position.set(x,0.5,z);
   car.add(wheel);
  }
 }

 return car;
}

// PLAYER CAR
const colors=[0xe00020,0x0878ff,0x111111];

let player=makeCar(colors[0]);
player.position.set(0,0,0);
scene.add(player);

window.selectCar=function(index){

 if(index<0 || index>2)return;

 scene.remove(player);
 player=makeCar(colors[index]);
 player.position.set(0,0,0);
 scene.add(player);
};

// TRAFFIC
const traffic=[];

for(let i=0;i<8;i++){

 const car=makeCar(
  [0xffcc00,0x1675dd,0xffffff,0x222222][i%4]
 );

 car.position.set(
  [-3.5,0,3.5][i%3],
  0,
  -35-i*32
 );

 scene.add(car);
 traffic.push(car);
}

// INPUT
const keys={
 left:false,
 right:false,
 gas:false,
 brake:false,
 nitro:false
};

function bind(id,key){

 const button=document.getElementById(id);

 button.addEventListener('pointerdown',e=>{
  e.preventDefault();
  keys[key]=true;
 });

 ['pointerup','pointerleave','pointercancel'].forEach(event=>{
  button.addEventListener(event,()=>{
   keys[key]=false;
  });
 });
}

bind('left','left');
bind('right','right');
bind('gas','gas');
bind('brake','brake');
bind('nitro','nitro');

// GAME VARIABLES
let speed=0;
let distance=0;
let nitro=100;
let crashTimer=0;
let gameTime=0;

// GAME LOOP
function animate(){

 requestAnimationFrame(animate);

 gameTime++;

 // ACCELERATION
 if(keys.gas){
  speed=Math.min(speed+0.012,1.5);
 }else{
  speed=Math.max(speed-0.004,0);
 }

 if(keys.brake){
  speed=Math.max(speed-0.025,0);
 }

 // NITRO
 if(keys.nitro && keys.gas && nitro>0){
  speed=Math.min(speed+0.025,2.3);
  nitro=Math.max(0,nitro-0.7);
 }else{
  nitro=Math.min(100,nitro+0.12);
 }

 // STEERING
 if(keys.left)player.position.x-=0.11;
 if(keys.right)player.position.x+=0.11;

 player.position.x=Math.max(-5,Math.min(5,player.position.x));

 distance+=speed*0.1;

 // ROAD RECYCLING
 roads.forEach(road=>{
  road.position.z+=speed;
  if(road.position.z>100){
   road.position.z-=600;
  }
 });

 grounds.forEach(ground=>{
  ground.position.z+=speed;
  if(ground.position.z>100){
   ground.position.z-=600;
  }
 });

 // ROAD MARKINGS
 lines.forEach(line=>{
  line.position.z+=speed;
  if(line.position.z>12){
   line.position.z-=600;
  }
 });

 // BUILDINGS
 buildings.forEach(building=>{
  building.position.z+=speed;

  if(building.position.z>25){
   building.position.z-=540;
  }
 });

 // TREES
 trees.forEach(tree=>{
  tree.position.z+=speed;

  if(tree.position.z>25){
   tree.position.z-=560;
  }
 });

 // TRAFFIC
 if(crashTimer>0)crashTimer--;

 traffic.forEach(car=>{

  car.position.z+=speed+0.16;

  if(car.position.z>15){
   car.position.z=-150-Math.random()*100;
   car.position.x=[-3.5,0,3.5][
    Math.floor(Math.random()*3)
   ];
  }

  // COLLISION
  if(
   crashTimer===0 &&
   Math.abs(car.position.z)<3 &&
   Math.abs(car.position.x-player.position.x)<1.8
  ){
   speed=0;
   crashTimer=90;
   document.getElementById('message').textContent='CRASH! DRIVE CAREFULLY';
  }
 });

 if(crashTimer===0){
  document.getElementById('message').textContent='SYSTEM READY';
 }

 // CAMERA FOLLOW
 camera.position.set(
  player.position.x*0.65,
  5.5,
  11
 );

 camera.lookAt(
  player.position.x,
  0.8,
  -10
 );

 // HUD
 document.getElementById('speed').textContent=
 Math.round(speed*100)+' KM/H';

 document.getElementById('distance').textContent=
 'DISTANCE: '+Math.floor(distance)+' M';

 document.getElementById('nitroText').textContent=
 'NITRO '+Math.floor(nitro)+'%';

 renderer.render(scene,camera);
}

animate();

// RESIZE
onresize=()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
};
