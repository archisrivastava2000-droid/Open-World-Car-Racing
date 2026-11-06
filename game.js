
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);
scene.fog=new THREE.Fog(0x87ceeb,45,230);

const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.1,600);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.domElement.style.position='fixed';
renderer.domElement.style.inset='0';
renderer.domElement.style.zIndex='0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));

const sun=new THREE.DirectionalLight(0xffffff,2);
sun.position.set(20,30,10);
scene.add(sun);

// GROUND
const ground=new THREE.Mesh(
 new THREE.PlaneGeometry(500,600),
 new THREE.MeshStandardMaterial({color:0x399447})
);
ground.rotation.x=-Math.PI/2;
ground.position.set(0,-0.1,-200);
scene.add(ground);

// ROAD
const road=new THREE.Mesh(
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
  const b=new THREE.Mesh(
   new THREE.BoxGeometry(6,h,9),
   new THREE.MeshStandardMaterial({
    color:[0xc9b59b,0x8996a8,0xabb6c2,0xd5d0c8][i%4]
   })
  );
  b.position.set(side*(13+Math.random()*3),h/2,-i*15-15);
  scene.add(b);
  buildings.push(b);
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

  const leaves=new THREE.Mesh(
   new THREE.ConeGeometry(1.6,5,8),
   new THREE.MeshStandardMaterial({color:0x12652b})
  );
  leaves.position.set(side*10,4,-i*15);

  scene.add(trunk,leaves);
  trees.push(trunk,leaves);
 }
}

// CAR CREATOR
function makeCar(color){
 const car=new THREE.Group();

 const body=new THREE.Mesh(
  new THREE.BoxGeometry(2,0.75,4),
  new THREE.MeshStandardMaterial({
   color,metalness:0.5,roughness:0.3
  })
 );
 body.position.y=0.85;
 car.add(body);

 const roof=new THREE.Mesh(
  new THREE.BoxGeometry(1.5,0.8,1.8),
  new THREE.MeshStandardMaterial({color:0x14283b})
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

// PLAYER CAR
let selectedColor=0;
const colors=[0xe00020,0x0878ff,0x111111];

let player=makeCar(colors[selectedColor]);
player.position.set(0,0,5);
scene.add(player);

// CAR SELECTION
window.selectCar=function(index){
 selectedColor=index;
 scene.remove(player);
 player=makeCar(colors[index]);
 player.position.set(0,0,5);
 scene.add(player);
};

// TRAFFIC
const traffic=[];
for(let i=0;i<7;i++){
 const car=makeCar([0xffcc00,0x1675dd,0xffffff,0x222222][i%4]);
 car.position.set([-3.5,0,3.5][i%3],0,-35-i*25);
 scene.add(car);
 traffic.push(car);
}

// CONTROLS
const keys={
 left:false,right:false,gas:false,brake:false,nitro:false
};

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
bind('nitro','nitro');

let speed=0;
let distance=0;
let nitroPower=100;
let cooldown=0;

function animate(){
 requestAnimationFrame(animate);

 let boost=keys.nitro && nitroPower>0;

 if(keys.gas){
  speed=Math.min(speed+(boost?0.035:0.015),boost?2.5:1.5);
 }else{
  speed=Math.max(speed-0.004,0);
 }

 if(keys.brake){
  speed=Math.max(speed-0.03,0);
 }

 if(boost){
  nitroPower=Math.max(0,nitroPower-0.8);
 }else{
  nitroPower=Math.min(100,nitroPower+0.12);
 }

 if(keys.left)player.position.x-=0.12;
 if(keys.right)player.position.x+=0.12;

 player.position.x=Math.max(-5,Math.min(5,player.position.x));

 player.position.z-=speed;
 distance+=speed*0.1;

 // ROAD LINES
 lines.forEach(line=>{
  line.position.z+=speed;
  if(line.position.z>player.position.z+12)
   line.position.z-=600;
 });

 // BUILDINGS
 buildings.forEach(b=>{
  b.position.z+=speed;
  if(b.position.z>player.position.z+20)
   b.position.z-=525;
 });

 // TREES
 trees.forEach(t=>{
  t.position.z+=speed;
  if(t.position.z>player.position.z+20)
   t.position.z-=675;
 });

 // TRAFFIC
 if(cooldown>0)cooldown--;

 traffic.forEach(car=>{
  car.position.z+=speed+0.18;

  if(car.position.z>player.position.z+15){
   car.position.z=player.position.z-120-Math.random()*100;
   car.position.x=[-3.5,0,3.5][Math.floor(Math.random()*3)];
  }

  if(cooldown===0 &&
   Math.abs(car.position.z-player.position.z)<3 &&
   Math.abs(car.position.x-player.position.x)<1.8){
   speed=0;
   cooldown=90;
  }
 });

 // CAMERA
 camera.position.set(
  player.position.x*0.65,
  5.5,
  player.position.z+11
 );

 camera.lookAt(
  player.position.x,0.8,player.position.z-10
 );

 // HUD
 document.getElementById('speed').textContent=
 Math.round(speed*100)+' KM/H';

 document.getElementById('distance').textContent=
 'Distance: '+Math.floor(distance)+' m';

 document.getElementById('nitroText').textContent=
 'NITRO: '+Math.floor(nitroPower)+'%';

 renderer.render(scene,camera);
}

animate();

onresize=()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
};
