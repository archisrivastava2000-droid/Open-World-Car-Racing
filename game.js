
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 180);

const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.domElement.style.position='fixed';
renderer.domElement.style.inset='0';
renderer.domElement.style.zIndex='0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
const sun = new THREE.DirectionalLight(0xffffff,2);
sun.position.set(10,20,10);
scene.add(sun);

const road = new THREE.Mesh(
 new THREE.PlaneGeometry(14,500),
 new THREE.MeshStandardMaterial({color:0x292929})
);
road.rotation.x=-Math.PI/2;
road.position.set(0,0,-180);
scene.add(road);

const grass = new THREE.Mesh(
 new THREE.PlaneGeometry(500,500),
 new THREE.MeshStandardMaterial({color:0x399447})
);
grass.rotation.x=-Math.PI/2;
grass.position.set(0,-0.08,-180);
scene.add(grass);

const trees=[];
for(let i=0;i<100;i++){
 for(const side of [-1,1]){
  const tree=new THREE.Mesh(
   new THREE.ConeGeometry(1.5,6,8),
   new THREE.MeshStandardMaterial({color:0x12652b})
  );
  tree.position.set(side*(12+Math.random()*15),3,-i*5);
  scene.add(tree);
  trees.push(tree);
 }
}

// SPORTS CAR
const car=new THREE.Group();

const body=new THREE.Mesh(
 new THREE.BoxGeometry(2,0.7,4),
 new THREE.MeshStandardMaterial({color:0xe00020,metalness:0.5,roughness:0.3})
);
body.position.y=0.8;
car.add(body);

const cabin=new THREE.Mesh(
 new THREE.BoxGeometry(1.5,0.7,1.8),
 new THREE.MeshStandardMaterial({color:0x101b30,metalness:0.5})
);
cabin.position.set(0,1.45,-0.2);
car.add(cabin);

for(const x of [-1,1]){
 for(const z of [-1.3,1.3]){
  const wheel=new THREE.Mesh(
   new THREE.CylinderGeometry(0.45,0.45,0.3,20),
   new THREE.MeshStandardMaterial({color:0x111111})
  );
  wheel.rotation.z=Math.PI/2;
  wheel.position.set(x,0.5,z);
  car.add(wheel);
 }
}

car.position.set(0,0,3);
scene.add(car);

let speed=0;
const keys={left:false,right:false,gas:false,brake:false};

function bind(id,key){
 const b=document.getElementById(id);
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();
  keys[key]=true;
 });
 ['pointerup','pointerleave','pointercancel'].forEach(event=>{
  b.addEventListener(event,()=>keys[key]=false);
 });
}
bind('left','left');
bind('right','right');
bind('gas','gas');
bind('brake','brake');

function animate(){
 requestAnimationFrame(animate);

 if(keys.gas) speed=Math.min(speed+0.012,1.5);
 else speed=Math.max(speed-0.004,0);

 if(keys.brake) speed=Math.max(speed-0.025,0);

 if(keys.left) car.position.x-=0.12;
 if(keys.right) car.position.x+=0.12;

 car.position.x=Math.max(-5,Math.min(5,car.position.x));

 car.position.z-=speed;

 trees.forEach(tree=>{
  if(tree.position.z>car.position.z+15){
   tree.position.z-=500;
  }
 });

 camera.position.set(
  car.position.x*0.7,
  5.5,
  car.position.z+11
 );

 camera.lookAt(
  car.position.x,
  0.8,
  car.position.z-10
 );

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
