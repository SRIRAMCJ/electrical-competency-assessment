import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Challenge = {
  title: string;
  symptom: string;
  question: string;
  answer: number;
  options: string[];
  explanation: string;
  fault: 'open' | 'short' | 'wrong-meter';
};

const challenges: Challenge[] = [
  {
    title: 'Dead Lamp — Find the Open Circuit',
    symptom: 'The 12V lamp is OFF even though the battery and switch are healthy.',
    question: 'Inspect the 3D circuit. Where is the fault?',
    options: ['Open connection between fuse and lamp', 'Battery polarity is reversed', 'Lamp has too much voltage', 'Switch is shorted'],
    answer: 0,
    explanation: 'The blue load-side conductor is intentionally broken between the fuse and lamp. A competent technician traces the circuit before replacing protection.',
    fault: 'open'
  },
  {
    title: 'Short Circuit — Trace the Fault',
    symptom: 'The protection has operated and the lamp never receives a stable supply.',
    question: 'What fault can you identify in the 3D wiring?',
    options: ['The switch is open', 'The positive and return conductors are bridged', 'The battery is disconnected', 'The lamp is correctly wired'],
    answer: 1,
    explanation: 'A hidden bridge connects the positive and return conductors. The fault must be isolated before restoring the protective device.',
    fault: 'short'
  },
  {
    title: 'Meter Challenge — Inspect the Instrument',
    symptom: 'You must measure the 12V battery safely before continuing the diagnosis.',
    question: 'Which meter connection shown is correct?',
    options: ['Voltmeter across battery + and − in DC mode', 'Ammeter directly across battery + and −', 'Voltmeter in series with the lamp', 'Ammeter across the open switch'],
    answer: 0,
    explanation: 'Voltage is measured in parallel across the source. An ammeter must never be placed directly across a voltage source.',
    fault: 'wrong-meter'
  }
];

type Part = { group: THREE.Group; label: string; home: THREE.Vector3 };

