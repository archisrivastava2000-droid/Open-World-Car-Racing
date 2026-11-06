
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 45, 230);

const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 600);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.domElement.style.position='fixed';
renderer.domElement.style.inset='0';
renderer.domElement.style.zIndex='0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
const sun = new THREE.DirectionalLight(0xffffff,2);
sun.position.set(20,30,10);
scene.add(sun);

// GROUND
const ground = new THREE.Mesh(
 new THREE.PlaneGeometry(500,600),
 new THREE.MeshStandardMaterial({color:0x399447})
);
ground.rotation.x=-Math.PI/2;
ground.position.set(0,-0.1,-200);
scene.add(ground);

// ROAD
const road = new THREE.Mesh(
 new THREE.PlaneGeometry(14,600),
 new THREE.MeshStandardMaterial({color:0x292929})
);
road.rotation.x=-Math.PI/2;
road.position.set(0,0,-200);
scene.add(road);

// ROAD LINES
const lines=[];
for(let i=0;i<50;i++){
 const line=new THREE.Mesh(
  new THREE.BoxGeometry(0.18,0.04,4),
  new THREE.MeshStandardMaterial({color:0xffffff})
 );
 line.position.set(0,0.04,-i*12);
 scene.add(line);
 lines.push(line);
}

// BUILDINGS
const buildings=[];
for(let i=0;i<35;i++){
 for(const side of [-1,1]){
  const h=10+Math.random()*18;
  const building=new THREE.Mesh(
   new THREE.BoxGeometry(6,h,9),
   new THREE.MeshStandardMaterial({
    color:[0xc9b59b,0x8996a8,0xabb6c2,0xd5d0c8][i%4]
   })
  );
  building.position.set(side*(12+Math.random()*3),h/2,-i*15-15);
  scene.add(building);
  buildings.push(building);

  // WINDOWS
  for(let floor=1;floor<h/3;floor++){
   const windowMesh=new THREE.Mesh(
    new THREE.BoxGeometry(0.8,0.8,0.08),
    new THREE.MeshStandardMaterial({color:0x9be3ff,emissive:0x163344})
   );
   windowMesh.position.set(
    building.position.x,
    floor*3,
    building.position.z+4.55
   );
   scene.add(windowMesh);
  }
 }
}

// TREES
const trees=[];
for(let i=0;i<45;i++){
 for(const side of [-1,1]){
  const trunk=new THREE.Mesh(
   new THREE.CylinderGeometry(0.2,0.3,2,8),
   new THREE.MeshStandardMaterial({color:0x654321})
  );
  trunk.position.set(side*10,1,-i*15);
  scene.add(trunk);

  const leaves=new THREE.Mesh(
   new THREE.ConeGeometry(1.6,5,8),
   new THREE.MeshStandardMaterial({color:0x12652b})
  );
  leaves.position.set(side*10,4,-i*15);
  scene.add(leaves);
  trees.push(trunk,leaves);
 }
}

// CAR CREATOR
function makeCar(color){
 const car=new THREE.Group();

 const body=new THREE.Mesh(
  new THREE.BoxGeometry(2,0.75,4),
  new THREE.MeshStandardMaterial({color,metalness:0.4,roughness:0.3})
 );
 body.position.y=0.85;
 car.add(body);

 const roof=new THREE.Mesh(
  new THREE.BoxGeometry(1.5,0.8,1.8),
  new THREE.MeshStandardMaterial({color:0x14283b,metalness:0.5})
 );
 roof.position.set(0,1.55,-0.2);
 car.add(roof);

 for(const x of [-1,1]){
  for(const z of [-1.3,1.3]){
   const wheel=new THREE.Mesh(
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

// PLAYER
const player=makeCar(0xe00020);
player.position.set(0,0,5);
scene.add(player);

// TRAFFIC
const traffic=[];
for(let i=0;i<7;i++){
 const car=makeCar([0xffcc00,0x1675dd,0xffffff,0x222222][i%4]);
 car.position.set([-3.5,0,3.5][i%3],0,-35-i*25);
 scene.add(car);
 traffic.push(car);
}

// INPUT
const keys={left:false,right:false,gas:false,brake:false};

function bind(id,key){
 const btn=document.getElementById(id);
 btn.addEventListener('pointerdown',e=>{
  e.preventDefault();
  keys[key]=true;
 });
 ['pointerup','pointerleave','pointercancel'].forEach(event=>{
  btn.addEventListener(event,()=>keys[key]=false);
 });
}

bind('left','left');
bind('right','right');
bind('gas','gas');
bind('brake','brake');

let speed=0;
let score=0;
let collisionCooldown=0;

function animate(){
 requestAnimationFrame(animate);

 if(keys.gas)speed=Math.min(speed+0.015,1.5);
 else speed=Math.max(speed-0.004,0);

 if(keys.brake)speed=Math.max(speed-0.03,0);

 if(keys.left)player.position.x-=0.12;
 if(keys.right)player.position.x+=0.12;

 player.position.x=Math.max(-5,Math.min(5,player.position.x));
 player.position.z-=speed;

 // MOVE ROAD MARKINGS
 lines.forEach(line=>{
  line.position.z+=speed;
  if(line.position.z>player.position.z+12)
   line.position.z-=600;
 });

 // MOVE BUILDINGS
 buildings.forEach(building=>{
  building.position.z+=speed;
  if(building.position.z>player.position.z+20)
   building.position.z-=525;
 });

 // MOVE TREES
 trees.forEach(tree=>{
  tree.position.z+=speed;
  if(tree.position.z>player.position.z+20)
   tree.position.z-=675;
 });

 // TRAFFIC
 if(collisionCooldown>0)collisionCooldown--;

 traffic.forEach(car=>{
  car.position.z+=speed+0.18;

  if(car.position.z>player.position.z+15){
   car.position.z=player.position.z-120-Math.random()*100;
   car.position.x=[-3.5,0,3.5][Math.floor(Math.random()*3)];
   score++;
  }

  if(collisionCooldown===0 &&
   Math.abs(car.position.z-player.position.z)<3 &&
   Math.abs(car.position.x-player.position.x)<1.8){
    speed=0;
    collisionCooldown=90;
  }
 });

 camera.position.set(
  player.position.x*0.65,
  5.5,
  player.position.z+11
 );
 camera.lookAt(player.position.x,0.8,player.position.z-10);

 document.getElementById('speed').textContent=
 Math.round(speed*100)+' KM/H';

 renderer.render(scene,camera);
}

animate();

onresize=()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
};
