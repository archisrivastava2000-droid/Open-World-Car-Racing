import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb,30,150);

const camera = new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,500);
camera.position.set(0,6,12);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
const sun=new THREE.DirectionalLight(0xffffff,2);
sun.position.set(10,20,10);
scene.add(sun);

const road=new THREE.Mesh(
 new THREE.PlaneGeometry(14,500),
 new THREE.MeshStandardMaterial({color:0x292929})
);
road.rotation.x=-Math.PI/2;
road.position.z=-180;
scene.add(road);

const grass=new THREE.Mesh(
 new THREE.PlaneGeometry(500,500),
 new THREE.MeshStandardMaterial({color:0x399447})
);
grass.rotation.x=-Math.PI/2;
grass.position.y=-0.08;
grass.position.z=-180;
scene.add(grass);

for(let i=0;i<100;i++){
 for(let side of [-1,1]){
  const tree=new THREE.Mesh(
   new THREE.ConeGeometry(1.5,6,8),
   new THREE.MeshStandardMaterial({color:0x12652b})
  );
  tree.position.set(side*(12+Math.random()*15),3,-i*5);
  scene.add(tree);
 }
}

const car=new THREE.Group();
const body=new THREE.Mesh(
 new THREE.BoxGeometry(2,0.7,4),
 new THREE.MeshStandardMaterial({color:0xe00020,metalness:0.5,roughness:0.3})
);
body.position.y=0.8;
car.add(body);

const top=new THREE.Mesh(
 new THREE.BoxGeometry(1.5,0.7,1.8),
 new THREE.MeshStandardMaterial({color:0x111b30})
);
top.position.set(0,1.45,-0.2);
car.add(top);

for(let x of [-1,1]){
 for(let z of [-1.3,1.3]){
  const wheel=new THREE.Mesh(
   new THREE.CylinderGeometry(0.45,0.45,0.3,16),
   new THREE.MeshStandardMaterial({color:0x111111})
  );
  wheel.rotation.z=Math.PI/2;
  wheel.position.set(x,0.5,z);
  car.add(wheel);
 }
}
car.position.z=3;
scene.add(car);

let speed=0;
let steer=0;
const keys={left:false,right:false,gas:false,brake:false};

function bind(id,key){
 const b=document.getElementById(id);
 b.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true});
 b.addEventListener('pointerup',()=>keys[key]=false);
 b.addEventListener('pointerleave',()=>keys[key]=false);
 b.addEventListener('pointercancel',()=>keys[key]=false);
}
bind('left','left');
bind('right','right');
bind('gas','gas');
bind('brake','brake');

function animate(){
 requestAnimationFrame(animate);

 if(keys.gas)speed=Math.min(speed+0.15,3);
 else speed=Math.max(speed-0.025,0);
 if(keys.brake)speed=Math.max(speed-0.2,0);

 if(keys.left)car.position.x-=0.09;
 if(keys.right)car.position.x+=0.09;

 car.position.x=Math.max(-5,Math.min(5,car.position.x));

 steer+=(car.position.x*0.02-steer)*0.05;
 camera.position.x+=(car.position.x-camera.position.x)*0.05;
 camera.lookAt(car.position.x,1,-5);

 scene.children.forEach(obj=>{
  if(obj.userData.roadObject){
   obj.position.z+=speed;
   if(obj.position.z>15)obj.position.z-=500;
  }
 });

 document.getElementById('speed').textContent=
 Math.round(speed*60)+' KM/H';

 renderer.render(scene,camera);
}
animate();

onresize=()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
};