function makeBox(w:number,h:number,d:number, material:THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
}
function labelSprite(text:string, color='#172033') {
  const c=document.createElement('canvas'); c.width=512; c.height=128;
  const ctx=c.getContext('2d')!; ctx.clearRect(0,0,512,128);
  ctx.font='700 34px Arial'; ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,256,64);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  s.scale.set(2.4,.6,1); return s;
}
function terminal(color:number) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.08,24),new THREE.MeshStandardMaterial({color,metalness:.5,roughness:.25}));
  m.rotation.z=Math.PI/2; return m;
}
function wire(a:THREE.Vector3,b:THREE.Vector3,color:number,broken=false) {
  const g=new THREE.Group(); const mat=new THREE.MeshStandardMaterial({color,roughness:.45});
  const draw=(p1:THREE.Vector3,p2:THREE.Vector3)=>{const v=p2.clone().sub(p1), len=v.length(); const m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,10),mat); m.position.copy(p1).add(p2).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); g.add(m);};
  if(!broken) draw(a,b); else {const mid=a.clone().lerp(b,.5); const q=.22; draw(a,mid.clone().add(new THREE.Vector3(-q,0,0))); draw(mid.clone().add(new THREE.Vector3(q,0,0)),b);}
  return g;
}
function createBattery() {
  const g=new THREE.Group(); g.name='Battery';
  const body=makeBox(1.5,1.9,.9,new THREE.MeshStandardMaterial({color:0x202938,roughness:.5})); g.add(body);
  const top=makeBox(1.55,.18,.94,new THREE.MeshStandardMaterial({color:0x364152,metalness:.2})); top.position.y=1.04; g.add(top);
  const p=terminal(0xdc2626); p.position.set(-.42,1.18,0); g.add(p);
  const n=terminal(0x111827); n.position.set(.42,1.18,0); g.add(n);
  g.add(labelSprite('12V BATTERY')); g.children.at(-1)!.position.set(0,-1.25,.1);
  return g;
}
function createFuse() {
  const g=new THREE.Group(); g.name='Fuse';
  const base=makeBox(1.55,.35,.65,new THREE.MeshStandardMaterial({color:0x303846,roughness:.4})); g.add(base);
  const glass=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.75,6,16),new THREE.MeshPhysicalMaterial({color:0xe8edf4,transparent:true,opacity:.72,roughness:.1,metalness:.1})); glass.rotation.z=Math.PI/2; glass.position.y=.35; g.add(glass);
  const capMat=new THREE.MeshStandardMaterial({color:0xf0b84b,metalness:.5,roughness:.25});
  [-.52,.52].forEach(x=>{const c=terminal(0xf0b84b); c.position.set(x,.35,0); g.add(c);});
  g.add(labelSprite('FUSE')); g.children.at(-1)!.position.set(0,-.75,.1);
  return g;
}
function createSwitch() {
  const g=new THREE.Group(); g.name='Switch';
  const base=makeBox(1.45,.3,.7,new THREE.MeshStandardMaterial({color:0x303846,roughness:.45})); g.add(base);
  const a=terminal(0xdc2626); a.position.x=-.55; a.position.y=.35; g.add(a);
  const b=terminal(0x2563eb); b.position.x=.55; b.position.y=.35; g.add(b);
  const lever=makeBox(.9,.1,.12,new THREE.MeshStandardMaterial({color:0xcbd5e1,metalness:.4})); lever.position.set(0,.62,0); lever.rotation.z=-.32; g.add(lever);
  g.add(labelSprite('SWITCH • ON')); g.children.at(-1)!.position.set(0,-.7,.1);
  return g;
}
function createLamp() {
  const g=new THREE.Group(); g.name='Lamp';
  const base=makeBox(1.1,.45,.7,new THREE.MeshStandardMaterial({color:0x303846})); g.add(base);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.48,32,20),new THREE.MeshStandardMaterial({color:0xf2f4f7,emissive:0x000000,roughness:.18})); bulb.position.y=.7; g.add(bulb);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.35,20),new THREE.MeshStandardMaterial({color:0xc0c6d0,metalness:.6})); neck.position.y=.3; g.add(neck);
  g.add(labelSprite('12V LAMP')); g.children.at(-1)!.position.set(0,-.7,.1);
  return g;
}
function createMeter(kind:'voltmeter'|'ammeter') {
  const g=new THREE.Group(); g.name=kind;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.3,32),new THREE.MeshStandardMaterial({color:0x1f2937,roughness:.4})); body.rotation.x=Math.PI/2; g.add(body);
  const face=new THREE.Mesh(new THREE.CircleGeometry(.6,32),new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.6})); face.position.z=.17; g.add(face);
  const needle=new THREE.Mesh(new THREE.BoxGeometry(.05,.48,.03),new THREE.MeshStandardMaterial({color:0xdc2626})); needle.position.set(0,.08,.2); needle.rotation.z=.25; g.add(needle);
  g.add(labelSprite(kind==='voltmeter'?'V • DC':'A • DC')); g.children.at(-1)!.position.set(0,-.95,.2);
  return g;
}

