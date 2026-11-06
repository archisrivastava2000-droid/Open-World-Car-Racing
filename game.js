
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb,40,220);

const camera = new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,500);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.domElement.style.position='fixed';
renderer.domElement.style.inset='0';
renderer.domElement.style.zIndex='0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
const sun=new THREE.DirectionalLight(0xffffff,2);
sun.position.set(10,20,10);
scene.add(sun);

// ROAD AND GRASS
const road=new THREE.Mesh(
 new THREE.PlaneGeometry(14,500),
 new THREE.MeshStandardMaterial({color:0x292929})
);
road.rotation.x=-Math.PI/2;
scene.add(road);

const grass=new THREE.Mesh(
 new THREE.PlaneGeometry(500,500),
 new THREE.MeshStandardMaterial({color:0x399447})
);
grass.rotation.x=-Math.PI/2;
grass.position.y=-0.1;
scene.add(grass);

// ROAD MARKINGS
const markings=[];
for(let i=0;i<35;i++){
 const line=new THREE.Mesh(
  new THREE.BoxGeometry(0.16,0.025,4),
  new THREE.MeshStandardMaterial({color:0xffffff})
 );
 line.position.set(0,0.02,-i*12);
 scene.add(line);
 markings.push(line);
}

// BUILDINGS AND TREES
const objects=[];
for(let i=0;i<45;i++){
 for(const side of [-1,1]){
  const h=8+Math.random()*20;
  const building=new THREE.Mesh(
   new THREE.BoxGeometry(7,h,9),
   new THREE.MeshStandardMaterial({
    color:[0x8d99ae,0xc9a77c,0x9cabb8,0x777f91][i%4]
   })
  );
  building.position.set(side*(19+Math.random()*10),h/2,-i*12);
  scene.add(building);
  objects.push(building);

  const tree=new THREE.Mesh(
   new THREE.ConeGeometry(1.5,6,8),
   new THREE.MeshStandardMaterial({color:0x12652b})
  );
  tree.position.set(side*13,3,-i*12-5);
  scene.add(tree);
  objects.push(tree);
 }
}

// PLAYER CAR
function makeCar(color){
 const car=new THREE.Group();

 const body=new THREE.Mesh(
  new THREE.BoxGeometry(2,0.7,4),
  new THREE.MeshStandardMaterial({color,metalness:0.4,roughness:0.3})
 );
 body.position.y=0.8;
 car.add(body);

 const cabin=new THREE.Mesh(
  new THREE.BoxGeometry(1.5,0.7,1.8),
  new THREE.MeshStandardMaterial({color:0x17283b,metalness:0.5})
 );
 cabin.position.set(0,1.4,-0.2);
 car.add(cabin);

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

const player=makeCar(0xe00020);
player.position.set(0,0,3);
scene.add(player);

// TRAFFIC
const traffic=[];
for(let i=0;i<7;i++){
 const car=makeCar([0xffcc00,0x1675dd,0xffffff,0x222222][i%4]);
 car.position.set([-3.5,0,3.5][i%3],0,-35-i*32);
 scene.add(car);
 traffic.push(car);
}

// CONTROLS
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
let crashed=false;

function animate(){
 requestAnimationFrame(animate);

 if(keys.gas)speed=Math.min(speed+0.012,1.5);
 else speed=Math.max(speed-0.004,0);

 if(keys.brake)speed=Math.max(speed-0.025,0);

 if(keys.left)player.position.x-=0.11;
 if(keys.right)player.position.x+=0.11;

 player.position.x=Math.max(-5,Math.min(5,player.position.x));

 player.position.z-=speed;

 // FOLLOW ROAD
 road.position.z=player.position.z-180;
 grass.position.z=player.position.z-180;

 markings.forEach(line=>{
  line.position.z+=speed;
  if(line.position.z>player.position.z+10){
   line.position.z-=420;
  }
 });

 // BUILDINGS AND TREES
 objects.forEach(obj=>{
  if(obj.position.z>player.position.z+20){
   obj.position.z-=540;
  }
 });

 // TRAFFIC MOVEMENT AND COLLISION
 traffic.forEach(car=>{
  car.position.z+=speed+0.18;

  if(car.position.z>player.position.z+15){
   car.position.z=player.position.z-130-Math.random()*100;
   car.position.x=[-3.5,0,3.5][Math.floor(Math.random()*3)];
   score++;
  }

  if(Math.abs(car.position.z-player.position.z)<3.5 &&
     Math.abs(car.position.x-player.position.x)<1.8){
   speed=0;
   crashed=true;
  }
 });

 camera.position.set(
  player.position.x*0.7,
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