export default function InteractiveActivity({onFinish}:{onFinish:(score:number)=>void}) {
  const mount=useRef<HTMLDivElement>(null);
  const [round,setRound]=useState(0);
  const [selected,setSelected]=useState<number|null>(null);
  const [checked,setChecked]=useState(false);
  const [score,setScore]=useState(0);
  const [mode,setMode]=useState<'inspect'|'move'>('inspect');
  const [notice,setNotice]=useState('Drag to rotate • wheel to zoom • right-drag to pan. Click Move mode to reposition components.');
  const challenge=challenges[round];

  useEffect(()=>{
    if(!mount.current) return;
    const host=mount.current; const scene=new THREE.Scene(); scene.background=new THREE.Color(0xf7f9fc);
    scene.fog=new THREE.Fog(0xf7f9fc,10,24);
    const camera=new THREE.PerspectiveCamera(42,host.clientWidth/Math.max(host.clientHeight,1),.1,100); camera.position.set(7,6.5,9);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; host.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.target.set(0,.4,0); controls.minDistance=5; controls.maxDistance=16; controls.maxPolarAngle=Math.PI*.49;
    scene.add(new THREE.HemisphereLight(0xffffff,0xcbd5e1,2.2)); const dl=new THREE.DirectionalLight(0xffffff,3); dl.position.set(5,9,6); dl.castShadow=true; scene.add(dl);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(16,.25,10),new THREE.MeshStandardMaterial({color:0xe9edf2,roughness:.85})); floor.position.y=-1.15; floor.receiveShadow=true; scene.add(floor);
    const back=new THREE.Mesh(new THREE.BoxGeometry(16,6,.18),new THREE.MeshStandardMaterial({color:0xf0f3f7})); back.position.set(0,1.7,-3.6); scene.add(back);
    const title=labelSprite('3D ELECTRICAL TROUBLESHOOTING LAB','#52627a'); title.scale.set(4.8,.8,1); title.position.set(0,2.65,-2.9); scene.add(title);

    const battery=createBattery(), fuse=createFuse(), sw=createSwitch(), lamp=createLamp(), vm=createMeter('voltmeter'), am=createMeter('ammeter');
    battery.position.set(-5,0,0); fuse.position.set(-2.8,0,0); sw.position.set(-.4,0,0); lamp.position.set(2.2,0,0); vm.position.set(5,.1,1.4); am.position.set(5,.1,-1.3);
    [battery,fuse,sw,lamp,vm,am].forEach(g=>{g.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);});
    const parts:Part[]=[battery,fuse,sw,lamp,vm,am].map(g=>({group:g,label:g.name,home:g.position.clone()}));

    const groundY=-.98;
    const makeWires=()=>{
      const group=new THREE.Group(); const bp=new THREE.Vector3(-4.25,.85,0), fi=new THREE.Vector3(-3.55,.35,0), fo=new THREE.Vector3(-2.05,.35,0), si=new THREE.Vector3(-.95,.35,0), so=new THREE.Vector3(.15,.35,0), lp=new THREE.Vector3(1.7,.65,0), lm=new THREE.Vector3(1.7,-.15,0), bm=new THREE.Vector3(-4.25,.55,0);
      group.add(wire(bp,fi,0xdc2626)); group.add(wire(fo,si,0xdc2626)); group.add(wire(so,lp,0x2563eb,challenge.fault==='open')); group.add(wire(lm,bm,0x111827));
      if(challenge.fault==='short') group.add(wire(new THREE.Vector3(-1.5,.35,.45),new THREE.Vector3(-1.5,.35,-.45),0xdc2626));
      if(challenge.fault==='wrong-meter') { vm.position.set(3.8,.1,1.1); am.position.set(3.8,.1,-1.1); }
      return group;
    };
    const wires=makeWires(); scene.add(wires);
    const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(); let drag:THREE.Group|null=null; const plane=new THREE.Plane(new THREE.Vector3(0,1,0),groundY); const hit=new THREE.Vector3();
    const onDown=(e:PointerEvent)=>{
      const r=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer,camera);
      const hits=ray.intersectObjects(parts.flatMap(p=>p.group.children),true);
      if(mode==='move'&&hits.length){drag=parts.find(p=>p.group===hits[0].object.parent||p.group===hits[0].object)!.group; controls.enabled=false; renderer.domElement.setPointerCapture(e.pointerId);}
    };
    const onMove=(e:PointerEvent)=>{if(!drag)return; const r=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer,camera); if(ray.ray.intersectPlane(plane,hit)) drag.position.set(hit.x,0,hit.z);};
    const onUp=()=>{if(drag){controls.enabled=true;drag=null;}};
    renderer.domElement.addEventListener('pointerdown',onDown); renderer.domElement.addEventListener('pointermove',onMove); renderer.domElement.addEventListener('pointerup',onUp);
    let frame=0; const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}; animate();
    const resize=()=>{camera.aspect=host.clientWidth/Math.max(host.clientHeight,1);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);}; window.addEventListener('resize',resize);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointerup',onUp);controls.dispose();renderer.dispose();host.removeChild(renderer.domElement);};
  },[round,mode]);

  const choose=(i:number)=>{if(checked)return;setSelected(i);setChecked(true);if(i===challenge.answer)setScore(s=>s+5);};
  const next=()=>{if(round===challenges.length-1){onFinish(score+(selected===challenge.answer?0:0));return;}setRound(r=>r+1);setSelected(null);setChecked(false);setNotice('New circuit loaded. Rotate, zoom and inspect every connection before answering.');};

  return <div className="activityPage threeLab">
    <style>{css}</style>
    <header className="activityHeader"><div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><strong>Technical Activity</strong></div><div className="activityScore">⚡ {score}/15</div></header>
    <main className="activityMain">
      <div className="activityIntro"><div><div className="eyebrow">STAGE 2 • 3D INTERACTIVE VALIDATION</div><h1>Electrical <span>Troubleshooting Lab</span></h1><p>Inspect the circuit in 3D, rotate and zoom to trace the wiring, move components when you need a better view, then identify the fault.</p></div><div className="activityProgress"><b>{round+1}/3</b><small>challenges</small></div></div>
      <div className="activityTrack"><i style={{width:`${((round+1)/3)*100}%`}}/></div>
      <section className="labGrid">
        <section className="labSceneCard"><div className="sceneToolbar"><div><b>Interactive 3D Circuit</b><small>Orbit • zoom • pan • move components</small></div><div className="modeButtons"><button className={mode==='inspect'?'active':''} onClick={()=>setMode('inspect')}>↻ Inspect</button><button className={mode==='move'?'active':''} onClick={()=>setMode('move')}>✋ Move</button></div></div><div className="threeViewport" ref={mount}/><div className="sceneHint"><span>🖱️ Drag = rotate</span><span>◉ Wheel = zoom</span><span>⇧ Right-drag = pan</span><span>✋ Move mode = drag parts</span></div></section>
        <section className="activityCard activityQuestion labQuestion">
          <div className="questionMeta"><span>Challenge {round+1} of 3</span><span>5 points</span></div>
          <div className="fieldBadge">FIELD SYMPTOM</div><h2>{challenge.title}</h2><p className="symptom">{challenge.symptom}</p>
          <div className="labRule"><b>Technician rule</b><span>Think → inspect → verify → act</span></div>
          <h3>{challenge.question}</h3>
          <div className="activityOptions">{challenge.options.map((o,i)=>{const state=!checked?'':i===challenge.answer?'correct':i===selected?'wrong':'';return <button key={o} className={state} onClick={()=>choose(i)} disabled={checked}><b>{String.fromCharCode(65+i)}</b><span>{o}</span>{checked&&i===challenge.answer&&<em>✓</em>}{checked&&i===selected&&i!==challenge.answer&&<em>×</em>}</button>})}</div>
          {checked&&<div className={`activityFeedback ${selected===challenge.answer?'good':'bad'}`}><b>{selected===challenge.answer?'Correct diagnosis':'Review the circuit'}</b><p>{challenge.explanation}</p></div>}
          <div className="activityActions"><span>{checked?(selected===challenge.answer?'+5 points':'0 points'):'Inspect the 3D model before selecting an answer.'}</span>{checked&&<button className="activityPrimary" onClick={next}>{round===2?'Continue to practical →':'Next challenge →'}</button>}</div>
        </section>
      </section>
    </main>
  </div>;
}

const css=`*{box-sizing:border-box}.threeLab{min-height:100vh;width:100%;padding:0 28px 60px;background:radial-gradient(circle at 50% 0,#fff 0,#f3f6fb 65%);color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.activityHeader{width:100%;max-width:1240px;margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}.activityHeader strong{display:block;font-size:20px;margin-top:3px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#71809a;text-transform:uppercase}.activityScore{min-width:92px;padding:11px 16px;border-radius:14px;background:#141c2e;color:#fff;text-align:center;font-weight:800}.activityMain{width:100%;max-width:1240px;margin:22px auto 0}.activityIntro{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}.activityIntro h1{margin:12px 0 10px;color:#151d2f;font-size:46px;line-height:1.08}.activityIntro h1 span{color:#3863ed}.activityIntro p{margin:0;max-width:820px;color:#68758b;font-size:16px;line-height:1.65}.activityProgress{padding:14px 18px;border-radius:15px;background:#141c2e;color:#fff;text-align:center}.activityProgress b,.activityProgress small{display:block}.activityProgress small{margin-top:3px;font-size:9px;color:#b9c1d1}.activityTrack{height:7px;margin:24px 0 20px;background:#e5e9f0;border-radius:99px;overflow:hidden}.activityTrack i{display:block;height:100%;background:#3863ed;border-radius:99px;transition:.25s}.labGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(350px,.85fr);gap:20px;align-items:stretch}.labSceneCard{background:#fff;border:1px solid #e1e6ee;border-radius:20px;box-shadow:0 14px 35px rgba(23,32,51,.07);padding:18px;min-width:0}.sceneToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.sceneToolbar b,.sceneToolbar small{display:block}.sceneToolbar small{font-size:10px;color:#8290a4;margin-top:3px}.modeButtons{display:flex;gap:7px}.modeButtons button{border:1px solid #dfe5ee;background:#fff;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:800;color:#56647b}.modeButtons button.active{background:#3863ed;border-color:#3863ed;color:#fff}.threeViewport{height:520px;min-height:420px;border-radius:15px;overflow:hidden;background:#f7f9fc;cursor:grab}.threeViewport:active{cursor:grabbing}.threeViewport canvas{display:block;width:100%;height:100%}.sceneHint{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sceneHint span{font-size:9px;font-weight:800;color:#68758b;background:#f4f6f9;border:1px solid #e3e7ed;border-radius:99px;padding:7px 9px}.labQuestion{padding:25px}.fieldBadge{display:inline-block;margin-top:24px;padding:6px 9px;border-radius:8px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:1px}.labQuestion h2{margin:10px 0 8px;font-size:24px;line-height:1.2}.symptom{margin:0;color:#68758b;font-size:13px;line-height:1.65}.labRule{margin:18px 0;padding:12px;border:1px solid #e4e9f1;border-radius:12px;background:#f7f9fd}.labRule b,.labRule span{display:block}.labRule b{font-size:10px;color:#3863ed}.labRule span{font-size:11px;color:#69768a;margin-top:4px}.labQuestion h3{font-size:16px;line-height:1.35;margin:20px 0 12px}.activityOptions{display:grid;gap:9px}.activityOptions button{width:100%;display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #dfe5ee;border-radius:12px;background:#fff;color:#172033;font:inherit;font-size:12px;text-align:left}.activityOptions button b{flex:0 0 30px;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#eef2f7}.activityOptions button span{flex:1}.activityOptions button em{margin-left:auto;font-style:normal;font-size:17px;font-weight:900}.activityOptions button.correct{border-color:#9ad9b4;background:#f0fbf4}.activityOptions button.wrong{border-color:#f0a4a4;background:#fff5f5}.activityFeedback{margin-top:13px;padding:12px;border-radius:12px}.activityFeedback.good{background:#eefbf2;border:1px solid #b8e6c7}.activityFeedback.bad{background:#fff5f5;border:1px solid #f1c2c2}.activityFeedback p{font-size:10px;color:#68758b;line-height:1.55;margin:5px 0 0}.activityActions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;color:#7a8799;font-size:10px;font-weight:700}.activityPrimary{border:0;border-radius:11px;padding:12px 15px;background:#3863ed;color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}@media(max-width:1050px){.labGrid{grid-template-columns:1fr}.threeViewport{height:500px}.activityIntro{align-items:flex-start}}@media(max-width:600px){.threeLab{padding:0 12px 40px}.activityIntro{display:block}.activityIntro h1{font-size:32px}.activityProgress{display:inline-block;margin-top:16px}.labSceneCard{padding:12px}.threeViewport{height:400px;min-height:350px}.sceneToolbar{align-items:flex-start;flex-direction:column}.labQuestion{padding:20px}.activityActions{align-items:stretch;flex-direction:column}.activityPrimary{width:100%}.sceneHint span{font-size:8px}}`;
